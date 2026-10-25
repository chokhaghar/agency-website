import { spawn } from "node:child_process";
import { writeFileSync } from "node:fs";
const port = 9335;
const chrome = spawn("C:/Program Files/Google/Chrome/Application/chrome.exe", [`--remote-debugging-port=${port}`, "--headless=new", "--hide-scrollbars", `--user-data-dir=${process.env.TEMP}/cdp-prof3`, "about:blank"], { stdio: "ignore" });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let ws, id = 0; const pend = new Map();
const send = (m, p = {}) => new Promise(res => { const i = ++id; pend.set(i, res); ws.send(JSON.stringify({ id: i, method: m, params: p })); });
let t; for (let i = 0; i < 40 && !t; i++) { try { t = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find(x => x.type === "page"); } catch (e) { await sleep(250); } }
ws = new WebSocket(t.webSocketDebuggerUrl); await new Promise(r => ws.onopen = r);
ws.onmessage = m => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d.result); pend.delete(d.id); } };
await send("Page.enable"); await send("Runtime.enable");
await send("Emulation.setDeviceMetricsOverride", { width: 1280, height: 1500, deviceScaleFactor: 1, mobile: false });
await send("Page.navigate", { url: "http://localhost:5500/admin.html#coupons" }); await sleep(2500);
await send("Runtime.evaluate", { expression: "document.querySelector('.card .card__head').click()" }); await sleep(2500);
const r = await send("Page.captureScreenshot", { format: "jpeg", quality: 82 });
writeFileSync(process.argv[2], Buffer.from(r.data, "base64")); ws.close(); chrome.kill(); console.log("ok");
