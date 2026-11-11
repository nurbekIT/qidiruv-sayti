// Akkaunt tizimi: Google bilan kirish, profil va laqab (Supabase)
// Bu yerdagi kalit OCHIQ (publishable) kalit — kodda turishi xavfsiz.
// Himoya bazadagi qoidalarda (RLS). SECRET / service_role kalitni bu yerga HECH QACHON qo'ymang.
(function(){
  const SUPABASE_URL = "https://bvbrbfhbdbxdqkbrjryh.supabase.co";
  const SUPABASE_KEY = "sb_publishable_j6eDI42_KGQrxcjkTnufgA_1gbMxadu";

  if(!window.supabase){
    console.error("supabase-js yuklanmadi (index.html dagi <script> qatorini tekshiring).");
    return;
  }

  const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
      flowType: "pkce",
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });

  let user = null;
  let profile = null;
  let seq = 0;
  const listeners = [];

  // ---------- Menyudagi akkaunt bloki ----------
  const navLinks = document.querySelector(".nav-links");
  const box = document.createElement("div");
  box.className = "auth-box";
  if(navLinks) navLinks.appendChild(box);

  function el(tag, className, text){
    const node = document.createElement(tag);
    if(className) node.className = className;
    if(text !== undefined) node.textContent = text;
    return node;
  }

  function render(){
    box.innerHTML = "";

    if(!user){
      const btn = el("button", "auth-btn", "Google bilan kirish");
      btn.type = "button";
      btn.addEventListener("click", login);
      box.appendChild(btn);
      return;
    }

    if(profile && profile.avatar_url){
      const img = el("img", "auth-avatar");
      img.src = profile.avatar_url;
      img.alt = "";
      img.referrerPolicy = "no-referrer";
      img.addEventListener("error", () => img.remove());
      box.appendChild(img);
    }

    if(profile && profile.nickname){
      box.appendChild(el("span", "auth-name", profile.nickname));
    } else {
      const nickBtn = el("button", "auth-btn", "Laqab tanlang");
      nickBtn.type = "button";
      nickBtn.addEventListener("click", openNickModal);
      box.appendChild(nickBtn);
    }

    const out = el("button", "ghost-btn", "Chiqish");
    out.type = "button";
    out.addEventListener("click", logout);
    box.appendChild(out);
  }

  // ---------- Kirish / chiqish ----------
  async function login(){
    if(location.protocol === "file:"){
      alert("Kirish faqat Live Server yoki haqiqiy sayt orqali ishlaydi (faylni to'g'ridan-to'g'ri ochib bo'lmaydi).");
      return;
    }
    const redirectTo = location.origin + location.pathname;
    const { error } = await client.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo }
    });
    if(error) alert("Kirishda xatolik: " + error.message);
  }

  async function logout(){
    await client.auth.signOut();
  }

  // ---------- Profilni o'qish ----------
  async function loadProfile(uid){
    const { data, error } = await client
      .from("profiles")
      .select("nickname, avatar_url, is_admin")
      .eq("id", uid)
      .maybeSingle();
    if(error){
      console.error("Profilni o'qib bo'lmadi:", error.message);
    }
    return data || { nickname: null, avatar_url: null, is_admin: false };
  }

  async function handleSession(session, event){
    const mine = ++seq;
    const newUser = session ? session.user : null;
    let newProfile = null;
    if(newUser) newProfile = await loadProfile(newUser.id);
    if(mine !== seq) return; // yangiroq hodisa kelgan, bu natija eskirgan

    user = newUser;
    profile = newProfile;

    // OAuth qaytganda manzildagi ?code=... ni tozalaymiz
    if(user && /[?&]code=/.test(location.search)){
      history.replaceState(null, "", location.pathname + location.hash);
    }

    render();
    listeners.forEach(cb => { try{ cb(user, profile); }catch(e){ console.error(e); } });

    // Laqabi yo'q bo'lsa, bir marta (sessiya davomida) taklif qilamiz
    if(user && profile && !profile.nickname && !sessionStorage.getItem("qs_nick_skip")){
      openNickModal();
    }
  }

  // Eslatma: onAuthStateChange ichida to'g'ridan-to'g'ri await qilinmaydi (qotib qolishi mumkin)
  client.auth.onAuthStateChange((event, session) => {
    setTimeout(() => handleSession(session, event), 0);
  });

  // ---------- Laqab tanlash oynasi ----------
  let overlay = null;
  let nickInput, nickError, nickSave;

  function buildNickModal(){
    overlay = el("div", "modal-overlay");
    overlay.hidden = true;

    const modal = el("div", "modal");
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");

    const body = el("div", "nick-body");
    body.appendChild(el("h2", null, "Laqabingizni tanlang"));
    body.appendChild(el("p", "nick-hint", "Reytingda aynan shu laqab ko'rinadi (emailingiz hech kimga ko'rinmaydi). 3–20 ta belgi: lotin harflari, raqamlar va _"));

    nickInput = el("input", "nick-input");
    nickInput.type = "text";
    nickInput.maxLength = 20;
    nickInput.placeholder = "masalan: anime_fan";
    nickInput.autocomplete = "off";
    body.appendChild(nickInput);

    nickError = el("div", "nick-error");
    nickError.hidden = true;
    body.appendChild(nickError);

    const row = el("div", "nick-actions");
    nickSave = el("button", "auth-btn", "Saqlash");
    nickSave.type = "button";
    const skip = el("button", "ghost-btn", "Keyinroq");
    skip.type = "button";
    row.appendChild(nickSave);
    row.appendChild(skip);
    body.appendChild(row);

    modal.appendChild(body);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    nickSave.addEventListener("click", saveNickname);
    nickInput.addEventListener("keyup", (e) => { if(e.key === "Enter") saveNickname(); });
    skip.addEventListener("click", () => {
      sessionStorage.setItem("qs_nick_skip", "1");
      closeNickModal();
    });
    overlay.addEventListener("click", (e) => {
      if(e.target === overlay){
        sessionStorage.setItem("qs_nick_skip", "1");
        closeNickModal();
      }
    });
  }

  function openNickModal(){
    if(!user) return;
    if(!overlay) buildNickModal();
    nickInput.value = (profile && profile.nickname) || "";
    nickError.hidden = true;
    overlay.hidden = false;
    nickInput.focus();
  }

  function closeNickModal(){
    if(overlay) overlay.hidden = true;
  }

  function showNickError(msg){
    nickError.textContent = msg;
    nickError.hidden = false;
  }

  async function saveNickname(){
    const nickname = nickInput.value.trim();
    if(!/^[A-Za-z0-9_]{3,20}$/.test(nickname)){
      showNickError("Laqab 3–20 ta belgidan iborat bo'lishi va faqat lotin harflari, raqamlar va _ dan tashkil topishi kerak.");
      return;
    }

    nickSave.disabled = true;
    nickError.hidden = true;

    const { data, error } = await client
      .from("profiles")
      .update({ nickname })
      .eq("id", user.id)
      .select("nickname");

    nickSave.disabled = false;

    if(error){
      if(error.code === "23505") showNickError("Bu laqab band, boshqasini tanlang.");
      else if(error.code === "23514") showNickError("Laqab formati noto'g'ri.");
      else showNickError("Saqlab bo'lmadi: " + error.message);
      return;
    }
    if(!data || data.length === 0){
      showNickError("Saqlab bo'lmadi. Sahifani yangilab, qayta urinib ko'ring.");
      return;
    }

    profile = Object.assign({}, profile, { nickname: data[0].nickname });
    sessionStorage.removeItem("qs_nick_skip");
    closeNickModal();
    render();
    listeners.forEach(cb => { try{ cb(user, profile); }catch(e){ console.error(e); } });
  }

  document.addEventListener("keydown", (e) => {
    if(e.key === "Escape" && overlay && !overlay.hidden) closeNickModal();
  });

  // ---------- Boshqa fayllar (o'yin, reyting, qo'shish sahifasi) uchun ----------
  window.qsAuth = {
    client,
    getUser: () => user,
    getProfile: () => profile,
    onChange: (cb) => { listeners.push(cb); }
  };

  render();
})();
