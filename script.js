let allCharacters = [];

const grid = document.getElementById("grid");
const searchInput = document.getElementById("searchInput");
const resultCount = document.getElementById("resultCount");
const modalOverlay = document.getElementById("modalOverlay");
const modalContent = document.getElementById("modalContent");

// Ma'lumotlarni yuklash
fetch("data.json")
  .then(res => res.json())
  .then(data => {
    allCharacters = data;
    renderCards(allCharacters);
  })
  .catch(err => {
    grid.innerHTML = `<div class="empty-state"><strong>Ma'lumot yuklanmadi</strong>data.json faylini o'qib bo'lmadi. Loyihani Live Server orqali oching (pastdagi ko'rsatmaga qarang).</div>`;
    console.error(err);
  });

// Kartalarni chizish
function renderCards(list){
  if(list.length === 0){
    grid.innerHTML = "";
    resultCount.textContent = "";
    document.getElementById("emptyState").hidden = false;
    return;
  }
  document.getElementById("emptyState").hidden = true;

  resultCount.textContent = `${list.length} ta natija topildi`;

  grid.innerHTML = list.map(ch => `
    <div class="card" data-id="${ch.id}">
      <img src="${ch.rasm}" alt="${ch.ism}" loading="lazy">
      <div class="name-bar">
        <div class="name">${ch.ism}</div>
        <div class="source">${ch.manba}</div>
      </div>
    </div>
  `).join("");

  // Har bir kartaga bosish hodisasini ulash
  document.querySelectorAll(".card").forEach(card => {
    card.addEventListener("click", () => {
      const ch = allCharacters.find(c => c.id === card.dataset.id);
      openModal(ch);
    });
  });
}

// Qidiruv — ism, anime/kino nomi va aktyor (agar bo'lsa) bo'yicha
searchInput.addEventListener("input", () => {
  const q = searchInput.value.trim().toLowerCase();

  if(q === ""){
    renderCards(allCharacters);
    return;
  }

  const filtered = allCharacters.filter(ch => {
    const fields = [ch.ism, ch.manba, ch.aktyor || ""].join(" ").toLowerCase();
    return fields.includes(q);
  });

  renderCards(filtered);
});

// Modal oynani ochish
function openModal(ch){
  const isKino = ch.turi === "kino";
  const isOdam = ch.turi === "odam";

  const powerHtml = ch.kuch_darajasi ? `
    <div class="power-row">
      <span class="power-label">Kuch darajasi</span>
      <div class="power-bar"><div class="power-bar-fill" style="width:${parsePower(ch.kuch_darajasi)}%"></div></div>
      <span class="power-value">${ch.kuch_darajasi}</span>
    </div>
  ` : "";

  let yoshiLabel = "Personaj yoshi";
  let yoshiSuffix = "";
  if(isKino){ yoshiLabel = "Aktyor o'sha paytda"; yoshiSuffix = " yoshda edi"; }
  if(isOdam){ yoshiLabel = "Yoshi"; }

  const infoGridHtml = `
    <div class="info-grid">
      ${ch.yoshi ? `<div><div class="label">${yoshiLabel}</div>${ch.yoshi}${yoshiSuffix}</div>` : ""}
      ${ch.qayerlik ? `<div><div class="label">${isOdam ? "Millati / qayerlik" : "Qayerlik"}</div>${ch.qayerlik}</div>` : ""}
      ${isKino && ch.aktyor ? `<div><div class="label">Kim o'ynagan</div>${ch.aktyor}</div>` : ""}
      ${ch.qobiliyat ? `<div><div class="label">${isOdam ? "Kasbi" : "Qobiliyati"}</div>${ch.qobiliyat}</div>` : ""}
    </div>
  `;

  const tagsHtml = ch.kuchlari && ch.kuchlari.length ? `
    <div class="tags">${ch.kuchlari.map(k => `<span class="tag">${k}</span>`).join("")}</div>
  ` : "";

  modalContent.innerHTML = `
    <button class="close-btn" id="closeBtn">&times;</button>
    <img src="${ch.rasm}" alt="${ch.ism}">
    <div class="modal-body">
      <h2>${ch.ism}</h2>
      <div class="modal-source">${isKino ? "🎬" : isOdam ? "👤" : "📺"} ${ch.manba}</div>
      ${powerHtml}
      ${infoGridHtml}
      ${ch.tavsif ? `<p class="modal-desc">${ch.tavsif}</p>` : ""}
      ${tagsHtml}
    </div>
  `;

  modalOverlay.hidden = false;
  document.getElementById("closeBtn").addEventListener("click", closeModal);
}

function closeModal(){
  modalOverlay.hidden = true;
}

modalOverlay.addEventListener("click", (e) => {
  if(e.target === modalOverlay) closeModal();
});

document.addEventListener("keydown", (e) => {
  if(e.key === "Escape") closeModal();
});

// "9.7/10" kabi matndan foizni hisoblash (progress bar uchun)
function parsePower(str){
  const match = String(str).match(/([\d.]+)\s*\/\s*10/);
  if(!match) return 50;
  return Math.min(100, (parseFloat(match[1]) / 10) * 100);
}
