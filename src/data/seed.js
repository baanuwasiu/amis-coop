export const DEMO_PASSWORD = "demo1234";

export const ROLES = {
  finance: {
    key: "finance",
    label: "Finance Officer",
    short: "Data entry",
    access: "Receipts, payments and draft journals",
    canCreate: true,
    canApprove: false,
    canManage: false,
    canClose: false,
  },
  accountant: {
    key: "accountant",
    label: "Accountant",
    short: "Accountant",
    access: "All entries, journals, assets, inventory and reports",
    canCreate: true,
    canApprove: true,
    canManage: true,
    canClose: false,
  },
  treasurer: {
    key: "treasurer",
    label: "Treasurer",
    short: "Approver",
    access: "Approvals, reports and period close",
    canCreate: false,
    canApprove: true,
    canManage: false,
    canClose: true,
  },
  auditor: {
    key: "auditor",
    label: "Auditor",
    short: "Read only",
    access: "Read-only access to books, vouchers and audit trail",
    canCreate: false,
    canApprove: false,
    canManage: false,
    canClose: false,
  },
};

export const USERS = [
  { username: "finance01", name: "Amina Yusuf", role: "finance", lastActive: "Today, 08:12" },
  { username: "accountant", name: "Sadiq Bello", role: "accountant", lastActive: "Today, 09:04" },
  { username: "treasurer", name: "Hajia R. Lawal", role: "treasurer", lastActive: "Yesterday, 16:40" },
  { username: "auditor01", name: "Musa Danjuma", role: "auditor", lastActive: "Yesterday, 11:22" },
];

export const ACCOUNTS = [
  { code: "1010", name: "Cash at bank", type: "asset", normal: "debit" },
  { code: "1020", name: "Cash at hand", type: "asset", normal: "debit" },
  { code: "1030", name: "Loans receivable", type: "asset", normal: "debit" },
  { code: "1040", name: "Fixed assets — cost", type: "asset", normal: "debit" },
  { code: "1045", name: "Accumulated depreciation", type: "asset", normal: "credit" },
  { code: "1050", name: "Inventory", type: "asset", normal: "debit" },
  { code: "2010", name: "Member savings", type: "liability", normal: "credit" },
  { code: "2020", name: "Accounts payable", type: "liability", normal: "credit" },
  { code: "3010", name: "Share capital", type: "equity", normal: "credit" },
  { code: "3020", name: "Reserves", type: "equity", normal: "credit" },
  { code: "3030", name: "Accumulated surplus", type: "equity", normal: "credit" },
  { code: "4010", name: "Service income", type: "income", normal: "credit" },
  { code: "4020", name: "Interest income", type: "income", normal: "credit" },
  { code: "4030", name: "Donations", type: "income", normal: "credit" },
  { code: "5010", name: "Operating expenses", type: "expense", normal: "debit" },
  { code: "5020", name: "Salaries", type: "expense", normal: "debit" },
  { code: "5030", name: "Utilities", type: "expense", normal: "debit" },
  { code: "5040", name: "Repairs", type: "expense", normal: "debit" },
  { code: "5050", name: "Depreciation", type: "expense", normal: "debit" },
  { code: "5060", name: "Transport", type: "expense", normal: "debit" },
];

const MEMBERS = [
  ["Aisha Bello", "0803 111 2201", 2100000, 700000, 1200000],
  ["Musa Ibrahim", "0806 222 3302", 1650000, 500000, 900000],
  ["Fatima Sani", "0812 333 4403", 1400000, 450000, 1500000],
  ["Abdulrahman Yusuf", "0805 444 5504", 1950000, 650000, 0],
  ["Hauwa Lawal", "0810 555 6605", 850000, 300000, 600000],
  ["Suleiman Abubakar", "0807 666 7706", 1200000, 400000, 1100000],
  ["Zainab Musa", "0802 777 8807", 1500000, 500000, 850000],
  ["Ibrahim Danjuma", "0814 888 9908", 1000000, 350000, 0],
  ["Maryam Okafor", "0809 999 1009", 1300000, 450000, 700000],
  ["Yusuf Adeyemi", "0813 101 1110", 800000, 250000, 450000],
  ["Khadija Bello", "0804 121 1211", 1450000, 500000, 1300000],
  ["Ahmed Sani", "0816 131 1312", 950000, 300000, 550000],
  ["Rukayat Lawal", "0808 141 1413", 700000, 200000, 0],
  ["Nura Abdullahi", "0811 151 1514", 900000, 300000, 500000],
  ["Bilal Mohammed", "0815 161 1515", 670000, 150000, 0],
].map(([name, phone, savings, shares, loan], index) => ({
  id: `AM-${String(index + 1).padStart(4, "0")}`,
  name,
  phone,
  joined: `202${index % 6}-0${(index % 9) + 1}-14`,
  status: "Active",
  openingSavings: savings,
  openingShares: shares,
  openingLoan: loan,
}));

const INCOME_TYPES = {
  savings: { label: "Monthly savings", account: "2010", member: true },
  shares: { label: "Share capital", account: "3010", member: true },
  loan_repayment: { label: "Loan repayment", account: "1030", member: true },
  service_fee: { label: "Service fees", account: "4010", member: false },
  donation: { label: "Donations", account: "4030", member: false },
  interest: { label: "Interest income", account: "4020", member: false },
};

const EXPENSE_TYPES = {
  office_supplies: { label: "Office supplies", account: "5010", member: false },
  salaries: { label: "Salaries", account: "5020", member: false },
  utilities: { label: "Utilities", account: "5030", member: false },
  repairs: { label: "Repairs", account: "5040", member: false },
  transport: { label: "Transport", account: "5060", member: false },
  loan_disbursement: { label: "Loan disbursement", account: "1030", member: true },
  asset_purchase: { label: "Asset purchase", account: "1040", member: false },
  inventory_purchase: { label: "Inventory purchase", account: "1050", member: false },
};

export const INCOME_CATEGORIES = Object.entries(INCOME_TYPES).map(([key, v]) => ({ key, ...v }));
export const EXPENSE_CATEGORIES = Object.entries(EXPENSE_TYPES).map(([key, v]) => ({ key, ...v }));

export function buildLines(kind, type, amount, method, memberId) {
  const cash = method === "Cash" ? "1020" : "1010";
  const spec = kind === "income" ? INCOME_TYPES[type] : EXPENSE_TYPES[type];
  if (!spec) throw new Error("Unknown transaction type");
  if (kind === "income") {
    return [
      { code: cash, debit: amount },
      { code: spec.account, credit: amount, memberId: spec.member ? memberId : undefined },
    ];
  }
  return [
    { code: spec.account, debit: amount, memberId: spec.member ? memberId : undefined },
    { code: cash, credit: amount },
  ];
}

function descFor(kind, type, member, party) {
  if (kind === "income") {
    if (type === "savings") return `Monthly savings — ${member?.name ?? "member"}`;
    if (type === "shares") return `Share capital — ${member?.name ?? "member"}`;
    if (type === "loan_repayment") return `Loan repayment — ${member?.name ?? "member"}`;
    if (type === "service_fee") return party || "Service fees — member services";
    if (type === "donation") return party || "Donation received";
    return party || "Interest income";
  }
  if (type === "salaries") return party || "Salaries — monthly payroll";
  if (type === "utilities") return party || "Utilities — electricity and water";
  if (type === "office_supplies") return party || "Office supplies";
  if (type === "repairs") return party || "Repairs and maintenance";
  if (type === "transport") return party || "Transport and fuel";
  if (type === "loan_disbursement") return `Loan disbursement — ${member?.name ?? "member"}`;
  if (type === "asset_purchase") return party || "Fixed asset purchase";
  if (type === "inventory_purchase") return party || "Inventory purchase";
  return party || "Payment";
}

const POSTED = [
  // May 2026
  ["2026-05-06", "income", "savings", 1, 450000, "Bank", "A. Bello savings"],
  ["2026-05-12", "income", "savings", 2, 380000, "Cash", ""],
  ["2026-05-18", "income", "loan_repayment", 3, 220000, "Bank", ""],
  ["2026-05-20", "income", "service_fee", 0, 150000, "Bank", "Annual registration fees"],
  ["2026-05-25", "expense", "salaries", 0, 1150000, "Bank", "Salaries — May 2026"],
  ["2026-05-27", "expense", "utilities", 0, 120000, "Bank", "AEDC electricity"],
  ["2026-05-28", "expense", "office_supplies", 0, 65000, "Cash", "ABC Stationers"],
  // June
  ["2026-06-05", "income", "savings", 4, 420000, "Bank", ""],
  ["2026-06-11", "income", "savings", 5, 260000, "Cash", ""],
  ["2026-06-15", "income", "loan_repayment", 6, 310000, "Bank", ""],
  ["2026-06-18", "income", "shares", 7, 300000, "Bank", ""],
  ["2026-06-25", "expense", "salaries", 0, 1150000, "Bank", "Salaries — June 2026"],
  ["2026-06-26", "expense", "utilities", 0, 135000, "Bank", "AEDC electricity"],
  ["2026-06-27", "expense", "repairs", 0, 180000, "Bank", "Facility Care — generator service"],
  ["2026-06-28", "expense", "loan_disbursement", 5, 800000, "Bank", ""],
  // July
  ["2026-07-04", "income", "savings", 8, 350000, "Bank", ""],
  ["2026-07-09", "income", "savings", 9, 290000, "Cash", ""],
  ["2026-07-14", "income", "loan_repayment", 10, 190000, "Bank", ""],
  ["2026-07-16", "income", "shares", 11, 250000, "Bank", ""],
  ["2026-07-20", "income", "service_fee", 0, 180000, "Bank", "Member service fees"],
  ["2026-07-25", "expense", "salaries", 0, 1150000, "Bank", "Salaries — July 2026"],
  ["2026-07-27", "expense", "utilities", 0, 110000, "Bank", "AEDC electricity"],
  ["2026-07-28", "expense", "office_supplies", 0, 72000, "Cash", "Ibrahim Books & Stationery"],
  // August
  ["2026-08-05", "income", "savings", 12, 310000, "Bank", ""],
  ["2026-08-10", "income", "savings", 13, 240000, "Cash", ""],
  ["2026-08-13", "income", "loan_repayment", 14, 260000, "Bank", ""],
  ["2026-08-17", "income", "donation", 0, 500000, "Bank", "Community donation"],
  ["2026-08-20", "income", "shares", 4, 350000, "Bank", ""],
  ["2026-08-25", "expense", "salaries", 0, 1150000, "Bank", "Salaries — August 2026"],
  ["2026-08-26", "expense", "utilities", 0, 145000, "Bank", "AEDC electricity"],
  ["2026-08-28", "expense", "transport", 0, 90000, "Cash", "Fuel and transport"],
  // September
  ["2026-09-04", "income", "savings", 15, 300000, "Bank", ""],
  ["2026-09-08", "income", "savings", 1, 400000, "Cash", ""],
  ["2026-09-12", "income", "loan_repayment", 3, 280000, "Bank", ""],
  ["2026-09-15", "income", "shares", 9, 220000, "Bank", ""],
  ["2026-09-18", "income", "service_fee", 0, 160000, "Bank", "Member service fees"],
  ["2026-09-22", "expense", "inventory_purchase", 0, 180000, "Bank", "Stock replenishment"],
  ["2026-09-25", "expense", "salaries", 0, 1200000, "Bank", "Salaries — September 2026"],
  ["2026-09-26", "expense", "utilities", 0, 125000, "Bank", "AEDC electricity"],
  ["2026-09-29", "expense", "repairs", 0, 250000, "Bank", "Facility Care — plumbing"],
  // October
  ["2026-10-06", "income", "savings", 2, 360000, "Bank", ""],
  ["2026-10-11", "income", "savings", 6, 270000, "Cash", ""],
  ["2026-10-14", "income", "loan_repayment", 11, 340000, "Bank", ""],
  ["2026-10-16", "income", "shares", 7, 280000, "Bank", ""],
  ["2026-10-20", "income", "service_fee", 0, 175000, "Bank", "Member service fees"],
  ["2026-10-23", "expense", "office_supplies", 0, 95000, "Cash", "ABC Stationers"],
  ["2026-10-25", "expense", "salaries", 0, 1200000, "Bank", "Salaries — October 2026"],
  ["2026-10-27", "expense", "utilities", 0, 140000, "Bank", "AEDC electricity"],
  ["2026-10-29", "expense", "loan_disbursement", 12, 600000, "Bank", ""],
  // November
  ["2026-11-03", "income", "savings", 3, 330000, "Bank", ""],
  ["2026-11-06", "income", "savings", 8, 250000, "Cash", ""],
  ["2026-11-10", "income", "loan_repayment", 1, 210000, "Bank", ""],
  ["2026-11-12", "income", "shares", 10, 300000, "Bank", ""],
  ["2026-11-15", "income", "service_fee", 0, 185000, "Bank", "Member service fees"],
  ["2026-11-18", "expense", "salaries", 0, 1200000, "Bank", "Salaries — November 2026"],
  ["2026-11-19", "expense", "utilities", 0, 150000, "Bank", "AEDC electricity"],
  ["2026-11-20", "expense", "office_supplies", 0, 78000, "Cash", "Ibrahim Books & Stationery"],
];

const PENDING = [
  ["2026-11-24", "income", "savings", 3, 250000, "Bank", ""],
  ["2026-11-24", "expense", "office_supplies", 0, 85000, "Bank", "ABC Stationers", "INV-2026-014"],
  ["2026-11-22", "expense", "repairs", 0, 65000, "Bank", "Facility Care", "INV-2026-010"],
];

function pad(n, len) {
  return String(n).padStart(len, "0");
}

export function buildSeed() {
  const transactions = [];
  let rc = 0;
  let pv = 0;

  transactions.push({
    id: "OPEN",
    ref: "OB-2026",
    date: "2026-05-01",
    kind: "opening",
    type: "opening",
    description: "Opening balances as at 1 May 2026",
    party: "Cooperative books",
    amount: 0,
    method: "—",
    status: "posted",
    createdBy: "Sadiq Bello",
    approvedBy: "Hajia R. Lawal",
    lines: [
      { code: "1010", debit: 24850000 },
      { code: "1020", debit: 150000 },
      { code: "1030", debit: 9650000 },
      { code: "1040", debit: 2400000 },
      { code: "1050", debit: 450000 },
      { code: "1045", credit: 650000 },
      { code: "2010", credit: 18420000 },
      { code: "2020", credit: 1300000 },
      { code: "3010", credit: 6000000 },
      { code: "3020", credit: 4000000 },
      { code: "3030", credit: 7130000 },
    ],
  });

  const make = (row, status) => {
    const [date, kind, type, memberIdx, amount, method, party, invoice] = row;
    const member = memberIdx ? MEMBERS[memberIdx - 1] : null;
    const ref = kind === "income" ? `RC-2026-${pad(++rc, 4)}` : `PV-2026-${pad(++pv, 4)}`;
    const description = descFor(kind, type, member, party);
    return {
      id: ref,
      ref,
      date,
      kind,
      type,
      memberId: member?.id,
      memberName: member?.name,
      description,
      party: party || member?.name || "—",
      invoice: invoice || "",
      amount,
      method,
      status,
      createdBy: "Amina Yusuf",
      approvedBy: status === "posted" ? "Sadiq Bello" : "",
      evidence: invoice ? `${invoice.toLowerCase()}.pdf` : "receipt.pdf",
      lines: buildLines(kind, type, amount, method, member?.id),
    };
  };

  const recurring = [];
  for (let m = 5; m <= 11; m += 1) {
    const mm = String(m).padStart(2, "0");
    recurring.push([`2026-${mm}-15`, "income", "service_fee", 0, 400000, "Bank", "Member service fees"]);
    recurring.push([
      `2026-${mm}-20`,
      "income",
      "interest",
      0,
      m === 11 ? 2100000 : 1500000,
      "Bank",
      "Interest on member loans",
    ]);
  }
  [...POSTED, ...recurring]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .forEach((row) => transactions.push(make(row, "posted")));

  PENDING.forEach((row) => transactions.push(make(row, "pending")));

  const assets = [
    {
      id: "FA-001",
      name: "Office computers",
      category: "IT equipment",
      date: "2025-02-10",
      cost: 1200000,
      location: "Secretariat",
      custodian: "Finance Officer",
      life: 3,
      residual: 100000,
      accum: 400000,
    },
    {
      id: "FA-002",
      name: "Office furniture",
      category: "Furniture",
      date: "2024-08-18",
      cost: 600000,
      location: "Meeting room",
      custodian: "Admin Officer",
      life: 5,
      residual: 60000,
      accum: 100000,
    },
    {
      id: "FA-003",
      name: "Standby generator",
      category: "Plant & machinery",
      date: "2025-06-02",
      cost: 600000,
      location: "Store",
      custodian: "Facility Officer",
      life: 4,
      residual: 50000,
      accum: 150000,
    },
  ];

  const inventory = [
    { id: "ST-001", name: "Printer paper", unit: "Ream", qty: 10, reorder: 15, unitCost: 10000 },
    { id: "ST-002", name: "Toner cartridge", unit: "Unit", qty: 10, reorder: 3, unitCost: 15000 },
    { id: "ST-003", name: "Office files", unit: "Pack", qty: 100, reorder: 20, unitCost: 1000 },
    { id: "ST-004", name: "Cleaning supplies", unit: "Pack", qty: 200, reorder: 40, unitCost: 500 },
  ];

  const audit = [
    {
      id: "AU-1001",
      at: "2026-11-24T09:04:00",
      user: "Sadiq Bello",
      role: "Accountant",
      action: "LOGIN",
      object: "Session",
      detail: "Signed in to the finance desk",
    },
    {
      id: "AU-1002",
      at: "2026-11-24T09:16:00",
      user: "Amina Yusuf",
      role: "Finance Officer",
      action: "CREATE",
      object: "RC-2026-0057",
      detail: "Monthly savings — Fatima Sani, ₦250,000 (pending)",
    },
    {
      id: "AU-1003",
      at: "2026-11-23T16:40:00",
      user: "Hajia R. Lawal",
      role: "Treasurer",
      action: "APPROVE",
      object: "PV-2026-0038",
      detail: "Utilities — AEDC, ₦150,000",
    },
    {
      id: "AU-1004",
      at: "2026-11-22T11:22:00",
      user: "Musa Danjuma",
      role: "Auditor",
      action: "VIEW",
      object: "General ledger",
      detail: "Reviewed October postings",
    },
  ];

  return {
    version: 2,
    period: { label: "November 2026", start: "2026-11-01", end: "2026-11-30", locked: false },
    accounts: ACCOUNTS,
    members: MEMBERS,
    transactions,
    assets,
    inventory,
    exceptions: [
      {
        id: "AU-014",
        title: "Unapproved payment above limit",
        owner: "Finance",
        status: "Open",
        detail: "PV-2026-0036 is above the ₦50,000 approval threshold.",
      },
      {
        id: "AU-021",
        title: "Bank reconciliation difference",
        owner: "Accounts",
        status: "Review",
        detail: "₦12,500 difference on the 31 October bank reconciliation.",
      },
      {
        id: "AU-026",
        title: "Missing asset tag",
        owner: "Admin",
        status: "Resolved",
        detail: "FA-003 standby generator has now been tagged.",
      },
      {
        id: "AU-031",
        title: "Duplicate invoice number",
        owner: "Finance",
        status: "Open",
        detail: "INV-2026-014 appears on two pending payment vouchers.",
      },
    ],
    closeTasks: [
      { id: "bank", label: "Bank reconciliation", owner: "Accountant", status: "done" },
      { id: "members", label: "Member balances reconciled", owner: "Accountant", status: "done" },
      { id: "journals", label: "Review journals and adjustments", owner: "Reviewer", status: "done" },
      { id: "depreciation", label: "Post depreciation", owner: "Accountant", status: "pending" },
      { id: "reports", label: "Approve management reports", owner: "Treasurer", status: "pending" },
    ],
    users: USERS,
    audit,
  };
}

export { MEMBERS, INCOME_TYPES, EXPENSE_TYPES };

