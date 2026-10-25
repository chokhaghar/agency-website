# Agency Website + Admin Panel

## Roz ka kaam — Admin Panel se (coding nahi)
**Apne PC par:** `Start Website.bat` par double-click karo. Browser mein admin panel khul jayega (`http://localhost:5500/admin.html`).
**Online (mobile / kisi bhi device se):** `https://chokhaghar.github.io/agency-website/admin.html` → **username + password** se login. Pehli baar wahi page *setup* maangta hai: apna username, password aur ek GitHub token (steps page par likhe hain). Token aapke password se AES-256 encrypt hokar `admin/vault.json` mein save hota hai — bina sahi password koi admin nahi khol sakta, na website badal sakta. Password badalna: Admin → 🔐 Account / Login.

Admin panel mein ye sab badal sakte ho:
| Section | Kya badlega |
|---|---|
| ⚙️ General | Naam, logo, **WhatsApp number**, phone, email, Instagram |
| 🎁 Offers & Coupons | Festive popup (naam se apne aap theme), coupon codes, ON/OFF, last date |
| 💰 Edit Styles & Rates | Har style ka rate, delivery, features, sample video |
| ➕ Add-ons / 📦 Packages | Extra services aur monthly plans ke rates |
| 🎬 Portfolio | Naya kaam add karo (video upload → poster apne aap banta hai) |
| ↔️ Before / After | Raw + edited video pairs |
| 📱 Hero Reels | Sabse upar ke 3 phones ke videos |
| 🏢 Brands | Chalti line ke brands + logos |
| ✏️ Website Texts | Saari headings, lines, buttons |
| 📊 / 🪜 / ⭐ / 💬 / ❓ / 🔍 | Numbers, process, why-us, reviews, FAQ, Google title |

Flow: change karo, **👁 Preview** se dekho, phir **💾 Save & Publish** dabao.

### Video upload se pehle
Bade video (50–200 MB) website slow kar dete hain. Pehle video ko `tools\Video-Chhota-Karo.bat` par **drag-and-drop** karo. Wo `naam_web.mp4` (3–8 MB) bana dega, phir wahi upload karo.

## GitHub par live karna (ek baar)
1. github.com par account banao. **New repository** banao (Public), naam jaise `website`.
2. **GitHub Desktop** install karo, phir File → Add local repository → ye folder chuno → "Publish repository".
3. Repo → **Settings → Pages** → Source: *Deploy from a branch* → Branch `main` / `(root)` → Save.
4. 1–2 minute baad site live ho jayegi: `https://<username>.github.io/website/`
5. Admin online chalane ke liye: Connection page par token banane ke steps likhe hain (2 minute ka kaam).
6. Apna domain lena ho (jaise `.in`): Settings → Pages → Custom domain.

> Local admin se save kiya ho, to GitHub Desktop mein **Commit → Push** karna padega. Online admin se save karoge to seedha live ho jayega.

## Files (sirf jaankari ke liye — chhedne ki zaroorat nahi)
- `data/site.json` — website ka saara content (admin isi ko badalta hai)
- `assets/` — videos, posters, before/after, uploads
- `index.html`, `css/`, `js/` — website ka design
- `admin.html`, `admin/` — admin panel
- `tools/server.py` — local server · `_build/make_media.py` — purane reels se media banane wala script

## Offers & coupons
- Admin → 🎁 Offers & Coupons → “+ Naya add karo”: naam (jaise *Navratri Offer*), code, % ya ₹ discount, last date.
- **Offer ON** hatao ya last date nikal jaye → code website par kaam nahi karega.
- **Popup dikhao** tick → us offer ka popup aayega (list ka pehla ON popup). Popup wala code popup mein sabko dikhta hai.
- Baaki codes **secret** hain: website ki file mein sirf unka hash (fingerprint) save hota hai, asli code kisi ko nahi dikhta. Admin mein bhi sirf hint dikhta hai (jaise SE••••50) — code yaad rakhna ya kahin note kar lena.
