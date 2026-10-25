/* ReelEstate Studio — site script. All content comes from data/site.json (edited via admin.html). */
(async () => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const rupee = n => "₹" + Number(n || 0).toLocaleString("en-IN");
  const hasGSAP = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const canHover = matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (!hasGSAP || reduce) document.documentElement.classList.add("no-anim");

  /* ---------- Load content ---------- */
  let D;
  const isPreview = new URLSearchParams(location.search).has("preview");
  try {
    if (isPreview) D = JSON.parse(localStorage.getItem("site-draft") || "null");
  } catch (e) { D = null; }
  if (!D) {
    try {
      const r = await fetch("data/site.json?v=" + Date.now(), { cache: "no-store" });
      D = await r.json();
    } catch (e) {
      document.body.insertAdjacentHTML("afterbegin", `<p style="position:fixed;z-index:999;top:0;left:0;right:0;padding:12px;background:#b91c1c;color:#fff;text-align:center">Content load nahi hua (data/site.json). Website ko server par kholiye — seedha file double-click se nahi.</p>`);
      $("#loader")?.remove();
      return;
    }
  }
  const G = D.general || {}, T = D.texts || {};
  const t = k => T[k] ?? "";
  const media = p => p || "";

  if (isPreview) document.body.insertAdjacentHTML("afterbegin", `<div class="preview-bar">PREVIEW — ye abhi live nahi hai. Admin panel mein “Save & Publish” dabane par live hoga.</div>`);

  /* ---------- Texts, brand, SEO ---------- */
  $$("[data-k]").forEach(el => { const v = T[el.dataset.k]; if (v != null && v !== "") el.textContent = v; });
  $$("[data-brand]").forEach(el => el.textContent = G.brand || "");
  $$("[data-brandname]").forEach(el => el.innerHTML = `<b>${esc(G.brandA)}</b>${esc(G.brandB)}${G.brandSmall ? `<small>${esc(G.brandSmall)}</small>` : ""}`);
  if (G.logo) $$("[data-logo]").forEach(el => el.src = G.logo);
  if (D.seo?.title) document.title = D.seo.title;
  if (D.seo?.description) $('meta[name="description"]')?.setAttribute("content", D.seo.description);
  $("#waFloat").dataset.wa = t("wa.default") || "Hi!";

  /* ---------- WhatsApp ---------- */
  const waNum = String(G.whatsapp || "").replace(/\D/g, "");
  const numberOk = /^\d{10,15}$/.test(waNum);
  function openWA(text) {
    if (!numberOk) toast("Demo mode: Admin panel → General mein apna WhatsApp number daalein.");
    window.open(`https://wa.me/${numberOk ? waNum : ""}?text=${encodeURIComponent(text)}`, "_blank", "noopener");
  }
  document.addEventListener("click", e => {
    const a = e.target.closest("[data-wa]");
    if (!a) return;
    e.preventDefault();
    const extra = a.hasAttribute("data-coupon") && claimed ? `\n🎟️ Coupon: ${claimed.code} (${OK.offText(claimed)})` : "";
    openWA((a.dataset.wa || "Hi!") + extra);
  });
  let toastT;
  function toast(msg) {
    const el = $("#toast");
    el.textContent = msg; el.classList.add("is-on");
    clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove("is-on"), 3400);
  }

  $("#year").textContent = new Date().getFullYear();
  $("#cPhone").textContent = G.phoneDisplay || "";
  $("#cEmail").textContent = G.email || "";
  $("#cEmail").href = $("#fEmail").href = "mailto:" + (G.email || "");
  $("#cCity").textContent = G.city || "";
  $("#fInsta").href = G.instagram || "#";

  /* ---------- Lazy, in-view video playback ---------- */
  const ensureSrc = v => { if (v.dataset.src && !v.getAttribute("src")) v.src = v.dataset.src; };
  const playSafe = v => { ensureSrc(v); const p = v.play(); if (p) p.catch(() => {}); };
  // only fade the video in once real frames are playing (no black flash on slow phones)
  const showWhenPlaying = (v, card) => {
    if (!card) return;
    if (!v.paused && v.readyState > 2) return card.classList.add("is-playing");
    v.addEventListener("playing", () => { if (!v.paused) card.classList.add("is-playing"); }, { once: true });
  };
  const autoIO = new IntersectionObserver(es => es.forEach(e => {
    const v = e.target, card = v.closest(".scard,.wk");
    if (e.isIntersecting) { playSafe(v); showWhenPlaying(v, card); }
    else { v.pause(); card?.classList.remove("is-playing"); }
  }), { threshold: 0.6 });
  function hoverVideo(card) {
    const v = $("video", card); if (!v) return;
    if (canHover) {
      card.addEventListener("mouseenter", () => { playSafe(v); showWhenPlaying(v, card); });
      card.addEventListener("mouseleave", () => { v.pause(); card.classList.remove("is-playing"); });
    } else autoIO.observe(v);
  }
  const playIcon = `<svg viewBox="0 0 24 24"><path d="M6 4v16l14-8z" fill="#fff"/></svg>`;

  /* ---------- Hero ---------- */
  const words = t("hero.rotator").split(",").map(s => s.trim()).filter(Boolean);
  if (words.length) $("#rotator").innerHTML = words.map((w, i) => `<span class="${i ? "" : "is-on"}">${esc(w)}</span>`).join("");
  const sides = ["phone--l", "phone--c", "phone--r"], depth = [0.6, 1, 0.4];
  const hp = (D.heroPhones || []).slice(0, 3);
  const order = hp.length === 1 ? [1] : hp.length === 2 ? [0, 1] : [0, 1, 2];
  $("#heroPhones").insertAdjacentHTML("afterbegin", hp.map((p, i) => `
    <div class="phone-pos ${sides[order[i]]}"><div class="phone" data-depth="${depth[order[i]]}">
      <video muted loop playsinline preload="none" poster="${esc(media(p.poster))}" data-src="${esc(media(p.video))}"></video>
      ${p.tag ? `<span class="phone__tag">${esc(p.tag)}</span>` : ""}</div></div>`).join(""));
  $$("#heroPhones video").forEach(v => autoIO.observe(v));

  /* ---------- Brands marquee ---------- */
  const initials = n => String(n).split(/\s+/).filter(w => /[A-Za-z0-9]/.test(w[0] || "")).slice(0, 2).map(w => w[0]).join("").toUpperCase();
  const brands = D.brands || [];
  const chip = b => `<div class="bchip">${b.logo ? `<img src="${esc(media(b.logo))}" alt="${esc(b.name)} logo" loading="lazy">` : `<span class="bchip__mono">${esc(initials(b.name))}</span>`}<div><b>${esc(b.name)}</b><small>${esc(b.sub)}</small></div></div>`;
  if (brands.length) {
    let list = brands; while (list.length < 8) list = list.concat(brands);
    const half = list.map(chip).join("");
    $("#marqueeTrack").innerHTML = half + half;
    $("#marqueeTrack").style.animationDuration = Math.max(20, list.length * 5) + "s";
  } else $("#brands").hidden = true;

  /* ---------- Stats ---------- */
  $("#stats").innerHTML = (D.stats || []).map(s => `<div class="stat reveal"><b><span data-count="${Number(s.value) || 0}">0</span><em>${esc(s.suffix)}</em></b><span>${esc(s.label)}</span></div>`).join("");
  if (!(D.stats || []).length) $("#stats").hidden = true;

  /* ---------- Services ---------- */
  const services = D.services || [];
  const svcById = Object.fromEntries(services.map(s => [s.id, s]));
  $("#stylesGrid").innerHTML = services.map(s => `
    <article class="scard reveal" data-id="${esc(s.id)}">
      <div class="scard__media" data-lightbox="${esc(media(s.video))}" data-poster="${esc(media(s.poster))}" data-title="${esc(s.name)}" data-sub="Sample — ${esc(s.name)}" data-style="${esc(s.id)}">
        <img src="${esc(media(s.poster))}" alt="${esc(s.name)} sample" loading="lazy">
        <video muted loop playsinline preload="none" data-src="${esc(media(s.preview || s.video))}"></video>
        ${s.tag ? `<span class="scard__tag">${esc(s.tag)}</span>` : ""}
        <span class="scard__play" aria-hidden="true">${playIcon}</span>
        <div class="scard__price"><b>${rupee(s.price)}</b><small>${esc(s.unit)}</small></div>
      </div>
      <div class="scard__body">
        <h3>${esc(s.name)}</h3>
        <p>${esc(s.desc)}</p>
        <ul class="scard__feat">${(s.features || []).map(f => `<li>${esc(f)}</li>`).join("")}</ul>
        <div class="scard__meta"><span>Delivery</span><b>${esc(s.delivery)}</b></div>
        <button class="btn btn--gold btn--sm" data-order="${esc(s.id)}">${esc(t("styles.btn") || "Select this style")}</button>
      </div>
    </article>`).join("");
  $$(".scard").forEach(hoverVideo);
  const addons = D.addons || [];
  $("#addonsList").innerHTML = addons.map(a => `<li><span>${esc(a.name)}</span><b>+ ${rupee(a.price)}</b></li>`).join("");
  if (!addons.length) $(".addons").hidden = true;

  /* ---------- Offers & coupons ---------- */
  const OK = window.OfferKit;
  const coupons = (D.coupons || []).map(c => ({ ...c, code: c.code ? String(c.code).trim().toUpperCase() : "" }));
  const couponState = code => {
    if (!OK) return { err: "Coupon abhi check nahi ho pa raha" };
    code = OK.norm(code);
    const h = code && OK.hashCode(code);
    const c = h && coupons.find(x => x.hash === h);
    if (!c) return { err: "Ye coupon code sahi nahi hai" };
    if (!OK.isValid(c)) return { err: c.active ? "Ye code expire ho gaya hai" : "Ye code ab active nahi hai" };
    return { c: { ...c, code } };
  };
  const discount = (amt, c) => !c ? 0 : c.type === "flat" ? Math.min(amt, Number(c.value) || 0) : Math.round(amt * (Number(c.value) || 0) / 100);
  let claimed = null;
  try {
    const k = localStorage.getItem("offer-claimed");
    if (k) { const c = coupons.find(x => x.hash === k); claimed = c && OK?.isValid(c) && c.code ? c : null; if (!claimed) localStorage.removeItem("offer-claimed"); }
  } catch (e) {}
  function applyTheme(c) {
    const th = OK.themeFor(c.name, c.theme, c), r = document.documentElement.style;
    r.setProperty("--o-bg1", th.bg[0]); r.setProperty("--o-bg2", th.bg[1]); r.setProperty("--o-glow", th.glow);
    r.setProperty("--o-ac", th.accent); r.setProperty("--o-ac2", th.accent2);
    return th;
  }
  function paintPrices() {
    $$(".scard").forEach(card => {
      const s = svcById[card.dataset.id], box = $(".scard__price", card);
      $(".scard__ribbon", card)?.remove();
      card.classList.toggle("has-offer", !!claimed);
      if (claimed) {
        box.innerHTML = `<b>${rupee(s.price - discount(s.price, claimed))}</b><s>${rupee(s.price)}</s><small>${esc(s.unit)} · ${esc(OK.offText(claimed))}</small>`;
        $(".scard__media", card).insertAdjacentHTML("beforeend", `<span class="scard__ribbon">${esc(claimed.name || "Offer")}</span>`);
      } else box.innerHTML = `<b>${rupee(s.price)}</b><small>${esc(s.unit)}</small>`;
    });
    $("#cStyle").innerHTML = `<option value="">Not sure yet — suggest me</option>` + services.map(s => `<option value="${esc(s.id)}">${esc(s.name)} — ${rupee(s.price - discount(s.price, claimed))}${claimed ? " (offer)" : ""}</option>`).join("");
    const cc = $("#cCoupon");
    if (cc && claimed) { cc.value = claimed.code; cc.disabled = true; }
  }
  function showTab(c, isClaimed) {
    $(".offer-tab")?.remove();
    const th = OK.themeFor(c.name, c.theme, c);
    const b = document.createElement("button");
    b.type = "button"; b.className = "offer-tab" + (isClaimed ? " is-claimed" : "");
    b.innerHTML = isClaimed
      ? `<em>${esc(th.emojis[0])}</em><span>${esc(OK.offText(c))} applied<small>${esc(c.code)} · edit style chuno</small></span>`
      : `<em>🎁</em><span>${esc(OK.offText(c))}<small>${esc(c.name || "Offer")} · claim karo</small></span>`;
    b.addEventListener("click", () => isClaimed ? goStyles() : openPopup());
    document.body.append(b);
  }
  const goStyles = () => { const tg = $("#styles"); lenis ? lenis.scrollTo(tg, { offset: -70, duration: 1.2 }) : scrollTo({ top: tg.getBoundingClientRect().top + scrollY - 70, behavior: "smooth" }); };
  function claim(c) {
    claimed = c;
    try { localStorage.setItem("offer-claimed", c.hash); } catch (e) {}
    applyTheme(c); paintPrices(); showTab(c, true);
    toast(`🎉 ${OK.offText(c)} unlock ho gaya! Ab apna edit style chuno.`);
    setTimeout(goStyles, 450);
  }
  const popupCoupon = OK ? coupons.find(c => c.popup && c.code && OK.isValid(c)) : null;
  function openPopup() {
    if (!popupCoupon || claimed || $(".offer.is-open")) return;
    $(".offer-tab")?.remove();
    OK.open(popupCoupon, { onClaim: claim, onClose: () => { try { sessionStorage.setItem("offer-seen", "1"); } catch (e) {} showTab(popupCoupon, false); } });
  }
  if (claimed) { applyTheme(claimed); showTab(claimed, true); }
  else if (popupCoupon) {
    applyTheme(popupCoupon);
    let seen = false; try { seen = sessionStorage.getItem("offer-seen") === "1"; } catch (e) {}
    if (seen && !isPreview) showTab(popupCoupon, false);
    else setTimeout(() => { if ($(".modal.is-open")) showTab(popupCoupon, false); else openPopup(); }, isPreview ? 1600 : 3200);
  }
  paintPrices();

  /* ---------- Packages ---------- */
  $("#packagesGrid").innerHTML = (D.packages || []).map(p => `
    <article class="pk reveal ${p.featured ? "pk--feat" : ""}">
      ${p.featured ? `<span class="pk__badge">Best value</span>` : ""}
      <h3>${esc(p.name)}</h3><p class="pk__reels">${esc(p.reels)}</p>
      <div class="pk__price">${rupee(p.price)} <small>${esc(p.per)}</small></div>
      <ul>${(p.items || []).map(i => `<li>${esc(i)}</li>`).join("")}</ul>
      <button class="btn ${p.featured ? "btn--gold" : "btn--ghost"}" data-wa="${esc(`Hi! Mujhe *${p.name}* monthly package (${p.reels}, ${rupee(p.price)} ${p.per}) ke baare mein baat karni hai.`)}" data-coupon>Get ${esc(p.name)}</button>
    </article>`).join("");
  if (!(D.packages || []).length) $("#packages").hidden = true;

  /* ---------- Portfolio ---------- */
  const portfolio = D.portfolio || [];
  const cats = ["All", ...new Set(portfolio.map(p => p.cat).filter(Boolean))];
  $("#filters").innerHTML = cats.length > 2 ? cats.map((c, i) => `<button class="fchip ${i ? "" : "is-active"}" data-cat="${esc(c)}" role="tab">${esc(c)}</button>`).join("") : "";
  $("#workGrid").innerHTML = portfolio.map(p => `
    <article class="wk reveal" data-cat="${esc(p.cat)}" data-lightbox="${esc(media(p.video))}" data-poster="${esc(media(p.poster))}" data-title="${esc(p.title)}" data-sub="${esc(p.sub)}" data-style="${esc(svcById[p.style] ? p.style : "")}" tabindex="0" role="button" aria-label="Play ${esc(p.title)}">
      <img src="${esc(media(p.poster))}" alt="${esc(p.title)} — ${esc(p.sub)}" loading="lazy">
      <video muted loop playsinline preload="none" data-src="${esc(media(p.preview || p.video))}"></video>
      <span class="wk__play">${playIcon}</span>
      <div class="wk__meta"><small>${esc(p.cat)}</small><h3>${esc(p.title)}</h3><p>${esc(p.sub)}</p></div>
    </article>`).join("");
  $("#workGrid").classList.add("is-all");
  $$(".wk").forEach(hoverVideo);
  $("#filters").addEventListener("click", e => {
    const b = e.target.closest(".fchip"); if (!b) return;
    $$(".fchip").forEach(x => x.classList.toggle("is-active", x === b));
    const c = b.dataset.cat;
    $("#workGrid").classList.toggle("is-all", c === "All");
    $$(".wk").forEach(w => {
      const show = c === "All" || w.dataset.cat === c;
      if (hasGSAP && !reduce && show && w.classList.contains("is-hidden")) gsap.fromTo(w, { opacity: 0, scale: .92 }, { opacity: 1, scale: 1, duration: .6, ease: "expo.out", clearProps: "scale" });
      w.classList.toggle("is-hidden", !show);
      if (!show) { $("video", w)?.pause(); w.classList.remove("is-playing"); }
    });
    if (hasGSAP) ScrollTrigger.refresh();
  });
  if (!portfolio.length) $("#work").hidden = true;

  /* ---------- Process / why ---------- */
  $("#processSteps").innerHTML = (D.process || []).map((s, i) => `<li class="step reveal"><span class="step__n">${i + 1}</span><h3>${esc(s.title)}</h3><p>${esc(s.text)}</p></li>`).join("");
  $("#whyCards").innerHTML = (D.whyCards || []).map(c => `<article class="wcard reveal"><div class="wcard__ic">${esc(c.icon)}</div><h3>${esc(c.title)}</h3><p>${esc(c.text)}</p></article>`).join("");

  /* ---------- FAQ ---------- */
  $("#faqList").innerHTML = (D.faqs || []).map((f, i) => `
    <div class="fq reveal ${i ? "" : "is-open"}"><button aria-expanded="${!i}"><span>${esc(f.q)}</span><span class="fq__ic"></span></button><div class="fq__a"><div><p>${esc(f.a)}</p></div></div></div>`).join("");
  $("#faqList").addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return;
    const it = b.parentElement, open = !it.classList.contains("is-open");
    $$(".fq").forEach(x => { x.classList.remove("is-open"); $("button", x).setAttribute("aria-expanded", "false"); });
    if (open) { it.classList.add("is-open"); b.setAttribute("aria-expanded", "true"); }
    setTimeout(() => hasGSAP && ScrollTrigger.refresh(), 500);
  });
  if (!(D.faqs || []).length) $("#faq").hidden = true;

  /* ---------- Testimonials ---------- */
  const tm = (D.testimonials || []).filter(x => x.text);
  if (tm.length) {
    $("#testimonials").hidden = false;
    $("#tGrid").innerHTML = tm.map(x => `<figure class="tcard reveal"><div class="tcard__stars">★★★★★</div><p>“${esc(x.text)}”</p><b>${esc(x.name)}</b><small>${esc(x.role)}</small></figure>`).join("");
  }

  /* ---------- Contact form ---------- */
  $("#contactForm").addEventListener("submit", e => {
    e.preventDefault();
    const f = e.target, name = f.name.value.trim();
    if (!name) { f.name.classList.add("is-err"); f.name.focus(); toast("Apna naam likh dijiye 🙏"); return; }
    const s = svcById[f.style.value];
    let cp = claimed;
    if (!cp && f.coupon.value.trim()) { const r = couponState(f.coupon.value); if (r.err) { f.coupon.classList.add("is-err"); toast(r.err); return; } cp = r.c; }
    const lines = [
      `👤 Name: ${name}`,
      f.project.value.trim() && `🏢 Project: ${f.project.value.trim()}`,
      `🎬 Style: ${s ? `${s.name} (${rupee(s.price)} ${s.unit})` : "Suggest karo"}`,
      f.msg.value.trim() && `📝 ${f.msg.value.trim()}`,
      cp && `🎟️ Coupon: ${cp.code} (${OK.offText(cp)})${cp === claimed ? " — offer claim kiya" : ""}`
    ].filter(Boolean);
    openWA(`*New enquiry — ${G.brand} website*\n\n` + lines.join("\n"));
  });
  $$(".cform input").forEach(i => i.addEventListener("input", () => i.classList.remove("is-err")));

  /* ---------- Modals ---------- */
  let lenis = null, lastFocus = null;
  function openModal(m) {
    lastFocus = document.activeElement;
    m.classList.add("is-open"); m.setAttribute("aria-hidden", "false");
    document.documentElement.classList.add("modal-open"); lenis?.stop();
    if (canHover) setTimeout(() => $("input,button.modal__x", m)?.focus({ preventScroll: true }), 60);
  }
  function closeModal(m) {
    if (!m.classList.contains("is-open")) return;
    m.classList.remove("is-open"); m.setAttribute("aria-hidden", "true");
    if (!$(".modal.is-open")) { document.documentElement.classList.remove("modal-open"); lenis?.start(); }
    $$("video", m).forEach(v => v.pause());
    if (canHover) lastFocus?.focus?.({ preventScroll: true });
  }
  $$(".modal").forEach(m => m.addEventListener("click", e => { if (e.target.closest("[data-close]")) closeModal(m); }));
  addEventListener("keydown", e => { if (e.key === "Escape") $$(".modal.is-open").forEach(closeModal); });

  /* order modal */
  const om = $("#orderModal"), of = $("#orderForm");
  let current = null;
  $("#omAddons").insertAdjacentHTML("beforeend", addons.map((a, i) => `<label><input type="checkbox" name="addon" value="${i}"> <span>${esc(a.name)}</span> <em>+${rupee(a.price)}</em></label>`).join(""));
  if (!addons.length) $("#omAddons").hidden = true;
  const QTY = { "1": 1, "2": 2, "3–5": 3, "6–10": 6, "10+": 10 };
  const expressAddon = addons.find(a => /express/i.test(a.name));
  let manual = null;
  const codeIn = $("#omCode"), codeMsg = $("#omCouponMsg");
  const setMsg = (t, ok) => { codeMsg.textContent = t; codeMsg.className = "coupon__msg " + (t ? (ok ? "ok" : "err") : ""); };
  function tryApply() {
    const r = couponState(codeIn.value);
    if (r.err) { manual = null; setMsg("✗ " + r.err, false); }
    else { manual = r.c; codeIn.value = r.c.code; setMsg(`✓ ${OK.offText(r.c)} laga diya (${r.c.name || "coupon"})`, true); }
    calcTotal();
    return !r.err;
  }
  $("#omApply").addEventListener("click", tryApply);
  codeIn.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); tryApply(); } });
  codeIn.addEventListener("input", () => { if (manual && codeIn.value.trim().toUpperCase() !== manual.code) { manual = null; setMsg(""); calcTotal(); } });
  function calcTotal() {
    if (!current) return { txt: "" };
    const checked = $$("input[name=addon]:checked", of).map(c => addons[c.value]);
    const add = checked.reduce((s, a) => s + Number(a.price || 0), 0);
    const exp = of.deadline.value.startsWith("Express") && expressAddon && !checked.includes(expressAddon) ? Number(expressAddon.price) : 0;
    const q = QTY[of.qty.value] || 1;
    const gross = (Number(current.price) + add + exp) * q, cp = claimed || manual, off = discount(gross, cp), net = gross - off;
    const pre = /[–+]/.test(of.qty.value) ? "from " : "";
    $("#omTotal").innerHTML = pre + rupee(net) + (off ? ` <s class="om__strike">${rupee(gross)}</s>` : "");
    $("#omSave").hidden = !off;
    if (off) $("#omSave").textContent = `🎉 Aapki bachat ${rupee(off)} — ${cp.code}`;
    return { txt: off ? `~${pre}${rupee(gross)}~ → *${pre}${rupee(net)}*` : pre + rupee(net), cp };
  }
  of.addEventListener("change", calcTotal);
  function openOrder(id) {
    current = svcById[id]; if (!current) return;
    $("#omTitle").textContent = current.name;
    $("#omPrice").innerHTML = claimed
      ? `${rupee(current.price - discount(current.price, claimed))} <s class="om__strike">${rupee(current.price)}</s> ${esc(current.unit)} · ${esc(current.delivery)} delivery`
      : `${rupee(current.price)} ${esc(current.unit)} · ${esc(current.delivery)} delivery`;
    const v = $("#omVid"); v.poster = media(current.poster); v.src = media(current.preview || current.video); playSafe(v);
    of.reset(); $$(".is-err", of).forEach(x => x.classList.remove("is-err"));
    manual = null;
    $("#omCoupon").classList.toggle("is-locked", !!claimed);
    codeIn.disabled = !!claimed; $("#omApply").hidden = !!claimed;
    if (claimed) { codeIn.value = claimed.code; setMsg(`🎉 ${claimed.name || "Offer"} claim kiya hua hai — ${OK.offText(claimed)} already laga hai`, true); }
    else { codeIn.value = ""; setMsg(""); }
    calcTotal(); openModal(om);
    $(".modal__panel", om).scrollTop = 0;
  }
  document.addEventListener("click", e => {
    const b = e.target.closest("[data-order]"); if (!b) return;
    e.preventDefault(); e.stopPropagation(); openOrder(b.dataset.order);
  });
  of.addEventListener("submit", e => {
    e.preventDefault();
    const name = of.name.value.trim();
    if (!name) { of.name.classList.add("is-err"); of.name.focus(); toast("Apna naam likh dijiye 🙏"); return; }
    if (!claimed && codeIn.value.trim() && (!manual || manual.code !== codeIn.value.trim().toUpperCase()) && !tryApply()) { codeIn.focus(); toast("Coupon code check karo"); return; }
    const tot = calcTotal();
    const adds = $$("input[name=addon]:checked", of).map(c => addons[c.value].name);
    const v = k => of[k].value.trim();
    const lines = [
      `🎬 *Style: ${current.name}* (${rupee(current.price)} ${current.unit})`,
      `👤 Name: ${name}`,
      v("project") && `🏢 Project: ${v("project")}`,
      v("city") && `📍 City: ${v("city")}`,
      `🔢 Reels: ${v("qty")}`,
      `📁 Footage: ${v("footage")}`,
      `⏱️ Delivery: ${v("deadline")}`,
      adds.length && `➕ Add-ons: ${adds.join(", ")}`,
      v("notes") && `📝 Notes: ${v("notes")}`,
      tot.cp && `🎟️ Coupon: ${tot.cp.code} (${OK.offText(tot.cp)})${tot.cp === claimed ? " — popup se claim kiya" : ""}`
    ].filter(Boolean);
    openWA(`*New order — ${G.brand} website*\n\n` + lines.join("\n") + `\n\n💰 Estimated: ${tot.txt}`);
    closeModal(om);
  });

  /* lightbox */
  const lb = $("#lightbox"), lbv = $("#lbVideo");
  let lbStyle = "";
  document.addEventListener("click", e => {
    const c = e.target.closest("[data-lightbox]"); if (!c || e.target.closest("[data-order]")) return;
    lbv.poster = c.dataset.poster || ""; lbv.src = c.dataset.lightbox;
    $("#lbTitle").textContent = c.dataset.title; $("#lbSub").textContent = c.dataset.sub;
    lbStyle = c.dataset.style; $("#lbOrder").hidden = !lbStyle;
    openModal(lb); lbv.muted = false; const p = lbv.play(); if (p) p.catch(() => {});
  });
  $$(".wk").forEach(w => w.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); w.click(); } }));
  $("#lbOrder").addEventListener("click", () => { closeModal(lb); setTimeout(() => openOrder(lbStyle), 250); });

  /* ---------- Before / After ---------- */
  const BA = D.beforeAfter || [];
  const frame = $("#baFrame"), vA = $("#baAfter"), vB = $("#baBefore"), handle = $("#baHandle");
  let pos = 50, baVisible = false, hintTl = null, hinted = false, baIndex = -1;
  function setPos(p) {
    pos = Math.max(0, Math.min(100, p));
    frame.style.setProperty("--pos", pos + "%");
    handle.setAttribute("aria-valuenow", Math.round(pos));
    $(".ba__label--l").style.opacity = pos < 14 ? 0 : 1;
    $(".ba__label--r").style.opacity = pos > 86 ? 0 : 1;
  }
  const fromX = x => { const r = frame.getBoundingClientRect(); setPos((x - r.left) / r.width * 100); };
  let dragging = false, startX = 0, startY = 0, decided = false;
  frame.addEventListener("pointerdown", e => {
    dragging = true; decided = e.pointerType === "mouse"; startX = e.clientX; startY = e.clientY;
    if (decided) { frame.setPointerCapture(e.pointerId); fromX(e.clientX); }
    hintTl?.kill(); $("#baHint").classList.add("is-gone");
  });
  frame.addEventListener("pointermove", e => {
    if (!dragging) return;
    if (!decided) { // touch: take over only when the gesture is mostly horizontal, so page scroll still works
      const dx = Math.abs(e.clientX - startX), dy = Math.abs(e.clientY - startY);
      if (dx > 6 && dx > dy) { decided = true; frame.setPointerCapture(e.pointerId); } else return;
    }
    fromX(e.clientX);
  });
  frame.addEventListener("pointerup", e => { if (dragging && !decided) fromX(e.clientX); dragging = false; });
  frame.addEventListener("pointercancel", () => dragging = false);
  handle.addEventListener("keydown", e => {
    if (e.key === "ArrowLeft") { setPos(pos - 5); e.preventDefault(); }
    if (e.key === "ArrowRight") { setPos(pos + 5); e.preventDefault(); }
  });
  $("#baTabs").innerHTML = BA.map((b, i) => `
    <button class="ba__tab ${i ? "" : "is-active"}" data-i="${i}" role="tab" aria-selected="${!i}">
      <img src="${esc(media(b.afterPoster || b.beforePoster))}" alt="" loading="lazy"><span><b>${esc(b.label)}</b><small>${esc(b.project)}</small></span>
    </button>`).join("");
  function loadPair(i) {
    if (i === baIndex) return; baIndex = i;
    const b = BA[i];
    $$(".ba__tab").forEach((x, j) => { x.classList.toggle("is-active", i === j); x.setAttribute("aria-selected", i === j); });
    $("#baInfo").innerHTML = `<h3>${esc(b.label)}</h3><p>${esc(b.project)} — what we changed:</p><ul>${(b.changes || []).map(c => `<li>${esc(c)}</li>`).join("")}</ul>`;
    if (hasGSAP && !reduce) gsap.from("#baInfo > *", { y: 20, opacity: 0, stagger: .06, duration: .6, ease: "expo.out" });
    frame.classList.add("is-loading");
    vA.poster = media(b.afterPoster || ""); vB.poster = media(b.beforePoster || "");
    vA.src = media(b.after); vB.src = media(b.before);
    let ready = 0;
    const go = () => { if (++ready < 2) return; frame.classList.remove("is-loading"); vA.currentTime = vB.currentTime = 0; if (baVisible) { playSafe(vA); playSafe(vB); } };
    vA.addEventListener("loadeddata", go, { once: true });
    vB.addEventListener("loadeddata", go, { once: true });
    setTimeout(() => frame.classList.remove("is-loading"), 5000);
  }
  $("#baTabs").addEventListener("click", e => { const x = e.target.closest(".ba__tab"); if (x) loadPair(+x.dataset.i); });
  (function sync() { // keep "before" locked to "after"
    if (baVisible && !vA.paused && vB.readyState > 1 && Math.abs(vA.currentTime - vB.currentTime) > 0.1) vB.currentTime = vA.currentTime;
    if (baVisible && vA.paused !== vB.paused) vA.paused ? vB.pause() : playSafe(vB);
    setTimeout(sync, 300);
  })();
  if (BA.length) {
    new IntersectionObserver(([e]) => {
      baVisible = e.isIntersecting;
      if (baVisible) {
        if (baIndex < 0) loadPair(0);
        playSafe(vA); playSafe(vB);
        if (!hinted && hasGSAP && !reduce) {
          hinted = true;
          const o = { p: 50 };
          hintTl = gsap.timeline({ delay: .5 }).to(o, { p: 22, duration: 1, ease: "power2.inOut", onUpdate: () => setPos(o.p) })
            .to(o, { p: 78, duration: 1.4, ease: "power2.inOut", onUpdate: () => setPos(o.p) })
            .to(o, { p: 50, duration: .9, ease: "power2.inOut", onUpdate: () => setPos(o.p) });
        }
      } else { vA.pause(); vB.pause(); }
    }, { threshold: 0.25 }).observe(frame);
  } else $("#before-after").hidden = true;
  setPos(50);

  /* ---------- Hero word rotator ---------- */
  const rot = $$("#rotator span");
  if (rot.length > 1) {
    let ri = 0;
    setInterval(() => {
      if (document.hidden) return;
      const cur = rot[ri]; ri = (ri + 1) % rot.length; const nxt = rot[ri];
      cur.classList.remove("is-on"); cur.classList.add("is-out");
      nxt.classList.remove("is-out"); nxt.classList.add("is-on");
      setTimeout(() => cur.classList.remove("is-out"), 850);
    }, 2400);
  }

  /* ---------- Nav ---------- */
  const nav = $("#nav"), burger = $("#burger");
  const closeMenu = () => { nav.classList.remove("is-open"); burger.setAttribute("aria-expanded", "false"); };
  burger.addEventListener("click", e => { e.stopPropagation(); const o = nav.classList.toggle("is-open"); burger.setAttribute("aria-expanded", o); });
  document.addEventListener("click", e => { if (nav.classList.contains("is-open") && !e.target.closest("#nav")) closeMenu(); });
  $$("#navLinks a").forEach(a => a.addEventListener("click", closeMenu));
  let lastY = 0;
  function onScroll(y) {
    if (!nav.classList.contains("is-open")) {
      if (y > lastY + 2 && y > 500) nav.classList.add("is-hidden");
      else if (y < lastY - 2 || y < 500) nav.classList.remove("is-hidden");
    }
    lastY = y;
  }
  const links = $$("#navLinks a[href^='#']");
  const secIO = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) links.forEach(l => l.classList.toggle("is-active", l.getAttribute("href") === "#" + e.target.id));
  }), { rootMargin: "-45% 0px -50% 0px" });
  links.forEach(l => { const s = $(l.getAttribute("href")); s && secIO.observe(s); });
  document.addEventListener("click", e => {
    const a = e.target.closest("a[href^='#']");
    if (!a || a.hasAttribute("data-wa")) return;
    const id = a.getAttribute("href"); if (id.length < 2) return;
    const target = $(id); if (!target) return;
    e.preventDefault();
    lenis ? lenis.scrollTo(target, { offset: -80, duration: 1.3 }) : scrollTo({ top: target.getBoundingClientRect().top + scrollY - 80, behavior: "smooth" });
  });

  /* ---------- Count-up ---------- */
  const cIO = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    cIO.unobserve(e.target);
    const el = e.target, end = +el.dataset.count, t0 = performance.now(), d = 1600;
    if (reduce) { el.textContent = end; return; }
    (function tick(now) { const k = Math.min(1, (now - t0) / d); el.textContent = Math.round(end * (1 - Math.pow(1 - k, 4))); if (k < 1) requestAnimationFrame(tick); else el.textContent = end; })(t0);
  }), { threshold: .5 });
  $$("[data-count]").forEach(el => cIO.observe(el));

  /* ---------- Section title word split (before any animation) ---------- */
  $$(".split-words").forEach(el => { el.innerHTML = el.textContent.trim().split(/\s+/).map(w => `<span class="w"><span>${esc(w)}</span></span>`).join(" "); });

  /* ---------- Loader → intro ---------- */
  let started = false;
  function start() {
    if (started) return; started = true;
    const L = $("#loader"); L?.classList.add("is-done"); setTimeout(() => L?.remove(), 800);
    intro();
  }
  if (document.readyState === "complete") setTimeout(start, 300); else addEventListener("load", () => setTimeout(start, 300));
  setTimeout(start, 1500);

  function intro() {
    if (!hasGSAP || reduce) { addEventListener("scroll", () => onScroll(scrollY), { passive: true }); return; }
    gsap.registerPlugin(ScrollTrigger);
    if (window.Lenis && canHover) { // smooth wheel on desktop only; phones keep native momentum scroll
      lenis = window.__lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
      lenis.on("scroll", ScrollTrigger.update);
      lenis.on("scroll", ({ scroll }) => onScroll(scroll));
      gsap.ticker.add(tm => lenis.raf(tm * 1000));
      gsap.ticker.lagSmoothing(0);
    } else addEventListener("scroll", () => onScroll(scrollY), { passive: true });

    const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
    tl.from(".hero__title .split, .rotator-line .rotator", { yPercent: 110, duration: 1.3, stagger: .1 })
      .fromTo(".hero .reveal", { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 1, stagger: .1 }, "-=1")
      .from(".phone--c .phone", { y: 140, opacity: 0, duration: 1.4 }, "-=1.2")
      .from(".phone--l .phone", { x: 100, y: 60, opacity: 0, duration: 1.4 }, "-=1.2")
      .from(".phone--r .phone", { x: -100, y: 60, opacity: 0, duration: 1.4 }, "-=1.3")
      .from(".float-chip", { scale: .6, opacity: 0, duration: .8, stagger: .12, ease: "back.out(2)" }, "-=.8")
      .from(".nav", { y: -80, opacity: 0, duration: 1 }, 0);

    if (canHover) {
      gsap.to(".hero__phones", { yPercent: 14, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
      const qs = $$(".phone").map(p => ({ x: gsap.quickTo(p, "x", { duration: .8, ease: "power3" }), y: gsap.quickTo(p, "y", { duration: .8, ease: "power3" }), d: +p.dataset.depth }));
      const glow = $(".cursor-glow");
      const gx = gsap.quickTo(glow, "x", { duration: .6, ease: "power3" }), gy = gsap.quickTo(glow, "y", { duration: .6, ease: "power3" });
      addEventListener("pointermove", e => {
        gx(e.clientX); gy(e.clientY);
        const nx = e.clientX / innerWidth - .5, ny = e.clientY / innerHeight - .5;
        qs.forEach(q => { q.x(nx * 40 * q.d); q.y(ny * 30 * q.d); });
      });
      $$("[data-magnetic]").forEach(b => {
        const mx = gsap.quickTo(b, "x", { duration: .5, ease: "power3" }), my = gsap.quickTo(b, "y", { duration: .5, ease: "power3" });
        b.addEventListener("pointermove", e => { const r = b.getBoundingClientRect(); mx((e.clientX - r.left - r.width / 2) * .25); my((e.clientY - r.top - r.height / 2) * .35); });
        b.addEventListener("pointerleave", () => { mx(0); my(0); });
      });
      $$(".scard").forEach(c => {
        c.addEventListener("pointermove", e => { const r = c.getBoundingClientRect(); gsap.to(c, { rotateY: ((e.clientX - r.left) / r.width - .5) * 7, rotateX: -((e.clientY - r.top) / r.height - .5) * 7, transformPerspective: 900, duration: .5 }); });
        c.addEventListener("pointerleave", () => gsap.to(c, { rotateX: 0, rotateY: 0, duration: .7 }));
      });
    }

    $$(".split-words").forEach(el => gsap.from($$(".w > span", el), { yPercent: 110, duration: 1.1, stagger: .05, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 92%", once: true } }));
    $$(".section__sub, .section .kicker").forEach(el => gsap.from(el, { y: 24, opacity: 0, duration: 1, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 94%", once: true } }));

    // card reveals via IntersectionObserver (robust to late layout changes)
    let queue = [], qT = 0;
    const rIO = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return;
      rIO.unobserve(e.target); queue.push(e.target);
      cancelAnimationFrame(qT);
      qT = requestAnimationFrame(() => { gsap.to(queue, { opacity: 1, y: 0, duration: .9, stagger: .07, ease: "expo.out", overwrite: true }); queue = []; });
    }), { rootMargin: "0px 0px -6% 0px" });
    $$(".reveal").forEach(el => { if (!el.closest(".hero")) rIO.observe(el); });

    const steps = $$(".step");
    gsap.to("#processProgress", {
      scaleX: 1, ease: "none",
      scrollTrigger: { trigger: ".process", start: "top 65%", end: "bottom 70%", scrub: .6,
        onUpdate: s => steps.forEach((st, i) => st.classList.toggle("is-lit", s.progress >= i / steps.length + .05)) }
    });
    if (canHover) {
      const track = $("#marqueeTrack");
      ScrollTrigger.create({ onUpdate: s => gsap.to(track, { skewX: gsap.utils.clamp(-6, 6, s.getVelocity() / -300), duration: .4, overwrite: true }) });
    }
    gsap.from(".footer__big", { yPercent: 40, opacity: 0, ease: "none", scrollTrigger: { trigger: ".footer", start: "top bottom", end: "bottom bottom", scrub: true } });
    addEventListener("load", () => ScrollTrigger.refresh());
    setTimeout(() => ScrollTrigger.refresh(), 1500);
  }
})();
