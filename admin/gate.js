/* Admin login gate for the online (GitHub) admin.
   The GitHub token that can write the website is stored ONLY encrypted (AES-256-GCM, key = PBKDF2(username+password))
   in admin/vault.json. Without the right username + password nobody can decrypt it, so nobody can change the site. */
(() => {
  const ITER = 310000;
  const enc = new TextEncoder(), dec = new TextDecoder();
  const b64 = buf => btoa(String.fromCharCode(...new Uint8Array(buf)));
  const unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
  const norm = u => String(u || "").trim().toLowerCase();

  async function keyFor(user, pass, salt, iter) {
    const base = await crypto.subtle.importKey("raw", enc.encode(norm(user) + "\u0000" + pass), "PBKDF2", false, ["deriveKey"]);
    return crypto.subtle.deriveKey({ name: "PBKDF2", hash: "SHA-256", salt, iterations: iter }, base, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
  }
  async function seal(user, pass, token) {
    const salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await keyFor(user, pass, salt, ITER);
    const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc.encode(JSON.stringify({ token, user: norm(user), at: new Date().toISOString() })));
    return { v: 1, kdf: "PBKDF2-SHA256", iter: ITER, salt: b64(salt), iv: b64(iv), ct: b64(ct) };
  }
  async function open(vault, user, pass) {
    const key = await keyFor(user, pass, unb64(vault.salt), vault.iter || ITER);
    const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64(vault.iv) }, key, unb64(vault.ct)); // throws on wrong creds
    return JSON.parse(dec.decode(pt));
  }

  const gh = (cfg, token) => async (path, opt = {}) => {
    const headers = { Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28", ...(opt.headers || {}) };
    if (token) headers.Authorization = "Bearer " + token;
    const r = await fetch(`https://api.github.com/repos/${cfg.owner}/${cfg.repo}${path}`, { ...opt, headers });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) { const e = new Error(j.message || "GitHub error " + r.status); e.status = r.status; throw e; }
    return j;
  };
  async function loadVault(cfg) {
    // fresh copy from the repo first (Pages can lag a minute after setup), then the published file
    try {
      const j = await gh(cfg)(`/contents/admin/vault.json?ref=${encodeURIComponent(cfg.branch || "main")}&t=${Date.now()}`);
      return { vault: JSON.parse(dec.decode(unb64(j.content.replace(/\n/g, "")))), sha: j.sha };
    } catch (e) {
      if (e.status === 404) return { vault: null };
      try { const r = await fetch("admin/vault.json?t=" + Date.now(), { cache: "no-store" }); if (r.ok) return { vault: await r.json() }; } catch (e2) {}
      if (e.status === 403) throw new Error("GitHub abhi busy hai (rate limit). 1–2 minute baad dobara try karo.");
      return { vault: null };
    }
  }
  async function saveVault(cfg, token, vault, sha) {
    const content = btoa(unescape(encodeURIComponent(JSON.stringify(vault, null, 2) + "\n")));
    if (!sha) { try { sha = (await gh(cfg, token)(`/contents/admin/vault.json?ref=${encodeURIComponent(cfg.branch || "main")}`)).sha; } catch (e) {} }
    return gh(cfg, token)("/contents/admin/vault.json", { method: "PUT", body: JSON.stringify({ message: "Admin: login updated", content, branch: cfg.branch || "main", ...(sha ? { sha } : {}) }) });
  }
  async function checkToken(cfg, token) {
    const r = await gh(cfg, token)("");
    if (!r.permissions?.push) throw new Error("Is token ko repo mein likhne ki permission nahi hai (Contents: Read and write chahiye)");
    return r;
  }

  /* ---------- session ---------- */
  const SKEY = "admin-session";
  const getSession = () => { try { return JSON.parse(sessionStorage.getItem(SKEY) || localStorage.getItem(SKEY) || "null"); } catch (e) { return null; } };
  const setSession = (s, remember) => { try { sessionStorage.setItem(SKEY, JSON.stringify(s)); if (remember) localStorage.setItem(SKEY, JSON.stringify(s)); else localStorage.removeItem(SKEY); } catch (e) {} };
  const logout = () => { try { sessionStorage.removeItem(SKEY); localStorage.removeItem(SKEY); localStorage.removeItem("gh-admin"); } catch (e) {} location.reload(); };

  /* ---------- UI ---------- */
  const esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  function screen(html) {
    let g = document.getElementById("gate");
    if (!g) { g = document.createElement("div"); g.id = "gate"; g.className = "gate"; document.body.append(g); }
    g.innerHTML = `<div class="gate__card"><img src="assets/img/logo-mark.svg" alt="" class="gate__logo">${html}</div>`;
    return g;
  }
  const busy = (btn, on, txt) => { btn.disabled = on; if (txt) btn.textContent = txt; };

  function loginForm(cfg, vault) {
    return new Promise(resolve => {
      const g = screen(`<h1>Admin Login</h1><p class="gate__sub">Sirf website owner ke liye</p>
        <form id="gForm" autocomplete="on">
          <label>Username<input name="u" autocomplete="username" required autocapitalize="none" spellcheck="false"></label>
          <label>Password<input name="p" type="password" autocomplete="current-password" required></label>
          <label class="gate__check"><input type="checkbox" name="r"> Is device par login yaad rakho</label>
          <button class="b b--gold" type="submit">Login</button>
          <p class="gate__err" id="gErr"></p>
        </form>`);
      const f = g.querySelector("form"), btn = f.querySelector("button"), err = g.querySelector("#gErr");
      setTimeout(() => f.u.focus(), 50);
      let fails = 0;
      f.addEventListener("submit", async e => {
        e.preventDefault(); err.textContent = ""; busy(btn, true, "Checking…");
        try {
          const data = await open(vault, f.u.value, f.p.value);
          const s = { token: data.token, user: data.user };
          setSession(s, f.r.checked); g.remove(); resolve(s);
        } catch (x) {
          fails++;
          await new Promise(r => setTimeout(r, Math.min(4000, 600 * fails)));
          err.textContent = "Username ya password galat hai"; busy(btn, false, "Login"); f.p.select();
        }
      });
    });
  }

  function setupForm(cfg) {
    return new Promise(resolve => {
      const g = screen(`<h1>Admin setup (sirf ek baar)</h1>
        <p class="gate__sub">Apna username aur password chuno. Agli baar se sirf yahi daalna hoga — kisi bhi phone / laptop se.</p>
        <form id="gForm" autocomplete="off">
          <label>Username<input name="u" required autocapitalize="none" spellcheck="false" autocomplete="username" placeholder="jaise: umesh"></label>
          <label>Password <em>(kam se kam 10 characters)</em><input name="p" type="password" required autocomplete="new-password"></label>
          <label>Password dobara<input name="p2" type="password" required autocomplete="new-password"></label>
          <details class="gate__help" open><summary>GitHub token (ek baar chahiye)</summary>
            <ol>
              <li>Kholo: <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener">github.com/settings/personal-access-tokens/new</a></li>
              <li>Name: <b>Website Admin</b> · Expiration: <b>1 year</b></li>
              <li>Repository access: <b>Only select repositories</b> → <b>${esc(cfg.repo)}</b></li>
              <li>Permissions → Repository → <b>Contents: Read and write</b></li>
              <li><b>Generate token</b> → copy karke neeche paste karo</li>
            </ol>
          </details>
          <label>GitHub token<input name="t" type="password" required autocomplete="off" placeholder="github_pat_…"></label>
          <button class="b b--gold" type="submit">Setup complete karo</button>
          <p class="gate__err" id="gErr"></p>
          <p class="gate__note">Token aapke password se encrypt hokar save hoga. Password bhool gaye to naya token bana kar setup dobara ho sakta hai.</p>
        </form>`);
      const f = g.querySelector("form"), btn = f.querySelector("button"), err = g.querySelector("#gErr");
      f.addEventListener("submit", async e => {
        e.preventDefault(); err.textContent = "";
        if (norm(f.u.value).length < 3) return err.textContent = "Username kam se kam 3 characters ka rakho";
        if (f.p.value.length < 10) return err.textContent = "Password kam se kam 10 characters ka rakho";
        if (f.p.value !== f.p2.value) return err.textContent = "Dono password same nahi hain";
        busy(btn, true, "Token check ho raha hai…");
        try {
          const token = f.t.value.trim();
          await checkToken(cfg, token);
          busy(btn, true, "Encrypt karke save ho raha hai…");
          await saveVault(cfg, token, await seal(f.u.value, f.p.value, token));
          const s = { token, user: norm(f.u.value) };
          setSession(s, false); g.remove(); resolve(s);
        } catch (x) {
          err.textContent = "✗ " + (x.status === 401 ? "Token galat ya expire hai" : x.message);
          busy(btn, false, "Setup complete karo");
        }
      });
    });
  }

  async function ensure(cfg) {
    const s = getSession();
    if (s?.token) return s;
    let res;
    screen(`<p class="gate__sub">Loading…</p>`);
    try { res = await loadVault(cfg); }
    catch (e) { screen(`<h1>Admin</h1><p class="gate__err">${esc(e.message)}</p>`); return new Promise(() => {}); }
    return res.vault ? loginForm(cfg, res.vault) : setupForm(cfg);
  }

  async function changeLogin(cfg, token, user, pass) {
    if (norm(user).length < 3 || pass.length < 10) throw new Error("Username 3+ aur password 10+ characters ka rakho");
    await saveVault(cfg, token, await seal(user, pass, token));
    setSession({ token, user: norm(user) }, !!localStorage.getItem(SKEY));
  }

  window.AdminGate = { ensure, logout, changeLogin, getSession, checkToken };
})();
