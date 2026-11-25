import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";
import fs from "node:fs";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9444;
const PROFILE = "C:\\Harness\\.amis-chrome-cdp";
const URL = "http://127.0.0.1:5173/";
const SHOTS = "C:\\Harness\\amis-coop\\shots";

fs.rmSync(PROFILE, { recursive: true, force: true });
fs.mkdirSync(SHOTS, { recursive: true });

const chrome = spawn(CHROME, [
  "--headless=new",
  "--no-sandbox",
  "--disable-gpu",
  "--no-first-run",
  "--disable-crash-reporter",
  "--disable-breakpad",
  "--hide-scrollbars",
  "--window-size=1440,1000",
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${PROFILE}`,
  "about:blank",
], { stdio: "ignore" });

async function waitFor(fn, timeout = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const value = await fn();
      if (value) return value;
    } catch {}
    await sleep(250);
  }
  throw new Error("Timed out waiting");
}

await waitFor(async () => {
  const res = await fetch(`http://127.0.0.1:${PORT}/json/version`);
  return res.ok ? res.json() : null;
});

const created = await fetch(`http://127.0.0.1:${PORT}/json/new?${encodeURIComponent(URL)}`, { method: "PUT" });
const target = await created.json();
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });

let nextId = 1;
const pending = new Map();
const errors = [];
ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    if (msg.error) reject(new Error(JSON.stringify(msg.error)));
    else resolve(msg.result);
  }
  if (msg.method === "Runtime.exceptionThrown") {
    errors.push(msg.params.exceptionDetails.text + " " + (msg.params.exceptionDetails.exception?.description || ""));
  }
  if (msg.method === "Runtime.consoleAPICalled" && msg.params.type === "error") {
    errors.push(msg.params.args.map((a) => a.value ?? a.description).join(" "));
  }
};

function send(method, params = {}) {
  const id = nextId++;
  ws.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
}

async function evaluate(expression) {
  const result = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.text + " " + (result.exceptionDetails.exception?.description || ""));
  }
  return result.result.value;
}

async function shot(name) {
  const { data } = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
  fs.writeFileSync(`${SHOTS}\\${name}.png`, Buffer.from(data, "base64"));
}

await send("Runtime.enable");
await send("Page.enable");
await send("Page.navigate", { url: URL });
await sleep(1400);

const results = {};
results.loginHeading = await evaluate(`document.querySelector(".login-card h2")?.textContent`);
await shot("login");
await evaluate(`document.querySelector(".login-submit").click()`);
await sleep(1400);
results.dashboard = await evaluate(`(() => ({
  heading: document.querySelector("h1")?.textContent,
  stats: [...document.querySelectorAll(".stat-value")].map(e => e.textContent),
  cards: [...document.querySelectorAll(".card-title")].map(e => e.textContent),
  pending: document.querySelectorAll(".approval").length,
  body: document.body.innerText.includes("Cooperative overview")
}))()`);
await shot("dashboard");

results.errors = errors;
console.log(JSON.stringify(results, null, 2));

ws.close();
chrome.kill();
await sleep(400);
process.exit(0);
