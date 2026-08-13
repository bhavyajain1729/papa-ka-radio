import { db } from "./firebase.js";


import {

collection,

addDoc,

serverTimestamp

}

from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";



let selectedRating = 0;




const stars = document.querySelectorAll(".stars span");





stars.forEach(star=>{


star.addEventListener("click",()=>{


selectedRating = Number(star.dataset.star);



stars.forEach(s=>{

s.classList.remove("active");

});





for(let i=0;i<selectedRating;i++){


stars[i].classList.add("active");


}



});



});







const submitReview =
document.getElementById("submitReview");





submitReview.onclick = async()=>{



const reviewText =
document.getElementById("reviewText").value.trim();





if(selectedRating===0){

alert("Please select stars ⭐");

return;

}





if(reviewText===""){


alert("Please write your memory");


return;


}





try{



await addDoc(

collection(db,"reviews"),

{


rating:selectedRating,

review:reviewText,

createdAt:serverTimestamp()


}


);





document.getElementById("reviewMsg").innerHTML =

"❤️ Thank you for sharing your memory";





document.getElementById("reviewText").value="";



selectedRating=0;



stars.forEach(s=>{

s.classList.remove("active");

});





}



catch(error){


console.log(error);


alert("Something went wrong");


}




}