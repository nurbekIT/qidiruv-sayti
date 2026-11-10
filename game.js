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

// Rasm topilmasa ko'rsatiladigan zaxira rasm
const PLACEHOLDER_IMG = "data:image/svg+xml," + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="440" viewBox="0 0 320 440">' +
  '<rect width="320" height="440" fill="#101020"/>' +
  '<text x="160" y="240" font-size="96" text-anchor="middle" fill="#4deaff" opacity="0.5" font-family="sans-serif">?</text>' +
  '</svg>'
);

gameImg.addEventListener("error", () => {
  if(gameImg.src !== PLACEHOLDER_IMG) gameImg.src = PLACEHOLDER_IMG;
});

// Matnni HTML ichiga xavfsiz qo'yish uchun
function escapeHtml(str){
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

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
    gameInputs.hidden = true;
    gameResult.innerHTML = `<div class="result-banner result-bad">Ma'lumot yuklanmadi. Saytni to'g'ridan-to'g'ri fayl sifatida emas, VS Code'dagi Live Server orqali oching.</div>`;
    gameResult.hidden = false;
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
  guessName.classList.remove("input-error");
  guessSource.classList.remove("input-error");
  gameResult.hidden = true;
  gameInputs.hidden = false;
  nextBtn.hidden = true;
  guessName.focus();
}

// Matnni solishtirish uchun tozalash: katta-kichik harf, diakritika (é → e),
// tinish belgilari va ortiqcha bo'shliqlarga e'tibor bermaydi (har qanday alifbo uchun ishlaydi)
function normalize(str){
  return String(str || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Erkin, lekin adolatli solishtirish:
// - "Gojo" yoki "Satoru" — "Gojo Satoru" uchun to'g'ri (qisqa javob to'liq ism ichida)
// - kamida 3 ta belgi kerak (bitta harf bilan "topib" bo'lmaydi)
// - to'g'ri javobning o'zi 3 belgidan qisqa bo'lsa (masalan "Ai"), aniq mos kelishi shart
// - teskari yo'nalish yo'q: "Gojo Satoru Sukuna" deb yozish "Gojo" uchun to'g'ri hisoblanmaydi
function isCloseMatch(userInput, correctAnswer){
  const a = normalize(userInput);
  const b = normalize(correctAnswer);
  if(a === "" || b === "") return false;
  if(a === b) return true;
  return a.length >= 3 && b.includes(a);
}

checkBtn.addEventListener("click", checkAnswer);
[guessName, guessSource].forEach(input => {
  input.addEventListener("keyup", (e) => {
    if(e.key === "Enter") checkAnswer();
  });
  input.addEventListener("input", () => input.classList.remove("input-error"));
});

function checkAnswer(){
  if(!current) return;

  // Ikkala maydon ham to'ldirilishi shart — bo'sh javob urinish hisoblanmaydi
  const emptyFields = [guessName, guessSource].filter(el => el.value.trim() === "");
  if(emptyFields.length > 0){
    emptyFields.forEach(el => el.classList.add("input-error"));
    emptyFields[0].focus();
    return;
  }

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
      <p><span class="result-label">${nameCorrect ? "✅" : "⚠️"} Ismi:</span> ${escapeHtml(current.ism)}</p>
      <p><span class="result-label">${sourceCorrect ? "✅" : "⚠️"} Manba:</span> ${escapeHtml(current.manba)}</p>
      ${isKino && current.aktyor ? `<p><span class="result-label">🎬 Kim o'ynagan:</span> ${escapeHtml(current.aktyor)}</p>` : ""}
      ${current.tavsif ? `<p class="result-desc">${escapeHtml(current.tavsif)}</p>` : ""}
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
