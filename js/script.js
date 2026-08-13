/* =====================================================================
   PAPA KA RADIO — script.js
   Cleaned & consolidated. One implementation each for:
     - the YouTube-backed radio player
     - the info popup
     - the review popup
   The old file assigned .onclick to memoryBtn/popup TWICE with two
   different show/hide strategies (classList vs inline style.display),
   so whichever block ran last silently won and the other was dead
   code — that's the "duplicate declaration / duplicate handler"
   architecture problem. There is now exactly one code path for each
   feature, using the .active class the CSS already defines.

   reviews.js / firebase.js are untouched — they still only need the
   same element IDs (#reviewPopup, .stars[data-star], #reviewText,
   #submitReview, #reviewMsg, #openReview), all of which are unchanged.
===================================================================== */

(function(){
  "use strict";

  /* =====================================================
     1. YOUTUBE-BACKED RADIO PLAYER
  ===================================================== */

  let player = null;
  let playerReady = false;
  let playerCreationStarted = false;   // guards against ever creating a 2nd player
  let ytApiRequested = false;          // guards against injecting the iframe_api script twice
  let pendingSong = null;
  let isPlaying = false;
  let updateInterval = null;
  let currentSong = 0;
  let ytLoadTimeout = null;

  const led = document.getElementById("led");
  const statusText = document.getElementById("statusText");
  const tuning = document.getElementById("tuning");
  const startBtn = document.getElementById("startBtn");
  const musicPlayer = document.getElementById("player");
  const albumEl = document.getElementById("album");
  const playBtn = document.getElementById("playBtn");
  const titleEl = document.getElementById("title");
  const artistEl = document.getElementById("artist");
  const progressEl = document.getElementById("progress");
  const currentTimeEl = document.getElementById("currentTime");
  const durationEl = document.getElementById("duration");

  /**
   * Lazily injects the YouTube iframe API script — only the first time
   * the visitor actually presses the radio button, and only once ever.
   * This keeps first paint / interactivity fast and means a blocked or
   * reset connection to youtube.com never delays the rest of the site.
   */
  function loadYouTubeApiOnce(){
    if(ytApiRequested) return;
    ytApiRequested = true;

    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    tag.onerror = function(){
      console.warn("YouTube iframe API failed to load — radio will stay unavailable, rest of the site still works.");
      showTuningMessage("रेडियो अभी लोड नहीं हो पाया, फिर कोशिश करें");
    };
    document.head.appendChild(tag);

    // If the API never calls back (offline / blocked), don't leave the
    // UI stuck on "loading" forever.
    ytLoadTimeout = setTimeout(function(){
      if(!playerReady){
        showTuningMessage("रेडियो लोड होने में समय लग रहा है...");
      }
    }, 8000);
  }

  window.onYouTubeIframeAPIReady = function(){
    createPlayerOnce();
  };

  function createPlayerOnce(){
    if(playerCreationStarted) return; // never create a second YT.Player
    playerCreationStarted = true;

    player = new YT.Player("youtube-player", {
      height: "1",
      width: "1",
      videoId: "",
      playerVars: { autoplay: 0, controls: 0, playsinline: 1 },
      events: {
        onReady: function(event){
          playerReady = true;
          clearTimeout(ytLoadTimeout);

          event.target.unMute();
          event.target.setVolume(100);

          if(pendingSong !== null){
            const song = pendingSong;
            pendingSong = null;
            setTimeout(function(){ playSong(song); }, 400);
          }
        },
        onStateChange: onPlayerStateChange,
        onError: function(event){
          console.warn("YouTube error code:", event.data, "— skipping track", playlist[currentSong] && playlist[currentSong].title);
          setTimeout(nextSong, 1000);
        }
      }
    });
  }

  function onPlayerStateChange(event){
    if(event.data === YT.PlayerState.ENDED){
      nextSong(); // auto-play next song
    }
  }

  if(startBtn){
    startBtn.addEventListener("click", function(){
      if(musicPlayer.classList.contains("show")){
        musicPlayer.classList.remove("show");
        radioOff();
        if(player && playerReady) player.pauseVideo();
        isPlaying = false;
        if(playBtn) playBtn.innerHTML = "▶";
        startBtn.innerHTML = "📻 रेडियो चालू करें";
      } else {
        musicPlayer.classList.add("show");
        radioOn();
        loadYouTubeApiOnce();     // first genuine user gesture — safe & lazy
        playSong(currentSong);
        startBtn.innerHTML = "📻 रेडियो बंद करें";
      }
    });
  }

  function playSong(index){
    showTuning();

    if(!playerReady){
      pendingSong = index;
      return;
    }

    currentSong = index;
    const song = playlist[index];
    if(!song){
      console.warn("No song at index", index);
      return;
    }

    if(albumEl) albumEl.classList.add("rotate");

    player.stopVideo();
    player.loadVideoById({ videoId: song.youtubeId, startSeconds: 0 });
    player.unMute();
    player.setVolume(100);

    setTimeout(function(){
      if(player.getPlayerState() !== YT.PlayerState.PLAYING){
        player.playVideo();
      }
    }, 1200);

    if(titleEl) titleEl.innerText = song.title || "पापा का रेडियो";
    if(artistEl) artistEl.innerText = song.artist || "90s Memories";

    startProgress();
    isPlaying = true;
    if(playBtn) playBtn.innerHTML = "⏸";
  }

  function playPause(){
    if(!playerReady || !player) return;

    if(isPlaying){
      player.pauseVideo();
      isPlaying = false;
      if(playBtn) playBtn.innerHTML = "▶";
    } else {
      player.unMute();
      player.setVolume(100);
      player.playVideo();
      isPlaying = true;
      if(playBtn) playBtn.innerHTML = "⏸";
    }
  }

  function nextSong(){
    currentSong++;
    if(currentSong >= playlist.length) currentSong = 0;
    playSong(currentSong);
  }

  function previousSong(){
    currentSong--;
    if(currentSong < 0) currentSong = playlist.length - 1;
    playSong(currentSong);
  }

  function startProgress(){
    clearInterval(updateInterval);
    updateInterval = setInterval(function(){
      if(!player || typeof player.getCurrentTime !== "function") return;

      const current = player.getCurrentTime();
      const duration = player.getDuration();

      if(duration){
        const percentage = (current / duration) * 100;
        if(progressEl) progressEl.value = percentage;
        if(currentTimeEl) currentTimeEl.innerText = formatTime(current);
        if(durationEl) durationEl.innerText = formatTime(duration);
      }
    }, 1000);
  }

  function formatTime(time){
    const minutes = Math.floor(time / 60);
    let seconds = Math.floor(time % 60);
    if(seconds < 10) seconds = "0" + seconds;
    return minutes + ":" + seconds;
  }

  if(progressEl){
    progressEl.addEventListener("input", function(){
      if(!player || typeof player.getDuration !== "function") return;
      const duration = player.getDuration();
      const seek = (duration * this.value) / 100;
      player.seekTo(seek, true);
    });
  }

  function radioOn(){
    if(led) led.classList.add("active");
    if(statusText) statusText.innerHTML = "रेडियो चल रहा है 🔴";
  }

  function radioOff(){
    if(led) led.classList.remove("active");
    if(statusText) statusText.innerHTML = "रेडियो बंद है";
  }

  function showTuning(){
    if(!tuning) return;
    tuning.classList.add("cassette-loading");
    tuning.innerHTML = "📼 Cassette बदल रहा है...";
    setTimeout(function(){
      tuning.innerHTML = "";
      tuning.classList.remove("cassette-loading");
    }, 1200);
  }

  function showTuningMessage(msg){
    if(!tuning) return;
    tuning.classList.remove("cassette-loading");
    tuning.innerHTML = msg;
  }

  // expose the controls the inline onclick="" attributes in index.html need
  window.playPause = playPause;
  window.nextSong = nextSong;
  window.previousSong = previousSong;


  /* =====================================================
     2. INFO POPUP + REVIEW POPUP
     Single implementation, single source of truth (.active class,
     matching the CSS). No inline style.display, no window.onclick
     (which would silently overwrite any handler reviews.js/firebase.js
     might also want to attach to window).
  ===================================================== */

  const memoryBtn = document.getElementById("memoryBtn");
  const infoPopup = document.getElementById("infoPopup");
  const closePopupBtn = document.getElementById("closePopup");
  const openReviewBtn = document.getElementById("openReview");
  const reviewPopup = document.getElementById("reviewPopup");
  const closeReviewBtn = document.getElementById("closeReview");

  function openPopup(el){ if(el) el.classList.add("active"); }
  function closePopupEl(el){ if(el) el.classList.remove("active"); }

  if(memoryBtn && infoPopup){
    memoryBtn.addEventListener("click", function(){ openPopup(infoPopup); });
  }

  if(closePopupBtn && infoPopup){
    closePopupBtn.addEventListener("click", function(){ closePopupEl(infoPopup); });
  }

  if(openReviewBtn && infoPopup && reviewPopup){
    openReviewBtn.addEventListener("click", function(){
      closePopupEl(infoPopup);
      openPopup(reviewPopup);
    });
  }

  if(closeReviewBtn && reviewPopup){
    closeReviewBtn.addEventListener("click", function(){ closePopupEl(reviewPopup); });
  }

  // click on the dark overlay (outside the card) closes that popup
  [infoPopup, reviewPopup].forEach(function(overlay){
    if(!overlay) return;
    overlay.addEventListener("click", function(e){
      if(e.target === overlay) closePopupEl(overlay);
    });
  });

  // Escape key closes whichever popup is open
  document.addEventListener("keydown", function(e){
    if(e.key !== "Escape") return;
    if(infoPopup && infoPopup.classList.contains("active")) closePopupEl(infoPopup);
    if(reviewPopup && reviewPopup.classList.contains("active")) closePopupEl(reviewPopup);
  });


  /* =====================================================
     3. BASIC PROTECTION (unchanged from the original)
  ===================================================== */
  document.addEventListener("contextmenu", function(e){ e.preventDefault(); });

  document.addEventListener("keydown", function(e){
    if(
      e.key === "F12" ||
      (e.ctrlKey && e.shiftKey && e.key === "I") ||
      (e.ctrlKey && e.shiftKey && e.key === "J")
    ){
      e.preventDefault();
    }
  });

})();
function loadDailyDiary(){

    const yearElement = document.querySelector(".diary-year");
    const quoteElement = document.querySelector(".diary-text");


    if(!yearElement || !quoteElement){
        return;
    }


    const today = new Date();

    const index = today.getDate() % diaryQuotes.length;


    yearElement.innerHTML = diaryQuotes[index].year;


    quoteElement.innerHTML = diaryQuotes[index].quote;

}


document.addEventListener(
"DOMContentLoaded",
loadDailyDiary
);