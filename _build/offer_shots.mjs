// Mobile screenshots of offer popups (several themes) + claimed state, via headless Chrome CDP.
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";

const base = "http://localhost:5500/";
const out = process.argv[2] || "offer_shots";
mkdirSync(out, { recursive: true });
const site = JSON.parse(readFileSync("../data/site.json", "utf8"));
const port = 9334;
const chrome = spawn("C:/Program Files/Google/Chrome/Application/chrome.exe", [`--remote-debugging-port=${port}`, "--headless=new",
  "--hide-scrollbars", `--user-data-dir=${process.env.TEMP}/cdp-prof2`, "about:blank"], { stdio: "ignore" });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let ws, id = 0; const pend = new Map();
const send = (method, params = {}) => new Promise(res => { const i = ++id; pend.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async e => (await send("Runtime.evaluate", { expression: e, awaitPromise: true, returnByValue: true })).result?.value;
const shot = async n => { const r = await send("Page.captureScreenshot", { format: "jpeg", quality: 82 }); writeFileSync(`${out}/${n}.jpg`, Buffer.from(r.data, "base64")); };

async function main() {
  let t; for (let i = 0; i < 40 && !t; i++) { try { t = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find(x => x.type === "page"); } catch (e) { await sleep(250); } }
  ws = new WebSocket(t.webSocketDebuggerUrl); await new Promise(r => ws.onopen = r);
  ws.onmessage = m => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d.result); pend.delete(d.id); } };
  await send("Page.enable"); await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
  await send("Page.navigate", { url: base }); await sleep(1500);
  const offers = [
    ["diwali", { name: "Diwali Offer", code: "DIWALI20", value: 20, subtext: "Har edit style par 20% OFF — sirf Diwali tak!" }],
    ["navratri", { name: "Navratri Offer", code: "NAVRATRI15", value: 15, subtext: "Garba season special" }],
    ["holi", { name: "Holi Sale", code: "HOLI25", value: 25, subtext: "" }],
    ["custom", { name: "Jaipur Property Mela", code: "MELA500", type: "flat", value: 500, subtext: "Sirf mela ke dino mein" }]
  ];
  for (const [n, o] of offers) {
    const d = structuredClone(site);
    d.coupons = [{ ...site.coupons[0], ...o, popup: true, active: true }];
    await ev(`localStorage.clear();sessionStorage.clear();localStorage.setItem('site-draft',${JSON.stringify(JSON.stringify(d))});location.href='${base}index.html?preview=1'`);
    await sleep(5200); await shot("popup-" + n);
  }
  // claimed state (diwali)
  const d = structuredClone(site);
  await ev(`localStorage.clear();sessionStorage.clear();localStorage.setItem('site-draft',${JSON.stringify(JSON.stringify(d))});location.href='${base}index.html?preview=1'`);
  await sleep(5200);
  await ev(`document.querySelector('[data-offer-claim]').click()`); await sleep(2500);
  await ev(`document.querySelector('#stylesGrid').scrollIntoView();scrollBy(0,-80)`); await sleep(1500); await shot("claimed-cards");
  await ev(`document.querySelector('[data-order="walkthrough-3d"]').click()`); await sleep(900);
  await ev(`document.querySelector('#omCoupon').scrollIntoView({block:'center'})`); await sleep(700); await shot("claimed-order");
  ws.close(); chrome.kill(); console.log("done");
}
main().catch(e => { console.error(e); chrome.kill(); process.exit(1); });
