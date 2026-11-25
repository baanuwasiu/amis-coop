const nf = new Intl.NumberFormat("en-NG", { maximumFractionDigits: 0 });

export function money(n) {
  const v = Math.round(Number(n) || 0);
  return `${v < 0 ? "-₦" : "₦"}${nf.format(Math.abs(v))}`;
}

export function shortMoney(n) {
  const v = Math.round(Number(n) || 0);
  const abs = Math.abs(v);
  if (abs >= 1_000_000) return `₦${(v / 1_000_000).toFixed(2)}m`;
  if (abs >= 1_000) return `₦${Math.round(v / 1_000)}k`;
  return money(v);
}

export function parseDate(value) {
  return new Date(`${value}T00:00:00`);
}

export function dateLabel(value) {
  if (!value) return "—";
  return parseDate(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function shortDate(value) {
  if (!value) return "—";
  return parseDate(value).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

export function monthKey(value) {
  return value.slice(0, 7);
}

export function monthLabel(key) {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-GB", { month: "short" });
}

export function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function accountMap(state) {
  return Object.fromEntries(state.accounts.map((a) => [a.code, a]));
}

export function postedTransactions(state) {
  return state.transactions.filter((t) => t.status === "posted");
}

export function nextRef(state, kind) {
  const prefix = kind === "income" ? "RC" : kind === "expense" ? "PV" : "JV";
  const max = state.transactions
    .filter((t) => t.ref?.startsWith(`${prefix}-2026-`))
    .reduce((m, t) => Math.max(m, Number(t.ref.split("-").pop()) || 0), 0);
  return `${prefix}-2026-${String(max + 1).padStart(4, "0")}`;
}

export function ledger(state, asOf = state.period.end) {
  const map = {};
  state.accounts.forEach((a) => {
    map[a.code] = {
      ...a,
      opening: 0,
      debit: 0,
      credit: 0,
      balance: 0,
      closingDebit: 0,
      closingCredit: 0,
    };
  });

  state.transactions.forEach((tx) => {
    if (tx.status !== "posted" || tx.date > asOf) return;
    tx.lines.forEach((line) => {
      const row = map[line.code];
      if (!row) return;
      const debit = Number(line.debit) || 0;
      const credit = Number(line.credit) || 0;
      if (tx.kind === "opening") {
        row.opening += debit - credit;
      } else {
        row.debit += debit;
        row.credit += credit;
      }
    });
  });

  Object.values(map).forEach((row) => {
    row.balance = row.opening + row.debit - row.credit;
    row.closingDebit = Math.max(row.balance, 0);
    row.closingCredit = Math.max(-row.balance, 0);
  });

  return map;
}

export function trialBalance(state, asOf = state.period.end) {
  const rows = Object.values(ledger(state, asOf))
    .filter((r) => Math.abs(r.balance) > 0.5)
    .map((r) => ({
      code: r.code,
      name: r.name,
      type: r.type,
      debit: r.closingDebit,
      credit: r.closingCredit,
    }))
    .sort((a, b) => a.code.localeCompare(b.code));
  const debit = rows.reduce((s, r) => s + r.debit, 0);
  const credit = rows.reduce((s, r) => s + r.credit, 0);
  return { rows, debit, credit, balanced: Math.abs(debit - credit) < 0.5 };
}

export function incomeStatement(state, from = state.period.start, to = state.period.end) {
  const accounts = accountMap(state);
  const income = new Map();
  const expenses = new Map();

  state.transactions.forEach((tx) => {
    if (tx.status !== "posted" || tx.kind === "opening") return;
    if (tx.date < from || tx.date > to) return;
    tx.lines.forEach((line) => {
      const acc = accounts[line.code];
      if (!acc) return;
      const debit = Number(line.debit) || 0;
      const credit = Number(line.credit) || 0;
      if (acc.type === "income") {
        income.set(acc.name, (income.get(acc.name) || 0) + credit - debit);
      }
      if (acc.type === "expense") {
        expenses.set(acc.name, (expenses.get(acc.name) || 0) + debit - credit);
      }
    });
  });

  const incomeRows = [...income.entries()]
    .map(([name, amount]) => ({ name, amount }))
    .filter((r) => Math.abs(r.amount) > 0.5)
    .sort((a, b) => b.amount - a.amount);
  const expenseRows = [...expenses.entries()]
    .map(([name, amount]) => ({ name, amount }))
    .filter((r) => Math.abs(r.amount) > 0.5)
    .sort((a, b) => b.amount - a.amount);
  const totalIncome = incomeRows.reduce((s, r) => s + r.amount, 0);
  const totalExpense = expenseRows.reduce((s, r) => s + r.amount, 0);
  return {
    incomeRows,
    expenseRows,
    totalIncome,
    totalExpense,
    surplus: totalIncome - totalExpense,
  };
}

export function balanceSheet(state, asOf = state.period.end) {
  const rows = Object.values(ledger(state, asOf));
  const assets = rows.filter((r) => r.type === "asset").reduce((s, r) => s + r.balance, 0);
  const liabilities = -rows.filter((r) => r.type === "liability").reduce((s, r) => s + r.balance, 0);
  const equityBook = -rows.filter((r) => r.type === "equity").reduce((s, r) => s + r.balance, 0);

  let pnl = 0;
  const accounts = accountMap(state);
  state.transactions.forEach((tx) => {
    if (tx.status !== "posted" || tx.kind === "opening" || tx.date > asOf) return;
    tx.lines.forEach((line) => {
      const acc = accounts[line.code];
      if (!acc) return;
      const debit = Number(line.debit) || 0;
      const credit = Number(line.credit) || 0;
      if (acc.type === "income") pnl += credit - debit;
      if (acc.type === "expense") pnl -= debit - credit;
    });
  });

  const funds = equityBook + pnl;
  const total = liabilities + funds;
  return {
    assets,
    liabilities,
    equityBook,
    pnl,
    funds,
    total,
    difference: assets - total,
    balanced: Math.abs(assets - total) < 0.5,
  };
}

export function monthlyCash(state, count = 7) {
  const end = parseDate(state.period.end);
  const buckets = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(end.getFullYear(), end.getMonth() - i, 1);
    buckets.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: monthLabel(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`),
      inflow: 0,
      outflow: 0,
    });
  }
  const byKey = Object.fromEntries(buckets.map((b) => [b.key, b]));

  state.transactions.forEach((tx) => {
    if (tx.status !== "posted" || tx.kind === "opening") return;
    const bucket = byKey[monthKey(tx.date)];
    if (!bucket) return;
    tx.lines.forEach((line) => {
      if (line.code !== "1010" && line.code !== "1020") return;
      bucket.inflow += Number(line.debit) || 0;
      bucket.outflow += Number(line.credit) || 0;
    });
  });

  return buckets;
}

export function memberEntries(state, memberId, code) {
  const rows = [];
  state.transactions.forEach((tx) => {
    if (tx.status !== "posted" || tx.kind === "opening") return;
    tx.lines.forEach((line) => {
      if (line.memberId === memberId && line.code === code) rows.push({ tx, line });
    });
  });
  return rows.sort((a, b) => a.tx.date.localeCompare(b.tx.date));
}

export function memberSummary(state) {
  return state.members.map((m) => {
    let savings = m.openingSavings;
    let shares = m.openingShares;
    let loan = m.openingLoan;

    state.transactions.forEach((tx) => {
      if (tx.status !== "posted" || tx.kind === "opening") return;
      tx.lines.forEach((line) => {
        if (line.memberId !== m.id) return;
        const debit = Number(line.debit) || 0;
        const credit = Number(line.credit) || 0;
        if (line.code === "2010") savings += credit - debit;
        if (line.code === "3010") shares += credit - debit;
        if (line.code === "1030") loan += debit - credit;
      });
    });

    return { ...m, savings, shares, loan };
  });
}

export function memberStatement(state, memberId, code) {
  const member = state.members.find((m) => m.id === memberId);
  if (!member) return { member: null, rows: [] };
  const opening =
    code === "2010" ? member.openingSavings : code === "3010" ? member.openingShares : member.openingLoan;
  const rows = [
    {
      date: "2026-05-01",
      ref: "OB",
      description: "Opening balance",
      debit: 0,
      credit: 0,
      balance: opening,
      opening: true,
    },
  ];
  let balance = opening;

  memberEntries(state, memberId, code).forEach(({ tx, line }) => {
    const debit = Number(line.debit) || 0;
    const credit = Number(line.credit) || 0;
    const delta = code === "1030" ? debit - credit : credit - debit;
    if (!delta) return;
    balance += delta;
    rows.push({
      date: tx.date,
      ref: tx.ref,
      description: tx.description,
      debit: delta < 0 ? Math.abs(delta) : 0,
      credit: delta > 0 ? delta : 0,
      balance,
    });
  });

  return { member, rows };
}

export function accountName(state, code) {
  return state.accounts.find((a) => a.code === code)?.name || code;
}

export function typeLabel(type) {
  return (
    {
      asset: "Asset",
      liability: "Liability",
      equity: "Members’ funds",
      income: "Income",
      expense: "Expense",
    }[type] || type
  );
}

export function txStatusLabel(status) {
  return { pending: "Pending approval", posted: "Posted", rejected: "Rejected" }[status] || status;
}
