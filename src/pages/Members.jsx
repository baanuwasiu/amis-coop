import { useMemo, useState } from "react";
import { useApp } from "../lib/store";
import { memberSummary, memberStatement, money, dateLabel } from "../lib/accounting";
import { Button, Card, Empty, PageHead, Search, Stat, StatusPill, Tabs, printDocument } from "../components/UI";

const ACCOUNT_TABS = [
  { key: "2010", label: "Savings" },
  { key: "3010", label: "Shares" },
  { key: "1030", label: "Loan" },
];

export default function Members() {
  const { state } = useApp();
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [tab, setTab] = useState("2010");

  const summaries = useMemo(() => memberSummary(state), [state]);
  const filtered = summaries.filter((m) =>
    `${m.id} ${m.name} ${m.phone}`.toLowerCase().includes(search.toLowerCase()),
  );

  const totals = summaries.reduce(
    (acc, m) => ({ savings: acc.savings + m.savings, shares: acc.shares + m.shares, loan: acc.loan + m.loan }),
    { savings: 0, shares: 0, loan: 0 },
  );

  const selected = summaries.find((m) => m.id === selectedId);
  const statement = selected ? memberStatement(state, selected.id, tab) : null;

  const printStatement = () => {
    if (!selected || !statement) return;
    const label = ACCOUNT_TABS.find((t) => t.key === tab)?.label;
    const body = `
      <div class="head"><h1>AMIS Cooperative</h1><p>Member statement · ${label}</p></div>
      <p><strong>${selected.name}</strong> (${selected.id})</p>
      <p class="muted">${selected.phone} · ${selected.status}</p>
      <table><thead><tr><th>Date</th><th>Reference</th><th>Description</th><th class="r">Debit</th><th class="r">Credit</th><th class="r">Balance</th></tr></thead>
      <tbody>${statement.rows.map((r) => `<tr><td>${r.opening ? "01 May 2026" : dateLabel(r.date)}</td><td>${r.ref}</td><td>${r.description}</td><td class="r">${r.debit ? money(r.debit) : "—"}</td><td class="r">${r.credit ? money(r.credit) : "—"}</td><td class="r">${money(r.balance)}</td></tr>`).join("")}</tbody></table>`;
    printDocument(`${selected.name} — ${label} statement`, body);
  };

  if (selected) {
    return (
      <>
        <PageHead
          kicker="Member ledger"
          title={selected.name}
          subtitle={`${selected.id} · ${selected.phone} · member since ${dateLabel(selected.joined)}`}
          actions={
            <>
              <Button variant="secondary" icon="back" onClick={() => setSelectedId(null)}>All members</Button>
              <Button icon="printer" onClick={printStatement}>Print statement</Button>
            </>
          }
        />

        <div className="stat-grid">
          <Stat label="Savings balance" value={money(selected.savings)} hint="Account 2010" />
          <Stat label="Share capital" value={money(selected.shares)} hint="Account 3010" />
          <Stat label="Loan outstanding" value={money(selected.loan)} hint="Account 1030" tone={selected.loan > 0 ? "warning" : ""} />
        </div>

        <Card
          title="Account statement"
          subtitle="Opening balance, member transactions and closing balance"
          action={<StatusPill status={selected.status} />}
        >
          <Tabs tabs={ACCOUNT_TABS} value={tab} onChange={setTab} />
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Reference</th>
                  <th>Description</th>
                  <th className="num">Debit</th>
                  <th className="num">Credit</th>
                  <th className="num">Balance</th>
                </tr>
              </thead>
              <tbody>
                {statement.rows.map((row, index) => (
                  <tr key={`${row.ref}-${index}`} className={row.opening ? "opening-row" : ""}>
                    <td className="muted">{row.opening ? "01 May 2026" : dateLabel(row.date)}</td>
                    <td className="mono">{row.ref}</td>
                    <td className={row.opening ? "strong" : ""}>{row.description}</td>
                    <td className="num">{row.debit ? money(row.debit) : "—"}</td>
                    <td className="num">{row.credit ? money(row.credit) : "—"}</td>
                    <td className="num strong">{money(row.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="note">Savings and shares are credit balances. The loan balance is the principal still outstanding.</p>
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHead
        kicker="Subsidiary ledger"
        title="Member accounts"
        subtitle="Savings, share capital and loan balances for every member"
      />

      <div className="stat-grid">
        <Stat label="Total member savings" value={money(totals.savings)} hint={`${summaries.length} members`} />
        <Stat label="Share capital" value={money(totals.shares)} hint="Members’ funds" />
        <Stat label="Loans outstanding" value={money(totals.loan)} hint="Principal receivable" />
      </div>

      <Card
        title="Members"
        subtitle="Select a member to open the full statement"
        action={<Search value={search} onChange={setSearch} placeholder="Search name, ID or phone" />}
      >
        {filtered.length === 0 ? (
          <Empty title="No member found" text="Try another name or member number." />
        ) : (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Phone</th>
                  <th>Joined</th>
                  <th className="num">Savings</th>
                  <th className="num">Shares</th>
                  <th className="num">Loan</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((m) => (
                  <tr key={m.id} className="clickable" onClick={() => { setSelectedId(m.id); setTab("2010"); }}>
                    <td>
                      <div className="strong">{m.name}</div>
                      <div className="muted small mono">{m.id}</div>
                    </td>
                    <td className="muted">{m.phone}</td>
                    <td className="muted">{dateLabel(m.joined)}</td>
                    <td className="num">{money(m.savings)}</td>
                    <td className="num">{money(m.shares)}</td>
                    <td className={`num ${m.loan ? "strong" : "muted"}`}>{money(m.loan)}</td>
                    <td><StatusPill status={m.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
