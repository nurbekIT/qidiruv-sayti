let allCharacters = [];

const grid = document.getElementById("grid");
const searchInput = document.getElementById("searchInput");
const resultCount = document.getElementById("resultCount");
const modalOverlay = document.getElementById("modalOverlay");
const modalContent = document.getElementById("modalContent");

// Rasm topilmasa ko'rsatiladigan zaxira rasm
const PLACEHOLDER_IMG = "data:image/svg+xml," + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="440" viewBox="0 0 320 440">' +
  '<rect width="320" height="440" fill="#101020"/>' +
  '<text x="160" y="240" font-size="96" text-anchor="middle" fill="#4deaff" opacity="0.5" font-family="sans-serif">?</text>' +
  '</svg>'
);

// Matnni HTML ichiga xavfsiz qo'yish uchun (<, >, &, ' va " belgilarini almashtiradi)
function escapeHtml(str){
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Konteyner ichidagi rasmlar yuklanmasa, zaxira rasmni qo'yish
function attachImageFallback(container){
  container.querySelectorAll("img").forEach(img => {
    img.addEventListener("error", () => {
      if(img.src !== PLACEHOLDER_IMG) img.src = PLACEHOLDER_IMG;
    });
  });
}

// Ma'lumotlarni yuklash
fetch("data.json")
  .then(res => res.json())
  .then(data => {
    allCharacters = data;
    renderCards(allCharacters);
  })
  .catch(err => {
    grid.innerHTML = `<div class="empty-state"><strong>Ma'lumot yuklanmadi</strong>data.json faylini o'qib bo'lmadi. Saytni to'g'ridan-to'g'ri fayl sifatida emas, VS Code'dagi Live Server orqali oching.</div>`;
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
    <div class="card" data-id="${escapeHtml(ch.id)}">
      <img src="${escapeHtml(ch.rasm)}" alt="${escapeHtml(ch.ism)}" loading="lazy">
      <div class="name-bar">
        <div class="name">${escapeHtml(ch.ism)}</div>
        <div class="source">${escapeHtml(ch.manba)}</div>
      </div>
    </div>
  `).join("");

  attachImageFallback(grid);

  // Har bir kartaga bosish hodisasini ulash
  grid.querySelectorAll(".card").forEach(card => {
    card.addEventListener("click", () => {
      const ch = allCharacters.find(c => c.id === card.dataset.id);
      if(ch) openModal(ch);
    });
  });

  // Birinchi chizishdan keyin animatsiyani o'chiramiz — qidirganda kartalar miltillamaydi
  grid.classList.add("rendered");
}

// Qidiruv — ism, anime/kino nomi, aktyor, qobiliyat va kuchlar bo'yicha
searchInput.addEventListener("input", () => {
  const q = searchInput.value.trim().toLowerCase();

  if(q === ""){
    renderCards(allCharacters);
    return;
  }

  const filtered = allCharacters.filter(ch => {
    const fields = [
      ch.ism,
      ch.manba,
      ch.aktyor || "",
      ch.qobiliyat || "",
      (ch.kuchlari || []).join(" ")
    ].join(" ").toLowerCase();
    return fields.includes(q);
  });

  renderCards(filtered);
});

// Modal oynani ochish
function openModal(ch){
  const isKino = ch.turi === "kino";
  const isOdam = ch.turi === "odam";

  // Kuch darajasi "9.7/10" ko'rinishida bo'lsa — progress bar, bo'lmasa — faqat matn
  let powerHtml = "";
  if(ch.kuch_darajasi){
    const percent = parsePower(ch.kuch_darajasi);
    powerHtml = `
      <div class="power-row">
        <span class="power-label">Kuch darajasi</span>
        ${percent === null
          ? ""
          : `<div class="power-bar"><div class="power-bar-fill" style="width:${percent}%"></div></div>`}
        <span class="power-value">${escapeHtml(ch.kuch_darajasi)}</span>
      </div>
    `;
  }

  let yoshiLabel = "Personaj yoshi";
  let yoshiSuffix = "";
  if(isKino){ yoshiLabel = "Aktyor o'sha paytda"; yoshiSuffix = " yoshda edi"; }
  if(isOdam){ yoshiLabel = "Yoshi"; }

  const infoGridHtml = `
    <div class="info-grid">
      ${ch.yoshi ? `<div><div class="label">${yoshiLabel}</div>${escapeHtml(ch.yoshi)}${yoshiSuffix}</div>` : ""}
      ${ch.qayerlik ? `<div><div class="label">${isOdam ? "Millati / qayerlik" : "Qayerlik"}</div>${escapeHtml(ch.qayerlik)}</div>` : ""}
      ${isKino && ch.aktyor ? `<div><div class="label">Kim o'ynagan</div>${escapeHtml(ch.aktyor)}</div>` : ""}
      ${ch.qobiliyat ? `<div><div class="label">${isOdam ? "Kasbi" : "Qobiliyati"}</div>${escapeHtml(ch.qobiliyat)}</div>` : ""}
    </div>
  `;

  const tagsHtml = ch.kuchlari && ch.kuchlari.length ? `
    <div class="tags">${ch.kuchlari.map(k => `<span class="tag">${escapeHtml(k)}</span>`).join("")}</div>
  ` : "";

  modalContent.innerHTML = `
    <button class="close-btn" id="closeBtn">&times;</button>
    <img src="${escapeHtml(ch.rasm)}" alt="${escapeHtml(ch.ism)}">
    <div class="modal-body">
      <h2>${escapeHtml(ch.ism)}</h2>
      <div class="modal-source">${isKino ? "🎬" : isOdam ? "👤" : "📺"} ${escapeHtml(ch.manba)}</div>
      ${powerHtml}
      ${infoGridHtml}
      ${ch.tavsif ? `<p class="modal-desc">${escapeHtml(ch.tavsif)}</p>` : ""}
      ${tagsHtml}
    </div>
  `;

  attachImageFallback(modalContent);

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

// "9.7/10" kabi matndan foizni hisoblash (progress bar uchun).
// Format mos kelmasa null qaytaradi — bar chizilmaydi, noto'g'ri 50% ko'rsatilmaydi.
function parsePower(str){
  const match = String(str).match(/([\d.]+)\s*\/\s*10/);
  if(!match) return null;
  return Math.min(100, (parseFloat(match[1]) / 10) * 100);
}
