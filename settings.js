const animToggle = document.getElementById("animToggle");
const scoreInfo = document.getElementById("scoreInfo");
const clearScoreBtn = document.getElementById("clearScoreBtn");

// Joriy holatni ko'rsatish
animToggle.checked = localStorage.getItem("qs_animations") !== "off";
updateScoreInfo();

animToggle.addEventListener("change", () => {
  if(animToggle.checked){
    localStorage.setItem("qs_animations", "on");
    document.documentElement.classList.remove("no-animations");
  } else {
    localStorage.setItem("qs_animations", "off");
    document.documentElement.classList.add("no-animations");
  }
});

clearScoreBtn.addEventListener("click", () => {
  localStorage.setItem("qs_score_total", "0");
  localStorage.setItem("qs_score_correct", "0");
  updateScoreInfo();
});

function updateScoreInfo(){
  const total = localStorage.getItem("qs_score_total") || "0";
  const correct = localStorage.getItem("qs_score_correct") || "0";
  scoreInfo.textContent = `To'g'ri javoblar: ${correct} / ${total}`;
}
