let characters = [];

const loadStatus = document.getElementById("loadStatus");
const adminForm = document.getElementById("adminForm");
const adminList = document.getElementById("adminList");
const countText = document.getElementById("countText");
const downloadBtn = document.getElementById("downloadBtn");
const f_turi = document.getElementById("f_turi");
const f_ism = document.getElementById("f_ism");
const f_rasm = document.getElementById("f_rasm");
const row_aktyor = document.getElementById("row_aktyor");

// Joriy data.json'ni yuklash (bir joyda turgan bo'lsa)
fetch("data.json")
  .then(res => res.json())
  .then(data => {
    characters = data;
    loadStatus.textContent = `Joriy data.json yuklandi — ${characters.length} ta personaj bor edi.`;
    renderList();
  })
  .catch(() => {
    characters = [];
    loadStatus.textContent = "Joriy data.json topilmadi — noldan boshlaysiz (bo'sh ro'yxat).";
    renderList();
  });

// Turi o'zgarganda "aktyor" maydonini ko'rsatish/yashirish
f_turi.addEventListener("change", () => {
  row_aktyor.hidden = f_turi.value !== "kino";
});

// Ism yozilganda rasm nomini avtomatik taklif qilish
f_ism.addEventListener("input", () => {
  if(f_rasm.value.trim() === "" || f_rasm.dataset.auto === "true"){
    f_rasm.value = "images/" + slugify(f_ism.value) + ".jpg";
    f_rasm.dataset.auto = "true";
  }
});

f_rasm.addEventListener("input", () => {
  f_rasm.dataset.auto = "false";
});

function escapeHtml(str){
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function slugify(str){
  return str
    .toLowerCase()
    .replace(/ʻ|'|`/g, "")
    .replace(/[^a-z0-9\s]/gi, "")
    .trim()
    .replace(/\s+/g, "_");
}

function uniqueId(baseId){
  let id = baseId;
  let counter = 2;
  while(characters.some(ch => ch.id === id)){
    id = baseId + "_" + counter;
    counter++;
  }
  return id;
}

adminForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const ism = document.getElementById("f_ism").value.trim();
  const manba = document.getElementById("f_manba").value.trim();
  if(ism === "" || manba === ""){
    alert("Ismi va Manba maydonlari majburiy.");
    return;
  }

  const turi = f_turi.value;
  const kuchlariRaw = document.getElementById("f_kuchlari").value.trim();
  const kuchlari = kuchlariRaw === "" ? [] : kuchlariRaw.split(",").map(s => s.trim()).filter(Boolean);

  const newChar = {
    id: uniqueId(slugify(ism) || "personaj"),
    turi: turi,
    ism: ism,
    manba: manba,
  };

  if(turi === "kino"){
    const aktyor = document.getElementById("f_aktyor").value.trim();
    if(aktyor) newChar.aktyor = aktyor;
  }

  const yoshi = document.getElementById("f_yoshi").value.trim();
  newChar.yoshi = yoshi === "" ? null : parseInt(yoshi);

  const qayerlik = document.getElementById("f_qayerlik").value.trim();
  if(qayerlik) newChar.qayerlik = qayerlik;

  const kuch = document.getElementById("f_kuch").value.trim();
  if(kuch) newChar.kuch_darajasi = kuch;

  const qobiliyat = document.getElementById("f_qobiliyat").value.trim();
  if(qobiliyat) newChar.qobiliyat = qobiliyat;

  if(kuchlari.length) newChar.kuchlari = kuchlari;

  const tavsif = document.getElementById("f_tavsif").value.trim();
  if(tavsif) newChar.tavsif = tavsif;

  const rasm = document.getElementById("f_rasm").value.trim();
  newChar.rasm = rasm || ("images/" + newChar.id + ".jpg");

  characters.push(newChar);
  renderList();
  adminForm.reset();
  row_aktyor.hidden = true;
  f_rasm.dataset.auto = "true";
});

function renderList(){
  countText.textContent = characters.length;

  if(characters.length === 0){
    adminList.innerHTML = `<p class="admin-empty">Hali hech kim qo'shilmagan.</p>`;
    return;
  }

  adminList.innerHTML = characters.map((ch, index) => `
    <div class="admin-row">
      <div>
        <strong>${escapeHtml(ch.ism)}</strong>
        <span class="admin-row-sub">${escapeHtml(ch.manba)} · ${escapeHtml(ch.turi)}</span>
      </div>
      <button class="ghost-btn danger" data-index="${index}">O'chirish</button>
    </div>
  `).join("");

  adminList.querySelectorAll("button[data-index]").forEach(btn => {
    btn.addEventListener("click", () => {
      const idx = parseInt(btn.dataset.index);
      if(confirm(`"${characters[idx].ism}"ni ro'yxatdan o'chirmoqchimisiz?`)){
        characters.splice(idx, 1);
        renderList();
      }
    });
  });
}

downloadBtn.addEventListener("click", () => {
  const json = JSON.stringify(characters, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "data.json";
  a.click();
  URL.revokeObjectURL(url);
});
