/* Admin panel — edits data/site.json and uploads media.
   Backends: "local" (tools/server.py on this PC) or "github" (commits straight to the repo → GitHub Pages). */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const rupee = n => "₹" + Number(n || 0).toLocaleString("en-IN");
  const clone = o => JSON.parse(JSON.stringify(o));
  const slug = s => String(s).toLowerCase().replace(/\.[a-z0-9]+$/, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "file";
  const isVideo = p => /\.(mp4|webm|mov|m4v)$/i.test(p || "");

  /* ---------- schema ---------- */
  const SECTIONS = [
    { key: "general", label: "General", icon: "⚙️", kind: "obj", desc: "Naam, logo, WhatsApp number, contact details.", fields: [
      { k: "brand", label: "Brand ka poora naam", full: true },
      { k: "brandA", label: "Logo text — gold hissa", hint: "jaise: Reel" },
      { k: "brandB", label: "Logo text — white hissa", hint: "jaise: Estate" },
      { k: "brandSmall", label: "Chhota text", hint: "jaise: STUDIO (khaali chhod sakte ho)" },
      { k: "logo", label: "Logo (SVG / PNG, square)", type: "image", full: true },
      { k: "whatsapp", label: "WhatsApp number", hint: "country code ke saath, bina + / space — jaise 919876543210", check: v => /^\d{10,15}$/.test(String(v).replace(/\D/g, "")) },
      { k: "phoneDisplay", label: "Phone (website par dikhne wala)", hint: "+91 98765 43210" },
      { k: "email", label: "Email" },
      { k: "instagram", label: "Instagram link" },
      { k: "city", label: "City" }
    ] },
    { key: "services", label: "Edit Styles & Rates", icon: "💰", kind: "list", desc: "Har edit style ka naam, rate, sample video. Jitni zyada editing (tracking, 3D), utna rate.", title: "name", sub: i => `${rupee(i.price)} · ${i.delivery || ""}`, thumb: "poster", sortPrice: true,
      tpl: () => ({ id: "style-" + Date.now().toString(36), name: "New edit style", price: 1999, unit: "per reel", delivery: "48 hr", level: 2, tag: "", desc: "", features: [], video: "", preview: "", poster: "" }),
      fields: [
        { k: "name", label: "Style ka naam" },
        { k: "price", label: "Rate (₹)", type: "number", price: true },
        { k: "unit", label: "Rate kis cheez ka", hint: "per reel / per video" },
        { k: "delivery", label: "Delivery time", hint: "48 hr" },
        { k: "tag", label: "Badge (optional)", hint: "Most popular / Premium / Budget" },
        { k: "desc", label: "Description", type: "textarea", full: true },
        { k: "features", label: "Features (har line ek point)", type: "lines", full: true },
        { k: "video", label: "Sample video (full)", type: "video", full: true, posterKey: "poster", clearKey: "preview" },
        { k: "poster", label: "Poster / thumbnail", type: "image", full: true },
        { k: "preview", label: "Short preview loop (optional — khaali ho to full video chalega)", type: "video", full: true }
      ] },
    { key: "coupons", label: "Offers & Coupons", icon: "🎁", kind: "list", desc: "Festive offer popup aur coupon codes. Offer ka naam likho (Diwali / Navratri / Holi / kuch bhi) — design apne aap us theme ka ban jayega. OFF karne ya last date nikalne par code website par kaam nahi karega.",
      title: i => `${i.name || "Offer"} — ${i.code || i._plain || i.hint || "?"}`, sub: i => couponStatus(i),
      tpl: () => { const c = "NEW" + Math.floor(Math.random() * 900 + 100); return { name: "New Offer", hash: window.OfferKit.hashCode(c), hint: window.OfferKit.hintOf(c), _plain: c, code: "", type: "percent", value: 10, active: true, expires: "", popup: false, headline: "", subtext: "", theme: "auto", color: "", emoji: "" }; },
      fields: [
        { k: "name", label: "Offer naam — theme isi se banegi", hint: "Diwali Offer / Navratri Offer / Holi Sale / New Year…", full: true },
        { k: "code", label: "Coupon code (secret)", type: "secretcode", full: true },
        { k: "type", label: "Discount type", type: "select", options: [["percent", "% percent"], ["flat", "₹ flat amount"]] },
        { k: "value", label: "Discount (kitna)", type: "number", hint: "20 = 20% ya ₹20" },
        { k: "expires", label: "Last date (iske baad expire)", type: "date", hint: "khaali = kabhi expire nahi" },
        { k: "active", label: "Offer / code ON hai", type: "check" },
        { k: "popup", label: "Website par popup dikhao (sirf list ka pehla ON popup dikhega)", type: "check" },
        { k: "headline", label: "Headline", hint: "khaali chhodo to theme ki apni line aayegi", full: true },
        { k: "subtext", label: "Chhoti line (optional)", full: true },
        { k: "theme", label: "Theme", type: "select", options: () => [["auto", "Auto — offer naam se"], ...Object.entries(window.OfferKit?.THEMES || {}).map(([k, v]) => [k, v.label])] },
        { k: "color", label: "Apna colour (optional)", type: "color" },
        { k: "emoji", label: "Apne emojis (optional)", hint: "🪔✨🎆", full: true },
        { k: "_preview", label: "Live preview (website par aisa dikhega)", type: "offerPreview", full: true }
      ] },
    { key: "addons", label: "Add-ons", icon: "➕", kind: "list", desc: "Extra services jo kisi bhi style ke saath le sakte hain.", title: "name", sub: i => rupee(i.price),
      tpl: () => ({ name: "New add-on", price: 499 }),
      fields: [{ k: "name", label: "Naam" }, { k: "price", label: "Rate (₹)", type: "number", price: true }] },
    { key: "packages", label: "Monthly Packages", icon: "📦", kind: "list", desc: "Monthly plans.", title: "name", sub: i => `${rupee(i.price)} ${i.per || ""} · ${i.reels || ""}`,
      tpl: () => ({ name: "New package", price: 9999, per: "/ month", reels: "4 reels", featured: false, items: [] }),
      fields: [
        { k: "name", label: "Naam" }, { k: "price", label: "Rate (₹)", type: "number", price: true },
        { k: "reels", label: "Kitni reels", hint: "10 reels" }, { k: "per", label: "Per", hint: "/ month" },
        { k: "featured", label: "Highlight karo (Best value)", type: "check" },
        { k: "items", label: "Points (har line ek)", type: "lines", full: true }
      ] },
    { key: "portfolio", label: "Portfolio (Our Work)", icon: "🎬", kind: "list", desc: "Aapka kiya hua kaam. Naya video upload karo — poster apne aap ban jayega.", title: "title", sub: i => `${i.cat || ""} · ${i.sub || ""}`, thumb: "poster",
      tpl: () => ({ title: "New project", sub: "", cat: "Township", style: "", video: "", preview: "", poster: "" }),
      fields: [
        { k: "title", label: "Project / client naam" }, { k: "sub", label: "Chhota description", hint: "3D walkthrough labels" },
        { k: "cat", label: "Category (filter button)", hint: "Brand Ads / Walkthrough / Township / Plots / Personal" },
        { k: "style", label: "Kaunsa edit style (order button ke liye)", type: "style" },
        { k: "video", label: "Video", type: "video", full: true, posterKey: "poster", clearKey: "preview" },
        { k: "poster", label: "Poster / thumbnail", type: "image", full: true },
        { k: "preview", label: "Short preview loop (optional)", type: "video", full: true }
      ] },
    { key: "beforeAfter", label: "Before / After", icon: "↔️", kind: "list", desc: "Drag slider ke pairs. Before (raw) aur After (edited) dono same clip, same length, vertical 9:16 hone chahiye.", title: "label", sub: i => i.project, thumb: "afterPoster",
      tpl: () => ({ label: "New pair", project: "", before: "", after: "", beforePoster: "", afterPoster: "", changes: [] }),
      fields: [
        { k: "label", label: "Naam (tab par)", hint: "Kitchen" }, { k: "project", label: "Project" },
        { k: "before", label: "BEFORE video (raw)", type: "video", full: true, posterKey: "beforePoster" },
        { k: "after", label: "AFTER video (edited)", type: "video", full: true, posterKey: "afterPoster" },
        { k: "beforePoster", label: "Before poster", type: "image" }, { k: "afterPoster", label: "After poster", type: "image" },
        { k: "changes", label: "Kya badla (har line ek point)", type: "lines", full: true }
      ] },
    { key: "heroPhones", label: "Hero Reels (top)", icon: "📱", kind: "list", max: 3, desc: "Sabse upar 3 phones mein chalne wale videos — PC aur mobile dono par. Beech wala (2nd) sabse bada dikhta hai: wahan raw → edited showreel best hai.", title: "tag", sub: () => "", thumb: "poster",
      tpl: () => ({ tag: "New", video: "", poster: "" }),
      fields: [{ k: "tag", label: "Phone ke neeche label", full: true }, { k: "video", label: "Video", type: "video", full: true, posterKey: "poster" }, { k: "poster", label: "Poster", type: "image", full: true }] },
    { key: "brands", label: "Brands (moving line)", icon: "🏢", kind: "list", desc: "Jin brands ke liye kaam kiya — website par chalti line mein dikhenge. Logo na ho to initials dikhenge.", title: "name", sub: i => i.sub, thumb: "logo",
      tpl: () => ({ name: "New brand", sub: "", logo: "" }),
      fields: [{ k: "name", label: "Brand naam" }, { k: "sub", label: "Chhota text", hint: "Jaipur / Builders" }, { k: "logo", label: "Logo (optional)", type: "image", full: true }] },
    { key: "stats", label: "Numbers (stats)", icon: "📊", kind: "list", desc: "Sirf sach numbers daalo — trust isi se banta hai.", title: i => `${i.value}${i.suffix || ""}`, sub: i => i.label,
      tpl: () => ({ value: 10, suffix: "+", label: "New stat" }),
      fields: [{ k: "value", label: "Number", type: "number" }, { k: "suffix", label: "Number ke baad", hint: "+ / hr / fps" }, { k: "label", label: "Label", full: true }] },
    { key: "texts", label: "Website Texts", icon: "✏️", kind: "texts", desc: "Website ke saare headings aur lines." },
    { key: "process", label: "How it works", icon: "🪜", kind: "list", desc: "Process ke steps.", title: "title", sub: i => i.text,
      tpl: () => ({ title: "New step", text: "" }), fields: [{ k: "title", label: "Title", full: true }, { k: "text", label: "Text", type: "textarea", full: true }] },
    { key: "whyCards", label: "Why us cards", icon: "⭐", kind: "list", title: i => `${i.icon || ""} ${i.title || ""}`, sub: i => i.text,
      tpl: () => ({ icon: "✨", title: "New point", text: "" }), fields: [{ k: "icon", label: "Emoji icon" }, { k: "title", label: "Title" }, { k: "text", label: "Text", type: "textarea", full: true }] },
    { key: "testimonials", label: "Client Reviews", icon: "💬", kind: "list", desc: "Asli clients ke reviews. Khaali ho to section website par nahi dikhega.", title: "name", sub: i => i.role,
      tpl: () => ({ name: "", role: "", text: "" }), fields: [{ k: "name", label: "Client naam" }, { k: "role", label: "Company / role" }, { k: "text", label: "Review", type: "textarea", full: true }] },
    { key: "faqs", label: "FAQ", icon: "❓", kind: "list", title: "q", sub: () => "",
      tpl: () => ({ q: "New question?", a: "" }), fields: [{ k: "q", label: "Sawal", full: true }, { k: "a", label: "Jawab", type: "textarea", full: true }] },
    { key: "seo", label: "Google / SEO", icon: "🔍", kind: "obj", desc: "Google search mein dikhne wala title aur description.", fields: [
      { k: "title", label: "Page title", full: true }, { k: "description", label: "Description (150 characters tak)", type: "textarea", full: true }] }
  ];
  function couponStatus(i) {
    const exp = i.expires && new Date(i.expires + "T23:59:59") < new Date();
    const st = exp ? "⏰ EXPIRED" : i.active ? "🟢 ON" : "⚪ OFF";
    const off = window.OfferKit ? window.OfferKit.offText(i) : i.value;
    return `${st} · ${off}${i.popup ? " · popup" : ""}${i.expires ? " · till " + i.expires : ""}`;
  }
  const TEXT_GROUPS = { nav: "Menu", hero: "Hero (sabse upar)", brands: "Brands line", ba: "Before / After", styles: "Edit styles", addons: "Add-ons", work: "Our work", process: "How it works", why: "Why us", packages: "Packages", testimonials: "Reviews", faq: "FAQ", contact: "Contact", order: "Order form", wa: "WhatsApp button", footer: "Footer" };
  const TEXT_HINTS = { "hero.rotator": "comma se alag karo — ye words ghoomte rahenge", "wa.default": "floating WhatsApp button dabane par jaane wala message" };

  /* ---------- state ---------- */
  let data = null, saved = "", backend = null, current = "general", loadedSha = null;
  const pending = new Map(); // path -> { blob, url, done }
  const openCards = new Set();

  const toast = (m, ms = 3000) => { const t = $("#toast"); t.textContent = m; t.classList.add("on"); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove("on"), ms); };
  const url = p => pending.get(p)?.url || p || "";
  function markDirty() {
    const d = JSON.stringify(data) !== saved || [...pending.values()].some(x => !x.done);
    $("#dirty").hidden = !d;
    $("#btnSave").disabled = !d || !backend?.canSave();
  }
  addEventListener("beforeunload", e => { if (!$("#dirty").hidden) { e.preventDefault(); e.returnValue = ""; } });

  /* ---------- backends ---------- */
  const local = {
    name: "local", label: "Local PC — changes seedha is computer par save honge",
    canSave: () => true,
    async load() { const r = await fetch("data/site.json?v=" + Date.now(), { cache: "no-store" }); if (!r.ok) throw new Error("site.json load nahi hua"); return r.json(); },
    async list() { const r = await fetch("/__admin/list"); return (await r.json()).files; },
    async save(files, prog) {
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        prog((i / files.length) * 100, `Saving ${f.path}`);
        const r = await fetch("/__admin/file?path=" + encodeURIComponent(f.path), { method: "PUT", body: f.blob || new Blob([f.text], { type: "application/json" }) });
        if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || "Save failed: " + f.path);
      }
    }
  };
  const ghCfg = () => { try { return JSON.parse(localStorage.getItem("gh-admin") || "{}"); } catch (e) { return {}; } };
  const github = {
    name: "github",
    get cfg() { return ghCfg(); },
    get label() { const c = this.cfg; return `GitHub — ${c.owner || "?"}/${c.repo || "?"} (${c.branch || "main"})${c.token ? "" : " · read-only: token daalo"}`; },
    canSave() { const c = this.cfg; return !!(c.owner && c.repo && c.token); },
    async api(path, opt = {}) {
      const c = this.cfg;
      const headers = { Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28", ...(opt.headers || {}) };
      if (c.token) headers.Authorization = "Bearer " + c.token;
      const r = await fetch(`https://api.github.com/repos/${c.owner}/${c.repo}${path}`, { ...opt, headers });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(`GitHub: ${j.message || r.status}${r.status === 401 ? " (token galat ya expire)" : r.status === 404 ? " (repo / file nahi mila ya token ko access nahi)" : ""}`);
      return j;
    },
    async load() {
      const c = this.cfg;
      const j = await this.api(`/contents/data/site.json?ref=${encodeURIComponent(c.branch || "main")}&t=${Date.now()}`);
      loadedSha = j.sha;
      const bytes = Uint8Array.from(atob(j.content.replace(/\n/g, "")), ch => ch.charCodeAt(0));
      return JSON.parse(new TextDecoder().decode(bytes));
    },
    async list() {
      const c = this.cfg;
      const j = await this.api(`/git/trees/${encodeURIComponent(c.branch || "main")}?recursive=1`);
      return j.tree.filter(x => x.type === "blob" && x.path.startsWith("assets/")).map(x => ({ path: x.path, size: x.size }));
    },
    async save(files, prog) {
      const c = this.cfg, br = encodeURIComponent(c.branch || "main");
      prog(2, "GitHub se connect ho raha hai…");
      const cur = await this.api(`/contents/data/site.json?ref=${br}&t=${Date.now()}`).catch(() => null);
      if (cur && loadedSha && cur.sha !== loadedSha && !confirm("Admin khulne ke baad kisi aur jagah (jaise mobile) se bhi changes save hue hain. Unke upar overwrite karein?")) throw new Error("Cancelled");
      const ref = await this.api(`/git/ref/heads/${br}`);
      const base = await this.api(`/git/commits/${ref.object.sha}`);
      const tree = [];
      let jsonSha = null;
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        prog(5 + (i / files.length) * 80, `Uploading ${f.path}${f.blob ? ` (${(f.blob.size / 1048576).toFixed(1)} MB)` : ""}`);
        const body = f.blob ? { content: await b64(f.blob), encoding: "base64" } : { content: f.text, encoding: "utf-8" };
        const blob = await this.api("/git/blobs", { method: "POST", body: JSON.stringify(body) });
        tree.push({ path: f.path, mode: "100644", type: "blob", sha: blob.sha });
        if (f.path === "data/site.json") jsonSha = blob.sha;
      }
      prog(90, "Commit ban raha hai…");
      const t = await this.api("/git/trees", { method: "POST", body: JSON.stringify({ base_tree: base.tree.sha, tree }) });
      const cm = await this.api("/git/commits", { method: "POST", body: JSON.stringify({ message: "Admin panel: website update", tree: t.sha, parents: [ref.object.sha] }) });
      await this.api(`/git/refs/heads/${br}`, { method: "PATCH", body: JSON.stringify({ sha: cm.sha }) });
      if (jsonSha) loadedSha = jsonSha;
    }
  };
  const b64 = blob => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(",")[1]); r.onerror = rej; r.readAsDataURL(blob); });

  /* ---------- boot ---------- */
  async function boot() {
    try {
      const r = await fetch("/__admin/ping", { cache: "no-store" });
      if (r.ok && (await r.json()).mode === "local") backend = local;
    } catch (e) {}
    if (!backend) {
      const c = ghCfg();
      if (!c.owner && /\.github\.io$/.test(location.hostname)) {
        c.owner = location.hostname.split(".")[0];
        const seg = location.pathname.split("/").filter(Boolean)[0];
        c.repo = seg && seg !== "admin.html" ? seg : `${c.owner}.github.io`;
        c.branch = "main";
        localStorage.setItem("gh-admin", JSON.stringify(c));
      }
      backend = github;
    }
    $("#modeLabel").textContent = backend.label;
    try {
      data = backend === github && !github.cfg.owner ? await local.load() : await backend.load();
    } catch (e) {
      try { data = await local.load(); toast("Live data nahi mila, website ki copy dikh rahi hai: " + e.message, 6000); } catch (e2) { $("#main").innerHTML = `<div class="empty err">Data load nahi hua: ${esc(e.message)}</div>`; return; }
    }
    normalize();
    saved = JSON.stringify(data);
    if (data.general?.logo) $("#topLogo").src = data.general.logo;
    renderSide();
    go(backend === github && !github.canSave() ? "_conn" : (location.hash.slice(1) || "general"));
    markDirty();
  }
  function normalize() {
    for (const s of SECTIONS) {
      if (s.kind === "list" && !Array.isArray(data[s.key])) data[s.key] = [];
      if ((s.kind === "obj" || s.kind === "texts") && typeof data[s.key] !== "object") data[s.key] = {};
    }
  }

  /* ---------- navigation ---------- */
  function renderSide() {
    $("#side").innerHTML = SECTIONS.map(s => `<a data-go="${s.key}">${s.icon} ${esc(s.label)}${s.kind === "list" ? `<span class="n">${data[s.key].length}</span>` : ""}</a>`).join("") +
      `<hr><a data-go="_conn">🔐 Connection / GitHub</a><a href="index.html" target="_blank">🌐 Live website kholo</a>`;
    $$("#side a").forEach(a => a.classList.toggle("on", a.dataset.go === current));
  }
  $("#side").addEventListener("click", e => { const a = e.target.closest("[data-go]"); if (a) { e.preventDefault(); go(a.dataset.go); } });
  function go(key) {
    current = SECTIONS.some(s => s.key === key) || key === "_conn" ? key : "general";
    history.replaceState(null, "", "#" + current);
    $$("#side a").forEach(a => a.classList.toggle("on", a.dataset.go === current));
    $("#side a.on")?.scrollIntoView({ block: "nearest", inline: "center" });
    render(); scrollTo(0, 0);
  }

  /* ---------- rendering ---------- */
  function render() {
    const m = $("#main");
    if (current === "_conn") return renderConn(m);
    const s = SECTIONS.find(x => x.key === current);
    let html = `<div class="ph"><div><h1>${s.icon} ${esc(s.label)}</h1>${s.desc ? `<p>${esc(s.desc)}</p>` : ""}</div><div class="ph__btns">`;
    if (s.kind === "list") {
      if (s.sortPrice) html += `<button class="b b--ghost b--sm" data-act="sort">⇅ Rate ke hisaab se (zyada → kam)</button>`;
      if (!s.max || data[s.key].length < s.max) html += `<button class="b b--gold b--sm" data-act="add">+ Naya add karo</button>`;
    }
    html += `</div></div>`;
    if (s.key === "services") html += `<div class="hint">💡 Rate rule: sabse zyada kaam (3D tracking, roto) sabse mehenga → sirf captions sabse sasta. Upar wala card website par pehle dikhega — ↑ ↓ se order badlo.</div>`;
    if (["portfolio", "heroPhones", "services"].includes(s.key)) html += `<div class="hint">🎞 Bade videos (25 MB+) website slow karte hain. Pehle <b>tools\\Video-Chhota-Karo.bat</b> par video drag karo, phir uski <b>_web.mp4</b> file yahan upload karo.</div>`;
    m.innerHTML = html + `<div id="ed"></div>`;
    const ed = $("#ed");
    if (s.kind === "obj") { const c = el(`<div class="card solo"><div class="grid"></div></div>`); fields(s.fields, data[s.key], $(".grid", c)); ed.append(c); }
    else if (s.kind === "texts") renderTexts(ed);
    else renderList(s, ed);
    $$("[data-act]", m).forEach(b => b.addEventListener("click", () => {
      if (b.dataset.act === "add") { data[s.key].push(s.tpl()); openCards.add(s.key + ":" + (data[s.key].length - 1)); afterListChange(s); setTimeout(() => $("#ed .card:last-child")?.scrollIntoView({ behavior: "smooth", block: "center" }), 50); }
      if (b.dataset.act === "sort") { data[s.key].sort((a, b) => (+b.price || 0) - (+a.price || 0)); afterListChange(s); toast("Rate ke hisaab se sort ho gaya"); }
    }));
  }
  function afterListChange(s) { markDirty(); renderSide(); render(); }

  function renderList(s, ed) {
    const arr = data[s.key];
    if (!arr.length) ed.innerHTML = `<div class="empty">Abhi kuch nahi hai. “+ Naya add karo” dabao.</div>`;
    arr.forEach((item, i) => {
      const id = s.key + ":" + i;
      const c = el(`<div class="card ${openCards.has(id) ? "open" : ""}">
        <div class="card__head"><span class="chev">▶</span><div class="card__thumb-wrap"></div><div class="card__title"><b></b><small></small></div>
          <div class="card__tools">
            <button class="b b--xs b--ghost" data-m="up" title="Upar" ${i ? "" : "disabled"}>↑</button>
            <button class="b b--xs b--ghost" data-m="down" title="Neeche" ${i < arr.length - 1 ? "" : "disabled"}>↓</button>
            <button class="b b--xs b--ghost" data-m="dup" title="Copy banao" ${s.max && arr.length >= s.max ? "disabled" : ""}>⧉</button>
            <button class="b b--xs b--red" data-m="del" title="Delete">🗑</button>
          </div></div>
        <div class="card__body"><div class="grid"></div></div></div>`);
      const head = () => {
        const tt = typeof s.title === "function" ? s.title(item) : item[s.title];
        $(".card__title b", c).textContent = tt || "(bina naam)";
        $(".card__title small", c).textContent = s.sub ? s.sub(item) || "" : "";
        const tw = $(".card__thumb-wrap", c);
        tw.innerHTML = s.thumb && item[s.thumb] ? `<img class="card__thumb" src="${esc(url(item[s.thumb]))}" alt="">` : "";
      };
      head();
      $(".card__head", c).addEventListener("click", e => {
        const b = e.target.closest("[data-m]");
        if (b) {
          e.stopPropagation();
          if (b.dataset.m === "up") [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]];
          if (b.dataset.m === "down") [arr[i + 1], arr[i]] = [arr[i], arr[i + 1]];
          if (b.dataset.m === "dup") { const cp = clone(item); if (cp.id) cp.id = cp.id + "-" + Date.now().toString(36).slice(-4); arr.splice(i + 1, 0, cp); }
          if (b.dataset.m === "del") { if (!confirm(`“${$(".card__title b", c).textContent}” delete karna hai?`)) return; arr.splice(i, 1); }
          openCards.clear();
          return afterListChange(s);
        }
        c.classList.toggle("open");
        c.classList.contains("open") ? openCards.add(id) : openCards.delete(id);
        if (c.classList.contains("open") && !$(".grid", c).children.length) fields(s.fields, item, $(".grid", c), head);
      });
      if (openCards.has(id)) fields(s.fields, item, $(".grid", c), head);
      ed.append(c);
    });
  }

  function renderTexts(ed) {
    const T = data.texts;
    const groups = {};
    Object.keys(T).forEach(k => { const g = k.split(".")[0]; (groups[g] = groups[g] || []).push(k); });
    Object.entries(groups).forEach(([g, keys]) => {
      ed.append(el(`<div class="tgroup">${esc(TEXT_GROUPS[g] || g)}</div>`));
      const c = el(`<div class="card solo"><div class="grid"></div></div>`);
      fields(keys.map(k => ({ k, label: k.split(".").slice(1).join(" › "), hint: TEXT_HINTS[k], type: String(T[k]).length > 70 ? "textarea" : "text", full: String(T[k]).length > 40 })), T, $(".grid", c));
      ed.append(c);
    });
  }

  /* ---------- fields ---------- */
  function el(html) { const d = document.createElement("div"); d.innerHTML = html.trim(); return d.firstChild; }
  function fields(defs, obj, grid, onChange = () => {}) {
    grid.innerHTML = "";
    const live = [];
    let lt = 0;
    const changed = () => { markDirty(); onChange(); clearTimeout(lt); lt = setTimeout(() => live.forEach(f => f()), 150); };
    defs.forEach(d => {
      const type = d.type || "text";
      const lab = `<span>${esc(d.label)}${d.hint ? ` <em>— ${esc(d.hint)}</em>` : ""}</span>`;
      let f;
      if (type === "image" || type === "video") { f = mediaField(d, obj, changed, () => fields(defs, obj, grid, onChange)); }
      else if (type === "secretcode") {
        const known = obj.code || obj._plain || "";
        f = el(`<label class="f f--full">${lab}<input type="text" autocapitalize="characters" spellcheck="false" autocomplete="off" style="text-transform:uppercase;letter-spacing:.08em;font-weight:700"><small class="media__note"></small></label>`);
        const i = $("input", f), note = $("small", f);
        i.value = known;
        i.placeholder = obj.hint ? `Secret code (${obj.hint}) — badalne ke liye naya code likho` : "jaise DIWALI20";
        const say = () => note.textContent = obj.popup
          ? "Popup ON hai — ye code popup mein sabko dikhega (copy button ke saath)."
          : `🔒 Secret — website ki file mein sirf iska fingerprint (hash) save hota hai, code kisi ko nahi dikhta.${obj.hint ? " Abhi: " + obj.hint : ""}`;
        say(); live.push(say);
        i.addEventListener("input", () => {
          const v = window.OfferKit.norm(i.value); i.value = v;
          if (v) { obj._plain = v; obj.hash = window.OfferKit.hashCode(v); obj.hint = window.OfferKit.hintOf(v); if (obj.popup) obj.code = v; }
          changed();
        });
      }
      else if (type === "offerPreview") {
        f = el(`<div class="f f--full">${lab}<div class="opv"></div><small class="media__note opv__t"></small></div>`);
        const box = $(".opv", f), note = $(".opv__t", f);
        const draw = () => { if (!window.OfferKit) { box.textContent = "Preview load nahi hua"; return; } const th = window.OfferKit.preview(box, obj); note.textContent = "Theme: " + th.label + (obj.theme === "auto" || !obj.theme ? " (naam se apne aap)" : ""); };
        draw(); live.push(draw);
      } else if (type === "color") {
        f = el(`<label class="f ${d.full ? "f--full" : ""}">${lab}<div class="price-row"><input type="color"><input type="text" placeholder="theme ka colour" spellcheck="false"><button type="button" class="b b--xs b--ghost">Reset</button></div></label>`);
        const [pick, txt] = $$("input", f), rs = $("button", f);
        const sync = v => { txt.value = v || ""; if (/^#[0-9a-f]{6}$/i.test(v || "")) pick.value = v; };
        sync(obj[d.k]);
        pick.addEventListener("input", () => { obj[d.k] = pick.value; sync(pick.value); changed(); });
        txt.addEventListener("input", () => { obj[d.k] = txt.value.trim(); changed(); });
        rs.addEventListener("click", () => { obj[d.k] = ""; sync(""); changed(); });
      }
      else if (type === "check") {
        f = el(`<label class="f f--check ${d.full ? "f--full" : ""}"><input type="checkbox">${lab}</label>`);
        const i = $("input", f); i.checked = !!obj[d.k]; i.addEventListener("change", () => { obj[d.k] = i.checked; if (d.k === "popup") { if (i.checked) obj.code = obj.code || obj._plain || ""; else obj.code = ""; } changed(); });
      } else if (type === "select" || type === "style") {
        const opts = type === "style" ? [["", "— koi nahi —"], ...data.services.map(s => [s.id, `${s.name} (${rupee(s.price)})`])] : typeof d.options === "function" ? d.options() : d.options;
        f = el(`<label class="f ${d.full ? "f--full" : ""}">${lab}<select>${opts.map(([v, t]) => `<option value="${esc(v)}">${esc(t)}</option>`).join("")}</select></label>`);
        const i = $("select", f); i.value = obj[d.k] ?? "";
        i.addEventListener("change", () => { obj[d.k] = d.num ? Number(i.value) : i.value; changed(); });
      } else if (type === "lines") {
        f = el(`<label class="f ${d.full ? "f--full" : ""}">${lab}<textarea rows="4"></textarea></label>`);
        const i = $("textarea", f); i.value = (obj[d.k] || []).join("\n");
        i.addEventListener("input", () => { obj[d.k] = i.value.split("\n").map(x => x.trim()).filter(Boolean); changed(); });
      } else {
        const tag = type === "textarea" ? `<textarea rows="3"></textarea>` : `<input type="${type === "number" ? "number" : type === "date" ? "date" : "text"}" ${type === "number" ? 'inputmode="numeric" step="1"' : ""} ${d.upper ? 'autocapitalize="characters" spellcheck="false" style="text-transform:uppercase;letter-spacing:.08em;font-weight:700"' : ""}>`;
        f = el(`<label class="f ${d.full ? "f--full" : ""}">${lab}${d.price ? `<div class="price-row"><b>₹</b>${tag}</div>` : tag}</label>`);
        const i = $("input,textarea", f); i.value = obj[d.k] ?? "";
        const validate = () => d.check && i.classList.toggle("bad", !d.check(i.value));
        validate();
        i.addEventListener("input", () => { obj[d.k] = type === "number" ? (i.value === "" ? 0 : Number(i.value)) : d.upper ? i.value.toUpperCase().replace(/\s+/g, "") : i.value; validate(); changed(); });
      }
      grid.append(f);
    });
  }

  function mediaField(d, obj, changed, rerender) {
    const v = d.type === "video";
    const p = obj[d.k] || "";
    const pend = pending.has(p) && !pending.get(p).done;
    const f = el(`<div class="f f--full"><span>${esc(d.label)} ${pend ? '<span class="pend">NEW — save pending</span>' : ""}</span>
      <div class="media"><div class="media__prev ${v ? "" : "img"}">${p ? (v ? `<video src="${esc(url(p))}" muted playsinline preload="metadata" controls></video>` : `<img src="${esc(url(p))}" alt="">`) : "khaali"}</div>
        <div class="media__ctl"><input value="${esc(p)}" placeholder="file path" spellcheck="false">
          <div class="media__btns">
            <label class="b b--sm b--gold">⬆ Upload<input type="file" hidden accept="${v ? "video/mp4,video/webm,video/quicktime" : "image/*"}"></label>
            <button class="b b--sm" data-lib>📁 Library</button>
            ${v && d.posterKey ? `<button class="b b--sm" data-poster ${p ? "" : "disabled"}>🖼 Is frame ka poster banao</button>` : ""}
            ${p ? `<button class="b b--sm b--ghost" data-clear>✕ Hatao</button>` : ""}
          </div>
          <div class="media__note">${v ? "MP4 (H.264) best. Vertical 9:16. 25 MB se chhota rakho." : "JPG / PNG / SVG / WebP."}</div>
        </div></div></div>`);
    const input = $(".media__ctl input", f), note = $(".media__note", f);
    input.addEventListener("change", () => { obj[d.k] = input.value.trim(); changed(); rerender(); });
    $("input[type=file]", f).addEventListener("change", async e => {
      const file = e.target.files[0]; if (!file) return;
      if (file.size > 95 * 1048576) { alert(`Ye file ${(file.size / 1048576).toFixed(0)} MB ki hai. GitHub 100 MB se badi file nahi leta. Pehle Video-Chhota-Karo.bat se chhota karo.`); return; }
      if (v && file.size > 25 * 1048576 && !confirm(`Video ${(file.size / 1048576).toFixed(0)} MB ka hai — website slow ho sakti hai. Phir bhi upload karein? (Better: Video-Chhota-Karo.bat use karo)`)) return;
      const ext = (file.name.split(".").pop() || (v ? "mp4" : "jpg")).toLowerCase();
      const path = `assets/uploads/${slug(file.name)}-${Date.now().toString(36)}.${ext}`;
      pending.set(path, { blob: file, url: URL.createObjectURL(file) });
      obj[d.k] = path;
      if (d.clearKey) obj[d.clearKey] = "";
      if (v && d.posterKey) {
        note.textContent = "Poster ban raha hai…";
        try { obj[d.posterKey] = await makePoster(url(path), null); } catch (err) { toast("Poster auto nahi bana — 'Is frame ka poster banao' dabao"); }
      }
      changed(); rerender(); toast("Upload ready ✓ — “Save & Publish” dabane par live hoga");
    });
    $("[data-lib]", f).addEventListener("click", () => openLib(v ? "video" : "image", path => { obj[d.k] = path; if (d.clearKey && v) obj[d.clearKey] = ""; changed(); rerender(); }));
    $("[data-clear]", f)?.addEventListener("click", () => { obj[d.k] = ""; changed(); rerender(); });
    $("[data-poster]", f)?.addEventListener("click", async () => {
      const vid = $("video", f);
      try { obj[d.posterKey] = await makePoster(url(obj[d.k]), vid?.currentTime || null); changed(); rerender(); toast("Poster ban gaya ✓"); }
      catch (err) { toast("Poster nahi bana: " + err.message); }
    });
    if (v && p) {
      const vid = $("video", f);
      vid.addEventListener("loadedmetadata", () => {
        const w = vid.videoWidth, h = vid.videoHeight;
        if (w && h && w > h) { note.classList.add("warn"); note.textContent = `⚠ Ye video horizontal hai (${w}×${h}). Website par vertical 9:16 best dikhta hai.`; }
        else if (w) note.textContent = `${w}×${h} · ${vid.duration.toFixed(1)} sec`;
      });
    }
    return f;
  }

  function makePoster(src, at) {
    return new Promise((res, rej) => {
      const vid = document.createElement("video");
      vid.muted = true; vid.playsInline = true; vid.preload = "auto"; vid.src = src;
      const fail = () => rej(new Error("video read nahi hua"));
      vid.onerror = fail;
      vid.onloadedmetadata = () => { vid.currentTime = at ?? Math.min(1.2, vid.duration * 0.3); };
      vid.onseeked = () => {
        const sc = Math.min(1, 720 / Math.max(vid.videoWidth, vid.videoHeight));
        const c = document.createElement("canvas");
        c.width = Math.round(vid.videoWidth * sc); c.height = Math.round(vid.videoHeight * sc);
        c.getContext("2d").drawImage(vid, 0, 0, c.width, c.height);
        c.toBlob(b => {
          if (!b) return fail();
          const path = `assets/uploads/poster-${Date.now().toString(36)}.jpg`;
          pending.set(path, { blob: b, url: URL.createObjectURL(b) });
          res(path);
        }, "image/jpeg", 0.85);
      };
      setTimeout(() => rej(new Error("timeout")), 15000);
    });
  }

  /* ---------- media library ---------- */
  let libCache = null;
  async function openLib(kind, pick) {
    const dlg = $("#libDlg"), grid = $("#libGrid");
    dlg.hidden = false; grid.innerHTML = `<div class="empty">Loading…</div>`;
    try { libCache = libCache || await backend.list(); }
    catch (e) { try { libCache = await local.list(); } catch (e2) { grid.innerHTML = `<div class="empty err">${esc(e.message)}</div>`; return; } }
    const all = [...[...pending.keys()].map(p => ({ path: p, isNew: true })), ...libCache]
      .filter(x => kind === "video" ? isVideo(x.path) : /\.(jpe?g|png|svg|webp|gif)$/i.test(x.path));
    const draw = q => {
      grid.innerHTML = all.filter(x => !q || x.path.toLowerCase().includes(q)).map(x => `<button data-p="${esc(x.path)}"><div class="th">${kind === "video" ? `<video src="${esc(url(x.path))}#t=1" muted preload="metadata"></video>` : `<img src="${esc(url(x.path))}" loading="lazy" alt="">`}</div><small>${x.isNew ? "🆕 " : ""}${esc(x.path.replace(/^assets\//, ""))}</small></button>`).join("") || `<div class="empty">Kuch nahi mila</div>`;
    };
    draw("");
    $("#libSearch").value = ""; $("#libSearch").oninput = e => draw(e.target.value.toLowerCase());
    grid.onclick = e => { const b = e.target.closest("[data-p]"); if (b) { dlg.hidden = true; pick(b.dataset.p); } };
  }
  $("#libDlg").addEventListener("click", e => { if (e.target.id === "libDlg" || e.target.closest("[data-close]")) $("#libDlg").hidden = true; });

  /* ---------- connection page ---------- */
  function renderConn(m) {
    const c = ghCfg();
    const isLocal = backend === local;
    m.innerHTML = `<div class="ph"><div><h1>🔐 Connection</h1><p>${isLocal ? "Abhi aap <b>local PC</b> par ho — Save dabane par files seedha is computer mein save hongi. GitHub par daalne ke baad yahi admin panel online bhi chalega." : "Website GitHub par hai. Save karne ke liye ek baar GitHub token daalo (sirf is browser mein save hota hai)."}</p></div></div>
      <div class="card solo setup">
        <div class="grid">
          <label class="f"><span>GitHub username</span><input id="gOwner" value="${esc(c.owner || "")}" placeholder="jaise: umeshedits"></label>
          <label class="f"><span>Repository naam</span><input id="gRepo" value="${esc(c.repo || "")}" placeholder="jaise: website"></label>
          <label class="f"><span>Branch</span><input id="gBranch" value="${esc(c.branch || "main")}"></label>
          <label class="f"><span>Token <em>— github_pat_…</em></span><input id="gToken" type="password" value="${esc(c.token || "")}" placeholder="paste token" autocomplete="off"></label>
        </div>
        <div class="media__btns" style="margin-top:14px">
          <button class="b b--gold" id="gSave">Save & test connection</button>
          ${c.token ? `<button class="b b--red" id="gOut">Logout (token hatao)</button>` : ""}
        </div>
        <p id="gMsg"></p>
        <h3>Token kaise banaye (1 baar, 2 minute)</h3>
        <ol>
          <li>GitHub mein login karke kholo: <code>github.com/settings/personal-access-tokens/new</code></li>
          <li><b>Token name</b>: Website Admin · <b>Expiration</b>: 1 year</li>
          <li><b>Repository access</b>: “Only select repositories” → apni website wali repo chuno</li>
          <li><b>Permissions → Repository → Contents</b>: “Read and write”</li>
          <li>“Generate token” dabao, token copy karke upar paste karo → Save.</li>
        </ol>
        <p class="media__note">Token password jaisa hai — kisi ko mat bhejna. Jis phone / laptop se admin chalana hai, wahan ek baar daalna hoga.</p>
      </div>`;
    $("#gSave").onclick = async () => {
      const n = { owner: $("#gOwner").value.trim(), repo: $("#gRepo").value.trim(), branch: $("#gBranch").value.trim() || "main", token: $("#gToken").value.trim() };
      localStorage.setItem("gh-admin", JSON.stringify(n));
      const msg = $("#gMsg"); msg.className = ""; msg.textContent = "Checking…";
      try {
        const r = await github.api("");
        if (!r.permissions?.push) throw new Error("Token ko is repo mein likhne ki permission nahi (Contents: Read and write chahiye)");
        msg.className = "ok"; msg.textContent = `✓ Connected: ${r.full_name}`;
        if (!isLocal) { backend = github; $("#modeLabel").textContent = github.label; if ($("#dirty").hidden) { data = await github.load(); normalize(); saved = JSON.stringify(data); renderSide(); } markDirty(); }
      } catch (e) { msg.className = "err"; msg.textContent = "✗ " + e.message; }
    };
    $("#gOut")?.addEventListener("click", () => { const n = ghCfg(); delete n.token; localStorage.setItem("gh-admin", JSON.stringify(n)); $("#modeLabel").textContent = backend.label; markDirty(); render(); });
  }

  /* ---------- preview & save ---------- */
  function referenced() {
    const s = JSON.stringify(data);
    return [...pending.entries()].filter(([p, x]) => !x.done && s.includes(JSON.stringify(p))).map(([p]) => p);
  }
  function problems() {
    const out = [];
    const wa = String(data.general.whatsapp || "").replace(/\D/g, "");
    if (!/^\d{10,15}$/.test(wa)) out.push("General → WhatsApp number sahi nahi hai (orders nahi aayenge)");
    const ids = new Set();
    data.services.forEach((s, i) => {
      if (!s.name) out.push(`Edit style #${i + 1} ka naam khaali hai`);
      if (!s.id) s.id = "style-" + i + "-" + Date.now().toString(36);
      if (ids.has(s.id)) s.id += "-" + i; ids.add(s.id);
      if (!s.video) out.push(`“${s.name}” ka sample video nahi hai`);
    });
    const codes = new Set();
    data.coupons.forEach(c => {
      if (c._plain) { c.hash = window.OfferKit.hashCode(c._plain); c.hint = window.OfferKit.hintOf(c._plain); }
      if (c.popup) { c.code = c.code || c._plain || ""; if (!c.code) out.push(`“${c.name}” ka popup ON hai — coupon code dobara likho taaki popup mein dikh sake`); }
      else delete c.code;
      delete c._plain;
      if (!c.hash) out.push(`Offer “${c.name}” ka coupon code khaali hai`);
      else if (codes.has(c.hash)) out.push(`Coupon ${c.hint} do baar hai`);
      codes.add(c.hash);
      if (!(Number(c.value) > 0)) out.push(`Coupon ${c.hint} ka discount 0 hai`);
      if (c.type !== "flat" && Number(c.value) > 90) out.push(`Coupon ${c.hint} ka discount ${c.value}% hai — sahi hai?`);
    });
    if (data.coupons.filter(c => c.popup && c.active).length > 1) out.push("Ek se zyada popup ON hain — website par sirf list ka pehla dikhega");
    data.portfolio.forEach(p => { if (!p.video) out.push(`Portfolio “${p.title}” ka video nahi hai`); });
    data.beforeAfter.forEach(b => { if (!b.before || !b.after) out.push(`Before/After “${b.label}” mein dono videos chahiye`); });
    return out;
  }
  $("#btnPreview").addEventListener("click", () => {
    const draft = clone(data);
    const swap = o => { for (const k in o) { if (typeof o[k] === "string" && pending.has(o[k])) o[k] = pending.get(o[k]).url; else if (o[k] && typeof o[k] === "object") swap(o[k]); } };
    swap(draft);
    (draft.coupons || []).forEach(c => { if (c.popup && !c.code && c._plain) c.code = c._plain; delete c._plain; });
    try { localStorage.setItem("site-draft", JSON.stringify(draft)); } catch (e) { toast("Preview save nahi hua"); return; }
    window.open("index.html?preview=1", "_blank");
  });
  $("#btnSave").addEventListener("click", async () => {
    if (!backend.canSave()) { go("_conn"); toast("Pehle GitHub token daalo"); return; }
    const probs = problems();
    if (probs.length && !confirm("Ye cheezein check kar lo:\n\n• " + probs.join("\n• ") + "\n\nPhir bhi save karein?")) return;
    const files = referenced().map(p => ({ path: p, blob: pending.get(p).blob }));
    files.push({ path: "data/site.json", text: JSON.stringify(data, null, 2) + "\n" });
    const dlg = $("#progDlg"), bar = $("#progBar"), txt = $("#progText");
    dlg.hidden = false; $("#progOk").hidden = true; $("#progTitle").textContent = "Saving…";
    const prog = (pc, m) => { bar.style.width = pc + "%"; txt.textContent = m; };
    try {
      await backend.save(files, prog);
      files.forEach(f => { if (pending.has(f.path)) pending.get(f.path).done = true; });
      saved = JSON.stringify(data); libCache = null;
      prog(100, backend === local
        ? "Saved ✓\nWebsite tab refresh karo — changes dikh jayenge.\nGitHub par daalne ke liye GitHub Desktop se “Commit + Push” karo."
        : "Saved ✓\nGitHub par commit ho gaya. 1–2 minute mein live website par dikhega.");
      $("#progTitle").textContent = "Ho gaya!";
      markDirty(); render();
    } catch (e) {
      $("#progTitle").textContent = "Save nahi hua";
      prog(0, e.message === "Cancelled" ? "Cancel kar diya." : "✗ " + e.message + "\n\nInternet / token check karo aur dobara try karo.");
    }
    $("#progOk").hidden = false;
  });
  $("#progOk").addEventListener("click", () => $("#progDlg").hidden = true);
  addEventListener("keydown", e => { if ((e.ctrlKey || e.metaKey) && e.key === "s") { e.preventDefault(); if (!$("#btnSave").disabled) $("#btnSave").click(); } });

  addEventListener("hashchange", () => { const k = location.hash.slice(1); if (k && k !== current) go(k); });
  boot();
})();
