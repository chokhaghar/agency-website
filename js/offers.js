/* OfferKit — festive offer popup + automatic themes.
   Theme comes from the offer name ("Navratri Offer" → navratri theme). Unknown names get a unique colour theme
   generated from the name itself, so any festival / campaign name works. Used by the site and the admin preview. */
(() => {
  const THEMES = {
    diwali:     { label: "Diwali", k: ["diwali", "deepawali", "deepavali", "dhanteras", "दिवाली", "deep"], bg: ["#2b0a3d", "#120419"], glow: "#ff9800", accent: "#FFC107", accent2: "#FF6D00", emojis: ["🪔", "✨", "🎆"], fx: "sparks", headline: "Is Diwali, apne project ko roshan karo" },
    navratri:   { label: "Navratri", k: ["navratri", "navaratri", "garba", "dandiya", "durga", "नवरात्रि"], bg: ["#6a0045", "#2a0030"], glow: "#ff4081", accent: "#FFEB3B", accent2: "#FF6F00", emojis: ["💃", "🪘", "🌺"], fx: "emoji", fxItems: ["🌺", "🌼", "✨"], headline: "Navratri ke 9 din — 9 guna zyada leads" },
    holi:       { label: "Holi", k: ["holi", "rang", "होली"], bg: ["#3a0ca3", "#7209b7"], glow: "#f72585", accent: "#FFEA00", accent2: "#00E5FF", emojis: ["🎨", "💦", "🌈"], fx: "powder", fxColors: ["#f72585", "#4cc9f0", "#ffea00", "#80ffdb", "#ff9e00"], headline: "Holi hai! Apne videos mein bharo rang" },
    dussehra:   { label: "Dussehra", k: ["dussehra", "dasara", "dashehra", "vijayadashami"], bg: ["#4a0d0d", "#1c0505"], glow: "#ff5722", accent: "#FFB74D", accent2: "#FF3D00", emojis: ["🏹", "🔥", "✨"], fx: "sparks", headline: "Buraai par achhai ki jeet — aur aapke project ki bhi" },
    ganesh:     { label: "Ganesh Chaturthi", k: ["ganesh", "ganpati", "ganapati", "chaturthi", "vinayak"], bg: ["#7a1f00", "#2e0b00"], glow: "#ff9100", accent: "#FFE082", accent2: "#FF6D00", emojis: ["🙏", "🌺", "🪔"], fx: "emoji", fxItems: ["🌺", "🌸"], headline: "Ganpati Bappa Morya — shubh shuruaat ka offer" },
    rakhi:      { label: "Raksha Bandhan", k: ["raksha", "rakhi", "bandhan"], bg: ["#5b0e2d", "#26040f"], glow: "#ec407a", accent: "#FFD54F", accent2: "#F06292", emojis: ["🎀", "💝", "✨"], fx: "emoji", fxItems: ["🎀", "✨"], headline: "Is Rakhi, ek pyara sa tohfa" },
    india:      { label: "Independence / Republic Day", k: ["independence", "republic", "15 august", "26 january", "azadi", "tiranga", "swatantrata", "gantantra"], bg: ["#0b1a3a", "#050c1f"], glow: "#ff9933", accent: "#FF9933", accent2: "#22c55e", emojis: ["🇮🇳", "🎉"], fx: "confetti", fxColors: ["#FF9933", "#ffffff", "#138808"], headline: "Azadi ka jashn — offer ke saath" },
    eid:        { label: "Eid", k: ["eid", "ramadan", "ramzan", "bakrid"], bg: ["#04342b", "#021a15"], glow: "#14b8a6", accent: "#FDE68A", accent2: "#5eead4", emojis: ["🌙", "⭐", "✨"], fx: "emoji", fxItems: ["⭐", "✨"], headline: "Eid Mubarak — khushiyon ka offer" },
    christmas:  { label: "Christmas", k: ["christmas", "xmas", "santa", "x-mas"], bg: ["#0b3d2e", "#051f17"], glow: "#ef4444", accent: "#FDE047", accent2: "#ef4444", emojis: ["🎄", "🎅", "🎁"], fx: "snow", headline: "Merry Christmas — ek tohfa aapke project ke liye" },
    newyear:    { label: "New Year", k: ["new year", "newyear", "nye", "naya saal", "2027", "2028"], bg: ["#0a0a2a", "#020212"], glow: "#6366f1", accent: "#FFD700", accent2: "#a78bfa", emojis: ["🎆", "🥂", "🎉"], fx: "confetti", headline: "Naya saal, naye leads" },
    sankranti:  { label: "Makar Sankranti", k: ["sankranti", "uttarayan", "kite", "patang", "lohri", "pongal"], bg: ["#075985", "#0c2a4a"], glow: "#38bdf8", accent: "#FACC15", accent2: "#fb923c", emojis: ["🪁", "☀️"], fx: "emoji", fxItems: ["🪁"], headline: "Patang ki tarah upar jao" },
    valentine:  { label: "Valentine", k: ["valentine", "love", "pyaar"], bg: ["#4a0418", "#1f020a"], glow: "#f43f5e", accent: "#fecdd3", accent2: "#fb7185", emojis: ["❤️", "🌹"], fx: "emoji", fxItems: ["❤️", "💖"], headline: "Apne project se pyaar karo" },
    monsoon:    { label: "Monsoon", k: ["monsoon", "barish", "baarish", "rain", "sawan"], bg: ["#0c2340", "#06111f"], glow: "#3b82f6", accent: "#93c5fd", accent2: "#38bdf8", emojis: ["🌧️", "☔"], fx: "rain", headline: "Barish mein bhi leads ki bauchhar" },
    summer:     { label: "Summer", k: ["summer", "garmi", "holiday"], bg: ["#7c2d12", "#2a0f05"], glow: "#f97316", accent: "#fde047", accent2: "#fb923c", emojis: ["☀️", "🏖️"], fx: "sparks", headline: "Summer special — garmi jaisi hot deal" },
    sale:       { label: "Flash Sale", k: ["black friday", "flash", "mega", "sale", "cyber", "limited"], bg: ["#0a0a0a", "#000000"], glow: "#facc15", accent: "#FACC15", accent2: "#ef4444", emojis: ["⚡", "🔥"], fx: "sparks", headline: "Flash sale — sirf kuch din" },
    celebration:{ label: "Anniversary / Birthday", k: ["anniversary", "birthday", "saalgirah", "celebration", "launch"], bg: ["#1e1b4b", "#0b0a24"], glow: "#a855f7", accent: "#f0abfc", accent2: "#facc15", emojis: ["🎉", "🎈", "🎂"], fx: "confetti", headline: "Jashn ka mauka, discount ka tohfa" }
  };

  function hash(s) { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return Math.abs(h); }
  function themeFor(name, override = "auto", extra = {}) {
    let key = override && override !== "auto" && THEMES[override] ? override : null;
    const n = String(name || "").toLowerCase();
    if (!key) key = Object.keys(THEMES).find(k => THEMES[k].k.some(w => n.includes(w)));
    let t;
    if (key) t = { key, ...THEMES[key] };
    else { // generated theme for any other name
      const h = hash(n) % 360;
      t = { key: "custom", label: "Custom (" + (name || "offer") + ")", bg: [`hsl(${h} 55% 16%)`, `hsl(${(h + 30) % 360} 60% 7%)`], glow: `hsl(${h} 90% 55%)`,
        accent: `hsl(${(h + 45) % 360} 95% 64%)`, accent2: `hsl(${(h + 330) % 360} 90% 62%)`, emojis: ["🎉", "✨", "🎁"], fx: "confetti", headline: "Special offer — sirf aapke liye" };
    }
    if (extra.color) t = { ...t, accent: extra.color };
    if (extra.emoji) {
      const parts = typeof Intl.Segmenter === "function" ? [...new Intl.Segmenter().segment(extra.emoji)].map(x => x.segment) : Array.from(extra.emoji);
      const list = parts.filter(x => x.trim());
      if (list.length) t = { ...t, emojis: list, fxItems: list };
    }
    return t;
  }


  /* coupon codes are stored only as salted SHA-256 hashes (sync implementation, so WhatsApp opens inside the tap) */
  const SALT = "reelestate:";
  function sha256(str) {
    const K = [0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
    const H = [0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
    const bytes = Array.from(new TextEncoder().encode(str));
    const bitLen = bytes.length * 8;
    bytes.push(0x80); while (bytes.length % 64 !== 56) bytes.push(0);
    for (let i = 7; i >= 0; i--) bytes.push(i > 3 ? 0 : (bitLen >>> (i * 8)) & 255);
    const W = new Array(64), rot = (x, n) => (x >>> n) | (x << (32 - n));
    for (let off = 0; off < bytes.length; off += 64) {
      for (let i = 0; i < 16; i++) W[i] = (bytes[off + i * 4] << 24) | (bytes[off + i * 4 + 1] << 16) | (bytes[off + i * 4 + 2] << 8) | bytes[off + i * 4 + 3];
      for (let i = 16; i < 64; i++) {
        const s0 = rot(W[i - 15], 7) ^ rot(W[i - 15], 18) ^ (W[i - 15] >>> 3), s1 = rot(W[i - 2], 17) ^ rot(W[i - 2], 19) ^ (W[i - 2] >>> 10);
        W[i] = (W[i - 16] + s0 + W[i - 7] + s1) | 0;
      }
      let [a, b, c, d, e, f, g, h] = H;
      for (let i = 0; i < 64; i++) {
        const t1 = (h + (rot(e, 6) ^ rot(e, 11) ^ rot(e, 25)) + ((e & f) ^ (~e & g)) + K[i] + W[i]) | 0;
        const t2 = ((rot(a, 2) ^ rot(a, 13) ^ rot(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) | 0;
        h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
      }
      H[0] = (H[0] + a) | 0; H[1] = (H[1] + b) | 0; H[2] = (H[2] + c) | 0; H[3] = (H[3] + d) | 0; H[4] = (H[4] + e) | 0; H[5] = (H[5] + f) | 0; H[6] = (H[6] + g) | 0; H[7] = (H[7] + h) | 0;
    }
    return H.map(x => (x >>> 0).toString(16).padStart(8, "0")).join("");
  }
  const norm = c => String(c || "").toUpperCase().replace(/\s+/g, "");
  const hashCode = c => sha256(SALT + norm(c));
  const hintOf = c => { c = norm(c); return c.length <= 4 ? c[0] + "•••" : c.slice(0, 2) + "•".repeat(Math.max(2, c.length - 4)) + c.slice(-2); };
  const offText = c => c.type === "flat" ? `₹${Number(c.value || 0).toLocaleString("en-IN")} OFF` : `${Number(c.value || 0)}% OFF`;
  const esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const endOf = d => { if (!d) return null; const t = new Date(d + "T23:59:59"); return isNaN(t) ? null : t; };
  const isValid = c => c && c.active && c.hash && (!endOf(c.expires) || endOf(c.expires) > new Date());
  const styleVars = t => `--o-bg1:${t.bg[0]};--o-bg2:${t.bg[1]};--o-glow:${t.glow};--o-ac:${t.accent};--o-ac2:${t.accent2}`;

  function cardHTML(c, t, { preview = false } = {}) {
    const ends = endOf(c.expires);
    return `
      <div class="offer__card" style="${styleVars(t)}">
        <canvas class="offer__fx"></canvas>
        <div class="offer__rays"></div>
        ${preview ? "" : `<button class="offer__x" data-offer-close aria-label="Close">×</button>`}
        <div class="offer__emojis">${t.emojis.slice(0, 3).map((e, i) => `<span style="animation-delay:${-i * .7}s">${esc(e)}</span>`).join("")}</div>
        <p class="offer__name">${esc(c.name || t.label + " Offer")}</p>
        <div class="offer__big"><span>${esc(offText(c))}</span></div>
        <p class="offer__head">${esc(c.headline || t.headline)}</p>
        ${c.subtext ? `<p class="offer__sub">${esc(c.subtext)}</p>` : ""}
        <div class="offer__code"><div><small>Coupon code</small><b>${esc(c.code || c._plain || c.hint || "CODE")}</b></div><button type="button" data-offer-copy>Copy</button></div>
        ${ends ? `<div class="offer__timer" data-ends="${ends.getTime()}">Offer khatam hone mein <b>—</b></div>` : ""}
        <button class="offer__claim" type="button" data-offer-claim>Claim ${esc(offText(c))} →</button>
        ${preview ? "" : `<button class="offer__later" type="button" data-offer-close>Baad mein</button>`}
      </div>`;
  }

  /* ---------- particles ---------- */
  function startFx(canvas, t) {
    const ctx = canvas.getContext("2d"); if (!ctx) return () => {};
    let W = 0, H = 0, raf = 0, alive = true;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const resize = () => { const r = canvas.getBoundingClientRect(); W = r.width; H = r.height; canvas.width = W * dpr; canvas.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    resize();
    const kind = t.fx, colors = t.fxColors || [t.accent, t.accent2, "#ffffff"], items = t.fxItems || t.emojis;
    const N = kind === "rain" ? 70 : kind === "powder" ? 14 : kind === "emoji" ? 16 : 55;
    const rnd = (a, b) => a + Math.random() * (b - a);
    const make = (fresh) => {
      const p = { x: rnd(0, W), y: fresh ? rnd(-H, H) : -20, r: 0, vr: rnd(-2, 2), c: colors[(Math.random() * colors.length) | 0], e: items[(Math.random() * items.length) | 0] };
      if (kind === "sparks") Object.assign(p, { y: fresh ? rnd(0, H) : H + 10, vx: rnd(-.3, .3), vy: rnd(-1.4, -.4), s: rnd(1, 2.8), life: rnd(.4, 1) });
      else if (kind === "confetti") Object.assign(p, { vx: rnd(-.6, .6), vy: rnd(1, 2.4), s: rnd(5, 9), r: rnd(0, 6) });
      else if (kind === "snow") Object.assign(p, { vx: rnd(-.4, .4), vy: rnd(.4, 1.2), s: rnd(1.5, 3.5) });
      else if (kind === "rain") Object.assign(p, { vx: -1, vy: rnd(6, 10), s: rnd(10, 18) });
      else if (kind === "powder") Object.assign(p, { y: rnd(0, H), vx: rnd(-.25, .25), vy: rnd(-.2, .2), s: rnd(40, 90) });
      else Object.assign(p, { vx: rnd(-.3, .3), vy: rnd(.5, 1.3), s: rnd(14, 24), r: rnd(0, 6) });
      return p;
    };
    const ps = Array.from({ length: N }, () => make(true));
    const tick = () => {
      if (!alive) return;
      ctx.clearRect(0, 0, W, H);
      for (let i = 0; i < ps.length; i++) {
        const p = ps[i];
        p.x += p.vx; p.y += p.vy; p.r += (p.vr || 0) * .02;
        if (kind === "sparks") {
          p.life -= .004;
          ctx.globalAlpha = Math.max(0, p.life);
          const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.s * 4);
          g.addColorStop(0, p.c); g.addColorStop(1, "transparent");
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, p.s * 4, 0, 7); ctx.fill();
          if (p.life <= 0 || p.y < -10) ps[i] = make(false);
        } else if (kind === "confetti") {
          ctx.globalAlpha = .9; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c; ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); ctx.restore();
        } else if (kind === "snow") {
          ctx.globalAlpha = .85; ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(p.x, p.y, p.s, 0, 7); ctx.fill();
        } else if (kind === "rain") {
          ctx.globalAlpha = .35; ctx.strokeStyle = "#bfdbfe"; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + p.vx * 2, p.y + p.s); ctx.stroke();
        } else if (kind === "powder") {
          ctx.globalAlpha = .22; const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.s); g.addColorStop(0, p.c); g.addColorStop(1, "transparent");
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, p.s, 0, 7); ctx.fill();
          if (p.x < -p.s) p.x = W + p.s; if (p.x > W + p.s) p.x = -p.s; if (p.y < -p.s) p.y = H + p.s; if (p.y > H + p.s) p.y = -p.s;
          continue;
        } else {
          ctx.globalAlpha = .9; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(Math.sin(p.r) * .5); ctx.font = `${p.s}px serif`; ctx.textAlign = "center"; ctx.fillText(p.e, 0, 0); ctx.restore();
        }
        if (p.y > H + 30) ps[i] = make(false);
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(tick);
    };
    if (!matchMedia("(prefers-reduced-motion: reduce)").matches) tick();
    addEventListener("resize", resize);
    return () => { alive = false; cancelAnimationFrame(raf); removeEventListener("resize", resize); };
  }

  function startTimer(root) {
    const el = root.querySelector(".offer__timer"); if (!el) return () => {};
    const end = +el.dataset.ends, b = el.querySelector("b");
    const f = () => {
      const s = Math.max(0, Math.floor((end - Date.now()) / 1000));
      const d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60), x = s % 60;
      b.textContent = (d ? d + "d " : "") + String(h).padStart(2, "0") + "h " + String(m).padStart(2, "0") + "m " + String(x).padStart(2, "0") + "s";
    };
    f(); const iv = setInterval(f, 1000); return () => clearInterval(iv);
  }

  async function copy(text, btn) {
    try { await navigator.clipboard.writeText(text); }
    catch (e) { const ta = document.createElement("textarea"); ta.value = text; ta.style.cssText = "position:fixed;opacity:0"; document.body.append(ta); ta.select(); try { document.execCommand("copy"); } catch (e2) {} ta.remove(); }
    if (btn) { btn.textContent = "Copied ✓"; btn.classList.add("is-done"); setTimeout(() => { btn.textContent = "Copy"; btn.classList.remove("is-done"); }, 1800); }
  }

  /* site popup */
  function open(c, { onClaim, onClose } = {}) {
    const t = themeFor(c.name, c.theme, c);
    const wrap = document.createElement("div");
    wrap.className = "offer"; wrap.setAttribute("role", "dialog"); wrap.setAttribute("aria-modal", "true"); wrap.setAttribute("data-lenis-prevent", "");
    wrap.innerHTML = `<div class="offer__backdrop" data-offer-close></div>${cardHTML(c, t)}`;
    document.body.append(wrap);
    requestAnimationFrame(() => wrap.classList.add("is-open")); setTimeout(() => wrap.classList.add("is-open"), 40);
    const stopFx = startFx(wrap.querySelector(".offer__fx"), t), stopT = startTimer(wrap);
    const close = (claimed) => { wrap.classList.remove("is-open"); stopT(); setTimeout(() => { stopFx(); wrap.remove(); }, 450); if (!claimed) onClose?.(); };
    wrap.addEventListener("click", e => {
      if (e.target.closest("[data-offer-copy]")) copy(c.code, e.target.closest("[data-offer-copy]"));
      else if (e.target.closest("[data-offer-claim]")) { if (c.code) copy(c.code); close(true); onClaim?.(c); }
      else if (e.target.closest("[data-offer-close]")) close(false);
    });
    const esc_ = e => { if (e.key === "Escape") { close(false); removeEventListener("keydown", esc_); } };
    addEventListener("keydown", esc_);
    return { close, theme: t };
  }

  /* admin mini preview */
  function preview(el, c) {
    el._stop?.();
    const t = themeFor(c.name, c.theme, c);
    el.innerHTML = `<div class="offer offer--inline is-open">${cardHTML(c, t, { preview: true })}</div>`;
    const s1 = startFx(el.querySelector(".offer__fx"), t), s2 = startTimer(el);
    el._stop = () => { s1(); s2(); };
    return t;
  }

  window.OfferKit = { THEMES, themeFor, offText, isValid, open, preview, copy, hashCode, hintOf, norm };
})();
