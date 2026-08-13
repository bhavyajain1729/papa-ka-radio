import { db } from "./firebase.js";

import {
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

/* ================================================================
   PAPA KA RADIO — star rating + Firebase review submission

   Fixed in this pass:
   - submit previously gave NO feedback while the write was in
     flight, so it looked frozen even when it was working fine.
   - the success text was appended at the very bottom of a
     scrollable popup card, below stars + textarea + button, so it
     rendered below the fold with nothing to scroll it into view —
     it was showing, just invisible without manual scrolling.
   - every error/validation path used alert(), which Instagram's
     in-app browser (a very likely entry point for this site's
     audience) silently swallows — so a forgotten star rating would
     "do nothing" with no visible feedback at all.
   All feedback is now inline, visible, auto-scrolled into view, and
   alert() has been removed entirely.
================================================================ */

let selectedRating = 0;

const stars = document.querySelectorAll(".stars span");
const submitReview = document.getElementById("submitReview");
const reviewTextEl = document.getElementById("reviewText");
const reviewMsgEl = document.getElementById("reviewMsg");
const reviewPopup = document.getElementById("reviewPopup");

const SUBMIT_DEFAULT_LABEL = submitReview ? submitReview.innerHTML : "❤️ Submit Review";

stars.forEach((star) => {
  star.addEventListener("click", () => {
    selectedRating = Number(star.dataset.star);
    stars.forEach((s) => s.classList.remove("active"));
    for(let i = 0; i < selectedRating; i++){
      stars[i].classList.add("active");
    }
  });
});

function showMessage(text, type){
  if(!reviewMsgEl) return;
  reviewMsgEl.textContent = text;
  reviewMsgEl.classList.remove("is-success", "is-error");
  reviewMsgEl.classList.add(type === "error" ? "is-error" : "is-success");
  // the popup card scrolls (needed on small screens) — make sure the
  // message that just appeared is actually visible, not below the fold
  reviewMsgEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function clearMessage(){
  if(!reviewMsgEl) return;
  reviewMsgEl.textContent = "";
  reviewMsgEl.classList.remove("is-success", "is-error");
}

function setSubmitting(isSubmitting){
  if(!submitReview) return;
  submitReview.disabled = isSubmitting;
  submitReview.innerHTML = isSubmitting ? "⏳ Sending..." : SUBMIT_DEFAULT_LABEL;
}

if(submitReview){
  submitReview.addEventListener("click", async () => {
    // guard against double-submits while a request is already in flight
    if(submitReview.disabled) return;

    const reviewText = reviewTextEl ? reviewTextEl.value.trim() : "";

    if(selectedRating === 0){
      showMessage("Please select stars ⭐ before submitting", "error");
      return;
    }

    if(reviewText === ""){
      showMessage("Please write your memory first ✍️", "error");
      return;
    }

    clearMessage();
    setSubmitting(true);

    try{
      await addDoc(collection(db, "reviews"), {
        rating: selectedRating,
        review: reviewText,
        createdAt: serverTimestamp()
      });

      showMessage("❤️ Thank you for your valuable feedback!", "success");

      // reset the form for next time
      if(reviewTextEl) reviewTextEl.value = "";
      selectedRating = 0;
      stars.forEach((s) => s.classList.remove("active"));

      // let the visitor actually read the thank-you message, then
      // close the popup for them so it's obvious the submission worked
      setTimeout(() => {
        if(reviewPopup) reviewPopup.classList.remove("active");
        clearMessage();
      }, 2200);

    } catch(error){
      console.error("Review submit failed:", error);
      showMessage("Something went wrong — please try again", "error");
    } finally{
      setSubmitting(false);
    }
  });
}