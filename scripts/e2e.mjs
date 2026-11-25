import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";
import fs from "node:fs";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9445;
const PROFILE = "C:\\Harness\\.amis-chrome-e2e";
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

async function waitFor(fn, timeout = 25000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try { const v = await fn(); if (v) return v; } catch {}
    await sleep(250);
  }
  throw new Error("Timed out");
}

await waitFor(async () => (await fetch(`http://127.0.0.1:${PORT}/json/version`)).ok);
const created = await fetch(`http://127.0.0.1:${PORT}/json/new?${encodeURIComponent(URL)}`, { method: "PUT" });
const target = await created.json();
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });

let id = 1;
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
  if (msg.method === "Page.javascriptDialogOpening") {
    send("Page.handleJavaScriptDialog", { accept: true }).catch(() => {});
  }
};

function send(method, params = {}) {
  const n = id++;
  ws.send(JSON.stringify({ id: n, method, params }));
  return new Promise((resolve, reject) => pending.set(n, { resolve, reject }));
}

async function evaluate(expression) {
  const r = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + " " + (r.exceptionDetails.exception?.description || ""));
  return r.result.value;
}

async function shot(name) {
  const { data } = await send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(`${SHOTS}\\${name}.png`, Buffer.from(data, "base64"));
}

async function heading() { return evaluate(`document.querySelector("h1")?.textContent || ""`); }

async function waitSelector(selector, timeout = 12000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const found = await evaluate(`!!document.querySelector(${JSON.stringify(selector)})`);
    if (found) return true;
    await sleep(250);
  }
  throw new Error(`Selector not found: ${selector}`);
}

const go = async (page) => {
  await evaluate(`window.location.hash = "#/${page}"`);
  await sleep(500);
};

await send("Runtime.enable");
await send("Page.enable");
await send("Page.navigate", { url: URL });
await waitSelector(".login-submit");
await sleep(300);

const results = { pages: {}, flows: {} };

await evaluate(`document.querySelector(".login-submit").click()`);
await waitSelector(".app");
await sleep(800);
results.flows.login = await heading();

const pagesToVisit = [
  ["dashboard", "Cooperative overview"],
  ["transactions", "Receipts and payments"],
  ["journals", "Journal entries"],
  ["members", "Member accounts"],
  ["ledger", "Chart of accounts"],
  ["trial", "Trial balance"],
  ["reports", "Reports"],
  ["assets", "Asset register"],
  ["inventory", "Inventory"],
  ["audit", "Audit & compliance"],
  ["close", "Month-end close"],
  ["team", "Team & access"],
];

for (const [page, expected] of pagesToVisit) {
  await go(page);
  results.pages[page] = { heading: await heading(), expected, ok: (await heading()) === expected };
  if (["dashboard", "transactions", "members", "reports", "assets", "inventory", "audit", "close", "team"].includes(page)) {
    await shot(page);
  }
}

// ---- create a receipt ----
await go("transactions");
await evaluate(`Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("Record receipt"))?.click()`);
await waitSelector(".modal form");
await sleep(400);
results.flows.formOpened = await evaluate(`!!document.querySelector(".modal form")`);

const createResult = await evaluate(`(async () => {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const labels = Array.from(document.querySelectorAll(".modal .field span")).map(s => s.textContent);
  const inputs = Array.from(document.querySelectorAll(".modal input"));
  const selects = Array.from(document.querySelectorAll(".modal select"));
  const setNative = (el, value) => {
    const proto = el.tagName === "SELECT" ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, "value").set.call(el, value);
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  };
  if (inputs.length < 5 || selects.length < 3) return { error: "Form fields not found", labels, inputs: inputs.length, selects: selects.length };
  setNative(selects[1], "AM-0005");
  setNative(inputs[1], "111000");
  setNative(inputs[4], "E2E savings test");
  const before = {
    member: selects[1].value,
    amount: inputs[1].value,
    description: inputs[4].value,
  };
  const form = document.querySelector(".modal form");
  window.__submitted = false;
  form.addEventListener("submit", () => { window.__submitted = true; });
  const btn = Array.from(document.querySelectorAll(".modal button")).find(b => b.textContent.includes("Submit for approval"));
  const debug = {
    btnType: btn?.type,
    btnDisabled: btn?.disabled,
    valid: form.checkValidity(),
    invalid: Array.from(form.elements).filter(e => !e.checkValidity()).map(e => e.tagName + ":" + (e.name || e.id || e.type)),
  };
  btn?.click();
  await sleep(900);
  const state = JSON.parse(localStorage.getItem("amis-coop-finance-demo-v1"));
  const last = state.transactions[state.transactions.length - 1];
  return {
    ref: last.ref, status: last.status, amount: last.amount, closed: !document.querySelector(".modal form"),
    before, debug, submitted: window.__submitted,
    error: document.querySelector(".form-error")?.textContent || "",
    modalTitle: document.querySelector(".modal h2")?.textContent || "",
  };
})()`);
results.flows.created = createResult;

// approve the new receipt
await go("transactions");
await sleep(300);
const approveResult = await evaluate(`(async () => {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  Array.from(document.querySelectorAll(".tab")).find(t => t.textContent.includes("Pending"))?.click();
  await sleep(350);
  const row = Array.from(document.querySelectorAll("tbody tr")).find(tr => tr.textContent.includes(${JSON.stringify(createResult.ref)}));
  if (!row) return { found: false };
  const btn = Array.from(row.querySelectorAll("button")).find(b => b.textContent.includes("Approve"));
  btn?.click();
  await sleep(600);
  const state = JSON.parse(localStorage.getItem("amis-coop-finance-demo-v1"));
  const tx = state.transactions.find(t => t.ref === ${JSON.stringify(createResult.ref)});
  return { found: true, status: tx?.status, approvedBy: tx?.approvedBy };
})()`);
results.flows.approved = approveResult;

// ---- journal ----
await go("journals");
await evaluate(`Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("New journal"))?.click()`);
await sleep(400);
const journalResult = await evaluate(`(async () => {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const setNative = (el, value) => {
    const proto = el.tagName === "SELECT" ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, "value").set.call(el, value);
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  };
  const inputs = Array.from(document.querySelectorAll(".modal input"));
  setNative(inputs[1], "50000");
  setNative(inputs[2], "E2E journal test");
  const before = { amount: inputs[1].value };
  Array.from(document.querySelectorAll(".modal button")).find(b => b.textContent.includes("Post journal"))?.click();
  await sleep(800);
  const state = JSON.parse(localStorage.getItem("amis-coop-finance-demo-v1"));
  return { count: state.transactions.filter(t => t.kind === "journal").length, latest: state.transactions.filter(t => t.kind === "journal").at(-1)?.ref, before, error: document.querySelector(".form-error")?.textContent || "", modal: !!document.querySelector(".modal") };
})()`);
results.flows.journal = journalResult;

// ---- member statement ----
await go("members");
await evaluate(`document.querySelector("table.data tbody tr")?.click()`);
await sleep(500);
results.flows.member = await evaluate(`({
  heading: document.querySelector("h1")?.textContent,
  tabs: [...document.querySelectorAll(".tab")].map(t => t.textContent),
  rows: document.querySelectorAll("table.data tbody tr").length,
  savings: document.querySelector(".stat-value")?.textContent
})`);
await shot("member-detail");

// ---- reports + trial ----
await go("reports");
results.flows.reports = await evaluate(`({
  heading: document.querySelector("h1")?.textContent,
  income: [...document.querySelectorAll(".statement-table")][0]?.innerText?.slice(0, 120),
  balanced: document.body.innerText.includes("Assets = liabilities + members")
})`);
await shot("reports-final");

await go("trial");
results.flows.trial = await evaluate(`({
  heading: document.querySelector("h1")?.textContent,
  balanced: document.body.innerText.includes("Balanced"),
  total: document.querySelector("tfoot")?.innerText
})`);

// ---- depreciation ----
await go("assets");
const assetBefore = await evaluate(`JSON.parse(localStorage.getItem("amis-coop-finance-demo-v1")).assets[0].accum`);
await evaluate(`Array.from(document.querySelectorAll("table.data tbody tr"))[0]?.querySelector("button")?.click()`);
await sleep(900);
results.flows.depreciation = await evaluate(`(() => {
  const state = JSON.parse(localStorage.getItem("amis-coop-finance-demo-v1"));
  return { before: ${assetBefore}, after: state.assets[0].accum, journals: state.transactions.filter(t => t.type === "depreciation").length };
})()`);

// ---- stock receipt ----
await go("inventory");
await evaluate(`Array.from(document.querySelectorAll("table.data tbody tr"))[0]?.querySelectorAll("button")[0]?.click()`);
await waitSelector(".modal form");
const stockResult = await evaluate(`(async () => {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const setNative = (el, value) => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(el, value);
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  };
  const inputs = Array.from(document.querySelectorAll(".modal input"));
  setNative(inputs[0], "5");
  Array.from(document.querySelectorAll(".modal button")).find(b => b.textContent.includes("Post receipt"))?.click();
  await sleep(800);
  const state = JSON.parse(localStorage.getItem("amis-coop-finance-demo-v1"));
  return { qty: state.inventory[0].qty, value: state.inventory[0].qty * state.inventory[0].unitCost, closed: !document.querySelector(".modal form") };
})()`);
results.flows.stock = stockResult;

// ---- financial position tab ----
await go("reports");
await evaluate(`Array.from(document.querySelectorAll(".tab")).find(t => t.textContent.includes("Financial position"))?.click()`);
await sleep(400);
results.flows.financialPosition = await evaluate(`({
  equation: document.body.innerText.includes("Assets = liabilities + members"),
  balanced: document.body.innerText.includes("Balanced") || document.body.innerText.includes("Total members")
})`);

// ---- lock / reopen as treasurer ----
await evaluate(`(() => {
  const sel = document.querySelector(".user-switch");
  Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value").set.call(sel, "treasurer");
  sel.dispatchEvent(new Event("change", { bubbles: true }));
})()`);
await sleep(500);
await go("close");
await evaluate(`Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("Lock period"))?.click()`);
await sleep(800);
const locked = await evaluate(`JSON.parse(localStorage.getItem("amis-coop-finance-demo-v1")).period.locked`);
await evaluate(`Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("Reopen period"))?.click()`);
await sleep(700);
const reopened = await evaluate(`JSON.parse(localStorage.getItem("amis-coop-finance-demo-v1")).period.locked`);
results.flows.period = { locked, reopened };

// ---- auditor read-only ----
await evaluate(`(() => {
  const sel = document.querySelector(".user-switch");
  Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value").set.call(sel, "auditor01");
  sel.dispatchEvent(new Event("change", { bubbles: true }));
})()`);
await sleep(500);
await go("transactions");
results.flows.auditor = await evaluate(`({
  banner: document.body.innerText.includes("Read-only auditor view"),
  canCreate: !!Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("Record receipt"))
})`);

// ---- mobile layout ----
await go("dashboard");
await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
await sleep(500);
results.mobile = await evaluate(`({
  innerWidth: window.innerWidth,
  scrollWidth: document.documentElement.scrollWidth,
  menuVisible: getComputedStyle(document.querySelector(".mobile-menu")).display !== "none"
})`);
await shot("mobile-dashboard");
await send("Emulation.clearDeviceMetricsOverride");

results.errors = errors;
console.log(JSON.stringify(results, null, 2));

ws.close();
chrome.kill();
await sleep(400);
process.exit(0);
