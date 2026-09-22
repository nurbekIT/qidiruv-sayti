let characters = [];
let current = null;
let lastId = null;

const gameImg = document.getElementById("gameImg");
const guessName = document.getElementById("guessName");
const guessSource = document.getElementById("guessSource");
const checkBtn = document.getElementById("checkBtn");
const nextBtn = document.getElementById("nextBtn");
const gameResult = document.getElementById("gameResult");
const gameInputs = document.getElementById("gameInputs");
const scoreText = document.getElementById("scoreText");
const resetScoreBtn = document.getElementById("resetScoreBtn");

// Ma'lumotlarni yuklash
fetch("data.json")
  .then(res => res.json())
  .then(data => {
    // "odam" turidagi yozuvlarni o'yinga qo'shmaymiz (masalan aktyorning o'z rasmi)
    characters = data.filter(ch => ch.turi !== "odam");
    updateScoreText();
    nextQuestion();
  })
  .catch(err => {
    gameImg.alt = "Ma'lumot yuklanmadi";
    console.error(err);
  });

function nextQuestion(){
  if(characters.length === 0) return;

  let pick;
  do{
    pick = characters[Math.floor(Math.random() * characters.length)];
  } while(characters.length > 1 && pick.id === lastId);

  current = pick;
  lastId = pick.id;

  gameImg.src = current.rasm;
  gameImg.alt = "Qahramon rasmi";

  guessName.value = "";
  guessSource.value = "";
  gameResult.hidden = true;
  gameInputs.hidden = false;
  nextBtn.hidden = true;
  guessName.focus();
}

// Erkinroq solishtirish: katta-kichik harf, bo'sh joylarga e'tibor bermaydi,
// va qisqa javob ("Gojo") to'liq ism ("Gojo Satoru") ichida bo'lsa ham to'g'ri hisoblanadi
function isCloseMatch(userInput, correctAnswer){
  const a = userInput.trim().toLowerCase();
  const b = String(correctAnswer || "").trim().toLowerCase();
  if(a === "" || b === "") return false;
  return b.includes(a) || a.includes(b);
}

checkBtn.addEventListener("click", checkAnswer);
[guessName, guessSource].forEach(input => {
  input.addEventListener("keyup", (e) => {
    if(e.key === "Enter") checkAnswer();
  });
});

function checkAnswer(){
  if(!current) return;

  const nameCorrect = isCloseMatch(guessName.value, current.ism);
  const sourceCorrect = isCloseMatch(guessSource.value, current.manba);
  const bothCorrect = nameCorrect && sourceCorrect;

  // Hisobni yangilash
  const total = parseInt(localStorage.getItem("qs_score_total") || "0") + 1;
  const correctCount = parseInt(localStorage.getItem("qs_score_correct") || "0") + (bothCorrect ? 1 : 0);
  localStorage.setItem("qs_score_total", total);
  localStorage.setItem("qs_score_correct", correctCount);
  updateScoreText();

  const isKino = current.turi === "kino";

  gameResult.innerHTML = `
    <div class="result-banner ${bothCorrect ? "result-good" : "result-bad"}">
      ${bothCorrect ? "✅ To'g'ri! Zo'r bilasiz ekan." : "❌ To'liq to'g'ri emas, lekin o'rganib qoldingiz."}
    </div>
    <div class="result-details">
      <p><span class="result-label">${nameCorrect ? "✅" : "⚠️"} Ismi:</span> ${current.ism}</p>
      <p><span class="result-label">${sourceCorrect ? "✅" : "⚠️"} Manba:</span> ${current.manba}</p>
      ${isKino && current.aktyor ? `<p><span class="result-label">🎬 Kim o'ynagan:</span> ${current.aktyor}</p>` : ""}
      ${current.tavsif ? `<p class="result-desc">${current.tavsif}</p>` : ""}
    </div>
  `;

  gameResult.hidden = false;
  gameInputs.hidden = true;
  nextBtn.hidden = false;
}

nextBtn.addEventListener("click", nextQuestion);

resetScoreBtn.addEventListener("click", () => {
  localStorage.setItem("qs_score_total", "0");
  localStorage.setItem("qs_score_correct", "0");
  updateScoreText();
});

function updateScoreText(){
  const total = localStorage.getItem("qs_score_total") || "0";
  const correct = localStorage.getItem("qs_score_correct") || "0";
  scoreText.textContent = `To'g'ri: ${correct} / ${total}`;
}
