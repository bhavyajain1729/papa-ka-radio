let player;
let playerReady=false;
let pendingSong=null;
let isPlaying=false;
let updateInterval;
let currentSong=0;

const led=document.getElementById("led");
const statusText=document.getElementById("statusText");
const tuning=document.getElementById("tuning");
const startBtn=document.getElementById("startBtn");
const musicPlayer=document.getElementById("player");

window.onYouTubeIframeAPIReady=function(){
createPlayer();
};

function createPlayer(){

player=new YT.Player("youtube-player",{

height:"1",
width:"1",

videoId:playlist[0].youtubeId,

playerVars:{
autoplay:0,
controls:0,
playsinline:1
},

events:{

onReady:(event)=>{

console.log("Radio Ready");

playerReady=true;

event.target.unMute();
event.target.setVolume(100);

if(pendingSong!==null){

let song=pendingSong;
pendingSong=null;

setTimeout(()=>{
playSong(song);
},500);

}

},

onStateChange:onPlayerStateChange,

onError:(event)=>{

console.log(
"YouTube Error Code:",
event.data
);

console.log(
"Skipping Song:",
playlist[currentSong].title
);

setTimeout(()=>{

nextSong();

},1000);

}
}

});

}


if(startBtn){

startBtn.onclick=function(){

if(musicPlayer.classList.contains("show")){

musicPlayer.classList.remove("show");

radioOff();

if(player){

player.pauseVideo();

}

isPlaying=false;

document.getElementById("playBtn").innerHTML="▶";

startBtn.innerHTML="📻 रेडियो चालू करें";

}

else{

musicPlayer.classList.add("show");

radioOn();

playSong(currentSong);

startBtn.innerHTML="📻 रेडियो बंद करें";

}

};

}



function playSong(index){

showTuning();


if(!playerReady){

console.log("Player loading...");

pendingSong=index;

return;

}


currentSong=index;


let song=playlist[index];


console.log("Now Playing:",song.title,song.youtubeId);


document.getElementById("album").classList.add("rotate");


player.stopVideo();

player.loadVideoById({
videoId:song.youtubeId,
startSeconds:0
});

player.unMute();
player.setVolume(100);

setTimeout(()=>{

let state=player.getPlayerState();

if(state!==YT.PlayerState.PLAYING){

player.playVideo();

}

},1500);


setTimeout(()=>{

document.getElementById("title").innerText=song.title;

document.getElementById("artist").innerText=song.artist;

},500);


startProgress();


isPlaying=true;

document.getElementById("playBtn").innerHTML="⏸";

}



function playPause(){

if(!playerReady){

return;

}


if(isPlaying){

player.pauseVideo();

isPlaying=false;

document.getElementById("playBtn").innerHTML="▶";

}

else{

player.unMute();
player.setVolume(100);
player.playVideo();

isPlaying=true;

document.getElementById("playBtn").innerHTML="⏸";

}

}



function nextSong(){

currentSong++;

if(currentSong>=playlist.length){

currentSong=0;

}

playSong(currentSong);

}



function previousSong(){

currentSong--;

if(currentSong<0){

currentSong=playlist.length-1;

}

playSong(currentSong);

}



function onPlayerStateChange(event){

if(event.data===YT.PlayerState.ENDED){

nextSong();

}

}



function startProgress(){

clearInterval(updateInterval);


updateInterval=setInterval(()=>{

if(!player){

return;

}


let current=player.getCurrentTime();

let duration=player.getDuration();


if(duration){

let percentage=(current/duration)*100;

document.getElementById("progress").value=percentage;

document.getElementById("currentTime").innerText=formatTime(current);

document.getElementById("duration").innerText=formatTime(duration);

}

},1000);

}



function formatTime(time){

let minutes=Math.floor(time/60);

let seconds=Math.floor(time%60);


if(seconds<10){

seconds="0"+seconds;

}


return minutes+":"+seconds;

}



const progress=document.getElementById("progress");


if(progress){

progress.addEventListener("input",function(){

if(!player){

return;

}


let duration=player.getDuration();

let seek=(duration*this.value)/100;


player.seekTo(seek,true);

});

}



function radioOn(){

if(led){

led.classList.add("active");

}


if(statusText){

statusText.innerHTML="रेडियो चल रहा है 🔴";

}

}



function radioOff(){

if(led){

led.classList.remove("active");

}


if(statusText){

statusText.innerHTML="रेडियो बंद है";

}

}



function showTuning(){

if(!tuning){

return;

}


tuning.classList.add("cassette-loading");

tuning.innerHTML="📼 Cassette बदल रहा है...";


setTimeout(()=>{

tuning.innerHTML="";

tuning.classList.remove("cassette-loading");

},1200);

}