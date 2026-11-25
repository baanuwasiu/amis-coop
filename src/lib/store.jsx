import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { buildSeed, buildLines, ROLES, DEMO_PASSWORD } from "../data/seed";
import { nextRef } from "./accounting";

const STORE_KEY = "amis-coop-finance-demo-v1";
const SESSION_KEY = "amis-coop-demo-user";

const AppContext = createContext(null);

function loadState() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.version === 2 && Array.isArray(parsed.transactions)) return parsed;
    }
  } catch (error) {
    console.warn("Could not load demo state", error);
  }
  return buildSeed();
}

function loadSession() {
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null");
  } catch {
    return null;
  }
}

let auditSeq = 0;

export function AppProvider({ children }) {
  const [state, setState] = useState(loadState);
  const [user, setUser] = useState(loadSession);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    if (user) sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
    else sessionStorage.removeItem(SESSION_KEY);
  }, [user]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(timer);
  }, [toast]);

  const notify = (message, tone = "success") => setToast({ message, tone, id: Date.now() });

  const role = ROLES[user?.role] || {};

  function appendAudit(next, action, object, detail, actingUser = user) {
    if (!actingUser) return;
    auditSeq += 1;
    next.audit.unshift({
      id: `AU-${Date.now()}-${auditSeq}`,
      at: new Date().toISOString(),
      user: actingUser.name,
      role: ROLES[actingUser.role]?.label || actingUser.role,
      action,
      object,
      detail,
    });
  }

  function commit(mutator, audit) {
    setState((prev) => {
      const next = structuredClone(prev);
      mutator(next);
      if (audit) appendAudit(next, ...audit);
      return next;
    });
  }

  function login(username, password) {
    const found = state.users.find((u) => u.username === username.trim().toLowerCase());
    if (!found) return { ok: false, error: "Unknown username. Use one of the demo accounts below." };
    if (password !== DEMO_PASSWORD) return { ok: false, error: "Incorrect password. The demo password is demo1234." };
    setUser(found);
    setState((prev) => {
      const next = structuredClone(prev);
      appendAudit(next, "LOGIN", "Session", "Signed in to the finance desk", found);
      return next;
    });
    return { ok: true };
  }

  function logout() {
    if (user) {
      commit(() => {}, ["LOGOUT", "Session", "Signed out"]);
    }
    setUser(null);
  }

  function switchUser(username) {
    const found = state.users.find((u) => u.username === username);
    if (!found) return;
    setUser(found);
    setState((prev) => {
      const next = structuredClone(prev);
      appendAudit(next, "SWITCH ROLE", "Session", `Demo view switched to ${found.name}`, found);
      return next;
    });
    notify(`Viewing as ${found.name} · ${ROLES[found.role].label}`);
  }

  function addTransaction(data) {
    if (!role.canCreate) return { ok: false, error: "Your role cannot create entries." };
    if (state.period.locked) return { ok: false, error: "The period is locked." };

    const ref = nextRef(state, data.kind);
    const member = state.members.find((m) => m.id === data.memberId);
    const tx = {
      id: ref,
      ref,
      date: data.date,
      kind: data.kind,
      type: data.type,
      memberId: member?.id,
      memberName: member?.name,
      description: data.description,
      party: data.party || member?.name || "—",
      invoice: data.invoice || "",
      amount: Number(data.amount),
      method: data.method,
      status: "pending",
      createdBy: user.name,
      approvedBy: "",
      evidence: data.evidence || "receipt.pdf",
      lines: buildLines(data.kind, data.type, Number(data.amount), data.method, member?.id),
    };

    commit(
      (next) => {
        next.transactions.push(tx);
      },
      ["CREATE", ref, `${data.description} · pending approval`],
    );
    notify(`${ref} submitted for approval`);
    return { ok: true, ref };
  }

  function approveTransaction(id) {
    if (!role.canApprove) return { ok: false, error: "Your role cannot approve entries." };
    commit(
      (next) => {
        const tx = next.transactions.find((t) => t.id === id);
        if (tx) {
          tx.status = "posted";
          tx.approvedBy = user.name;
          tx.approvedAt = new Date().toISOString();
        }
      },
      ["APPROVE", id, "Transaction approved and posted"],
    );
    notify(`${id} approved and posted`);
    return { ok: true };
  }

  function rejectTransaction(id) {
    if (!role.canApprove) return { ok: false, error: "Your role cannot reject entries." };
    commit(
      (next) => {
        const tx = next.transactions.find((t) => t.id === id);
        if (tx) {
          tx.status = "rejected";
          tx.approvedBy = user.name;
          tx.rejectedAt = new Date().toISOString();
        }
      },
      ["REJECT", id, "Transaction returned to preparer"],
    );
    notify(`${id} rejected`, "warning");
    return { ok: true };
  }

  function postJournal({ date, description, debitCode, creditCode, amount }) {
    if (!role.canCreate) return { ok: false, error: "Your role cannot post journals." };
    if (state.period.locked) return { ok: false, error: "The period is locked." };
    if (debitCode === creditCode) return { ok: false, error: "Choose two different accounts." };
    const value = Number(amount);
    if (!(value > 0)) return { ok: false, error: "Enter an amount greater than zero." };

    const ref = nextRef(state, "journal");
    const tx = {
      id: ref,
      ref,
      date,
      kind: "journal",
      type: "journal",
      description,
      party: "Manual journal",
      amount: value,
      method: "—",
      status: "posted",
      createdBy: user.name,
      approvedBy: user.name,
      evidence: "journal.pdf",
      lines: [
        { code: debitCode, debit: value },
        { code: creditCode, credit: value },
      ],
    };

    commit(
      (next) => {
        next.transactions.push(tx);
      },
      ["JOURNAL", ref, `${description} · Dr ${debitCode} / Cr ${creditCode}`],
    );
    notify(`${ref} posted`);
    return { ok: true, ref };
  }

  function addAsset(data) {
    if (!role.canManage) return { ok: false, error: "Your role cannot manage assets." };
    if (state.period.locked) return { ok: false, error: "The period is locked." };
    const nextNumber = state.assets.length + 1;
    const id = `FA-${String(nextNumber).padStart(3, "0")}`;
    const ref = nextRef(state, "journal");
    const cost = Number(data.cost);
    const tx = {
      id: ref,
      ref,
      date: data.date,
      kind: "journal",
      type: "asset_purchase",
      description: `Asset purchase — ${data.name}`,
      party: data.custodian || "Supplier",
      amount: cost,
      method: "Bank",
      status: "posted",
      createdBy: user.name,
      approvedBy: user.name,
      evidence: "asset-invoice.pdf",
      lines: [
        { code: "1040", debit: cost },
        { code: "1010", credit: cost },
      ],
    };
    commit(
      (next) => {
        next.transactions.push(tx);
        next.assets.push({
          id,
          name: data.name,
          category: data.category,
          date: data.date,
          cost,
          location: data.location,
          custodian: data.custodian,
          life: Number(data.life),
          residual: Number(data.residual),
          accum: 0,
        });
      },
      ["ASSET", id, `Added ${data.name} · ${cost}`],
    );
    notify(`${id} added to the asset register`);
    return { ok: true, id };
  }

  function depreciateAsset(id) {
    if (!role.canManage) return { ok: false, error: "Your role cannot post depreciation." };
    if (state.period.locked) return { ok: false, error: "The period is locked." };
    const asset = state.assets.find((a) => a.id === id);
    if (!asset) return { ok: false, error: "Asset not found." };
    const monthly = Math.round((asset.cost - asset.residual) / (asset.life * 12));
    const remaining = asset.cost - asset.residual - asset.accum;
    const value = Math.min(monthly, remaining);
    if (value <= 0) return { ok: false, error: "This asset is fully depreciated." };

    const ref = nextRef(state, "journal");
    const tx = {
      id: ref,
      ref,
      date: state.period.end,
      kind: "journal",
      type: "depreciation",
      description: `Depreciation — ${asset.name}`,
      party: "Depreciation schedule",
      amount: value,
      method: "—",
      status: "posted",
      createdBy: user.name,
      approvedBy: user.name,
      evidence: "depreciation-schedule.pdf",
      lines: [
        { code: "5050", debit: value },
        { code: "1045", credit: value },
      ],
    };
    commit(
      (next) => {
        next.transactions.push(tx);
        const row = next.assets.find((a) => a.id === id);
        if (row) row.accum += value;
      },
      ["DEPRECIATION", asset.id, `${asset.name} · ${value}`],
    );
    notify(`${asset.name}: ${value.toLocaleString("en-NG")} depreciation posted`);
    return { ok: true };
  }

  function stockMove({ itemId, mode, qty, unitCost }) {
    if (!role.canManage) return { ok: false, error: "Your role cannot manage inventory." };
    if (state.period.locked) return { ok: false, error: "The period is locked." };
    const item = state.inventory.find((i) => i.id === itemId);
    if (!item) return { ok: false, error: "Item not found." };
    const quantity = Number(qty);
    if (!(quantity > 0)) return { ok: false, error: "Enter a quantity greater than zero." };
    if (mode === "out" && quantity > item.qty) return { ok: false, error: "Not enough stock on hand." };

    const price = mode === "in" ? Number(unitCost) || item.unitCost : item.unitCost;
    const value = quantity * price;
    const ref = nextRef(state, "journal");
    const tx = {
      id: ref,
      ref,
      date: state.period.end,
      kind: "journal",
      type: mode === "in" ? "inventory_purchase" : "inventory_issue",
      description: `${mode === "in" ? "Stock received" : "Stock issued"} — ${item.name}`,
      party: mode === "in" ? "Supplier" : "Internal use",
      amount: value,
      method: "—",
      status: "posted",
      createdBy: user.name,
      approvedBy: user.name,
      evidence: "stock-note.pdf",
      lines:
        mode === "in"
          ? [
              { code: "1050", debit: value },
              { code: "1010", credit: value },
            ]
          : [
              { code: "5010", debit: value },
              { code: "1050", credit: value },
            ],
    };

    commit(
      (next) => {
        next.transactions.push(tx);
        const row = next.inventory.find((i) => i.id === itemId);
        if (!row) return;
        if (mode === "in") {
          const totalValue = row.qty * row.unitCost + value;
          row.qty += quantity;
          row.unitCost = Math.round(totalValue / row.qty);
        } else {
          row.qty -= quantity;
        }
      },
      ["STOCK", item.id, `${mode === "in" ? "Received" : "Issued"} ${quantity} ${item.unit}`],
    );
    notify(`${item.name}: stock ${mode === "in" ? "received" : "issued"}`);
    return { ok: true };
  }

  function addInventoryItem(data) {
    if (!role.canManage) return { ok: false, error: "Your role cannot manage inventory." };
    const id = `ST-${String(state.inventory.length + 1).padStart(3, "0")}`;
    commit(
      (next) => {
        next.inventory.push({
          id,
          name: data.name,
          unit: data.unit,
          qty: Number(data.qty),
          reorder: Number(data.reorder),
          unitCost: Number(data.unitCost),
        });
      },
      ["INVENTORY", id, `Added ${data.name}`],
    );
    notify(`${id} added`);
    return { ok: true };
  }

  function toggleCloseTask(id) {
    if (!role.canManage && !role.canClose) return { ok: false, error: "Your role cannot change the close checklist." };
    commit(
      (next) => {
        const task = next.closeTasks.find((t) => t.id === id);
        if (task) task.status = task.status === "done" ? "pending" : "done";
      },
      ["CLOSE", id, "Close checklist updated"],
    );
  }

  function lockPeriod() {
    if (!role.canClose) return { ok: false, error: "Only the Treasurer can lock the period." };
    commit((next) => { next.period.locked = true; }, ["CLOSE", "Period", `${state.period.label} locked`]);
    notify(`${state.period.label} locked`);
    return { ok: true };
  }

  function unlockPeriod() {
    if (!role.canClose) return { ok: false, error: "Only the Treasurer can reopen the period." };
    commit((next) => { next.period.locked = false; }, ["CLOSE", "Period", `${state.period.label} reopened`]);
    notify(`${state.period.label} reopened`, "warning");
    return { ok: true };
  }

  function resolveException(id) {
    if (!role.canApprove) return { ok: false, error: "Your role cannot resolve exceptions." };
    commit(
      (next) => {
        const item = next.exceptions.find((e) => e.id === id);
        if (item) item.status = "Resolved";
      },
      ["EXCEPTION", id, "Marked resolved"],
    );
    notify(`${id} marked resolved`);
  }

  function exportData() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `amis-coop-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    notify("Backup export downloaded");
  }

  function resetDemo() {
    const fresh = buildSeed();
    setState(fresh);
    localStorage.setItem(STORE_KEY, JSON.stringify(fresh));
    notify("Demo data restored");
  }

  const value = useMemo(
    () => ({
      state,
      user,
      role,
      toast,
      notify,
      login,
      logout,
      switchUser,
      addTransaction,
      approveTransaction,
      rejectTransaction,
      postJournal,
      addAsset,
      depreciateAsset,
      stockMove,
      addInventoryItem,
      toggleCloseTask,
      lockPeriod,
      unlockPeriod,
      resolveException,
      exportData,
      resetDemo,
    }),
    [state, user, role, toast],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
