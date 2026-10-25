// Real-mobile preview: headless Chrome via CDP, iPhone-like emulation, screenshots + overflow test.
// usage: node mobile_shots.mjs <url> <outDir>
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";

const url = process.argv[2] || "http://localhost:5500/";
const out = process.argv[3] || "shots";
mkdirSync(out, { recursive: true });
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const port = 9333;
const chrome = spawn(CHROME, [`--remote-debugging-port=${port}`, "--headless=new", "--autoplay-policy=no-user-gesture-required",
  "--hide-scrollbars", `--user-data-dir=${process.env.TEMP}/cdp-prof`, "about:blank"], { stdio: "ignore" });
const sleep = ms => new Promise(r => setTimeout(r, ms));

let ws, id = 0; const pend = new Map();
const send = (method, params = {}) => new Promise(res => { const i = ++id; pend.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
async function main() {
  let target;
  for (let i = 0; i < 40 && !target; i++) { try { target = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find(t => t.type === "page"); } catch (e) { await sleep(250); } }
  ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);
  ws.onmessage = m => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d.result); pend.delete(d.id); } };
  await send("Page.enable"); await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
  await send("Emulation.setUserAgentOverride", { userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1" });
  await send("Page.navigate", { url });
  await sleep(5500);
  const ev = async expr => (await send("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true })).result.value;
  const shot = async name => { const r = await send("Page.captureScreenshot", { format: "jpeg", quality: 80 }); writeFileSync(`${out}/${name}.jpg`, Buffer.from(r.data, "base64")); };
  const info = await ev(`(()=>{scrollTo(120,0);const sx=scrollX;scrollTo(0,0);return {sx, sw:document.documentElement.scrollWidth, bw:document.body.scrollWidth, cw:document.documentElement.clientWidth, hover:matchMedia('(hover:hover)').matches,
    wide:[...document.querySelectorAll('body *')].filter(e=>{const r=e.getBoundingClientRect();const cs=getComputedStyle(e);return r.width>0&&r.right>innerWidth+2&&cs.position==='fixed'}).map(e=>e.className).slice(0,5)}})()`);
  await shot("01-hero");
  for (const [n, y] of [["02-after-hero", 760], ["03-ba", "#baFrame"], ["04-styles", "#stylesGrid"], ["05-work", "#workGrid"], ["06-faq", "#faq"]]) {
    await ev(typeof y === "number" ? `scrollTo(0,${y})` : `document.querySelector('${y}').scrollIntoView({block:'start'});scrollBy(0,-70)`);
    await sleep(1800); await shot(n);
  }
  writeFileSync(`${out}/info.json`, JSON.stringify(info, null, 2));
  console.log(JSON.stringify(info));
  ws.close(); chrome.kill();
}
main().catch(e => { console.error(e); chrome.kill(); process.exit(1); });
