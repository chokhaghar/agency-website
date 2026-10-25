import os
os.chdir('E:/Only For Claude/agency-website')
HEAD='''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{t} — ReelEstate Studio</title><meta name="robots" content="{robots}"><link rel="icon" href="favicon.svg" type="image/svg+xml">
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,800&family=Inter:wght@400;600&display=swap" rel="stylesheet">
<style>:root{{--bg:#060A14;--t:#EEF2FA;--m:#8E99B0;--g:#F5B83D}}body{{margin:0;background:var(--bg);color:var(--t);font:16px/1.7 Inter,system-ui,sans-serif}}
main{{max-width:760px;margin:0 auto;padding:60px 16px 100px}}a{{color:var(--g)}}h1{{font:800 clamp(34px,6vw,54px)/1.05 "Bricolage Grotesque",sans-serif;letter-spacing:-.03em;margin:30px 0 10px}}
h2{{font:800 22px/1.2 "Bricolage Grotesque",sans-serif;margin:34px 0 8px}}p,li{{color:var(--m)}}.back{{display:inline-flex;gap:10px;align-items:center;text-decoration:none;color:var(--t);font-weight:600}}
.back img{{width:36px}}</style></head><body><main><a class="back" href="index.html"><img src="assets/img/logo-mark.svg" alt="">← ReelEstate Studio</a>'''
END='</main></body></html>'
pages={
'privacy.html':('Privacy Policy','index,follow','''<h1>Privacy Policy</h1><p>Last updated: 25 October 2026</p>
<h2>What we collect</h2><p>When you send an enquiry or order, you share your name, project name, city and message with us through WhatsApp. You may also send video footage, logos, phone numbers and voice-overs for editing.</p>
<h2>How we use it</h2><ul><li>Only to discuss, edit and deliver your videos.</li><li>To contact you about your order.</li><li>We never sell or share your details or footage with anyone.</li></ul>
<h2>Your footage</h2><p>Your raw footage and final videos stay yours. We may show finished work in our portfolio only with your permission — ask us anytime to remove it.</p>
<h2>Storage</h2><p>Files are kept for up to 60 days after delivery for revisions, then deleted on request.</p>
<h2>Website</h2><p>This website does not use advertising cookies. Fonts and animation libraries load from Google Fonts and public CDNs.</p>
<h2>Contact</h2><p>For any privacy request, message us on WhatsApp or email us — details are on the <a href="index.html#contact">contact section</a>.</p>'''),
'terms.html':('Terms & Refunds','index,follow','''<h1>Terms &amp; Refund Policy</h1><p>Last updated: 25 October 2026</p>
<h2>Orders & payment</h2><ul><li>Work starts after 50% advance payment.</li><li>You receive a low-quality watermarked preview first.</li><li>The final HD file is shared after the remaining 50% is paid.</li></ul>
<h2>Revisions</h2><p>Each reel includes 2 free revision rounds. Extra rounds cost ₹299 each. A completely new concept after approval is billed as a new reel.</p>
<h2>Delivery</h2><p>Delivery times (24–72 hr) start after we receive all footage, logo, phone number and voice-over. Large orders or festive periods may take longer — we will tell you upfront.</p>
<h2>Refunds</h2><ul><li>If we have not started work, the advance is fully refunded.</li><li>If you are not happy with the first preview and do not want revisions, 50% of the advance is refunded.</li><li>No refunds after the final HD file is delivered.</li></ul>
<h2>Content</h2><p>You confirm that you own or have rights to the footage, music and logos you send. Prices, brochures and claims shown in the video are your responsibility.</p>
<h2>Portfolio use</h2><p>We may show the finished video on our website or social media unless you ask us not to.</p>'''),
'404.html':('Page not found','noindex','''<h1>404 — Scene not found.</h1><p>Ye page edit ho gaya lagta hai 😅. Home par chaliye.</p><p><a href="index.html">← Back to home</a></p>''')}
for f,(t,r,b) in pages.items():
    open(f,'w',encoding='utf-8').write(HEAD.format(t=t,robots=r)+b+END)
