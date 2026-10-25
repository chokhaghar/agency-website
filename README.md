# Agency Website + Admin Panel

## Roz ka kaam — Admin Panel se (coding nahi)
**Apne PC par:** `Start Website.bat` par double-click karo. Browser mein admin panel khul jayega (`http://localhost:5500/admin.html`).
**GitHub par live hone ke baad:** `https://<username>.github.io/<repo>/admin.html` kholo, mobile se bhi chalega (ek baar token daalna hoga, Connection page dekho).

Admin panel mein ye sab badal sakte ho:
| Section | Kya badlega |
|---|---|
| ⚙️ General | Naam, logo, **WhatsApp number**, phone, email, Instagram |
| 💰 Edit Styles & Rates | Har style ka rate, level (1–5), delivery, features, sample video |
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
