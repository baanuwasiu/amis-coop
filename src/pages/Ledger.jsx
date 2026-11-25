import { useMemo, useState } from "react";
import { useApp } from "../lib/store";
import { ledger, money, typeLabel, dateLabel } from "../lib/accounting";
import { Card, Empty, Modal, PageHead, Search, Stat } from "../components/UI";

const TYPES = ["all", "asset", "liability", "equity", "income", "expense"];

export default function Ledger() {
  const { state } = useApp();
  const [type, setType] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedCode, setSelectedCode] = useState(null);

  const books = useMemo(() => ledger(state), [state]);
  const rows = Object.values(books)
    .filter((r) => type === "all" || r.type === type)
    .filter((r) => `${r.code} ${r.name}`.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.code.localeCompare(b.code));

  const totalDebit = Object.values(books).reduce((s, r) => s + r.debit, 0);
  const totalCredit = Object.values(books).reduce((s, r) => s + r.credit, 0);

  const selected = selectedCode ? books[selectedCode] : null;
  const postings = useMemo(() => {
    if (!selectedCode) return [];
    let running = selected?.opening || 0;
    return state.transactions
      .filter((t) => t.status === "posted" && t.lines.some((line) => line.code === selectedCode))
      .sort((a, b) => a.date.localeCompare(b.date) || a.ref.localeCompare(b.ref))
      .map((tx) => {
        const line = tx.lines.find((l) => l.code === selectedCode);
        running += (Number(line.debit) || 0) - (Number(line.credit) || 0);
        return { ...tx, line, running };
      });
  }, [state.transactions, selectedCode, selected?.opening]);

  return (
    <>
      <PageHead
        kicker="General ledger"
        title="Chart of accounts"
        subtitle="Every posted receipt, payment and journal — grouped by account"
        actions={<Search value={search} onChange={setSearch} placeholder="Search account" />}
      />

      <div className="stat-grid">
        <Stat label="Accounts in use" value={String(Object.values(books).filter((r) => Math.abs(r.balance) > 0.5).length)} hint="With a balance" />
        <Stat label="Period debits" value={money(totalDebit)} hint="Posted to the ledger" />
        <Stat label="Period credits" value={money(totalCredit)} hint="Posted to the ledger" />
      </div>

      <Card title="Ledger balances" subtitle="Opening, movement and closing balance by account">
        <div className="filter-row">
          {TYPES.map((t) => (
            <button key={t} className={`chip-filter ${type === t ? "active" : ""}`} onClick={() => setType(t)}>
              {t === "all" ? "All accounts" : typeLabel(t)}
            </button>
          ))}
        </div>

        {rows.length === 0 ? (
          <Empty title="No accounts" text="Nothing matches this filter." />
        ) : (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Account</th>
                  <th>Type</th>
                  <th className="num">Opening</th>
                  <th className="num">Debits</th>
                  <th className="num">Credits</th>
                  <th className="num">Closing</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.code} className="clickable" onClick={() => setSelectedCode(r.code)}>
                    <td className="mono">{r.code}</td>
                    <td className="strong">{r.name}</td>
                    <td className="muted">{typeLabel(r.type)}</td>
                    <td className="num">{r.opening ? `${money(Math.abs(r.opening))}${r.opening < 0 ? " Cr" : ""}` : "—"}</td>
                    <td className="num">{r.debit ? money(r.debit) : "—"}</td>
                    <td className="num">{r.credit ? money(r.credit) : "—"}</td>
                    <td className="num strong">
                      {r.balance >= 0 ? money(r.balance) : `${money(Math.abs(r.balance))} Cr`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="note">Debit balances are shown without a suffix; credit balances are marked “Cr”.</p>
      </Card>

      {selected ? (
        <Modal
          wide
          title={`${selected.code} · ${selected.name}`}
          subtitle={`${typeLabel(selected.type)} · opening ${money(Math.abs(selected.opening))}`}
          onClose={() => setSelectedCode(null)}
        >
          <div className="detail-grid">
            <div><span>Opening</span><strong>{money(Math.abs(selected.opening))}</strong></div>
            <div><span>Debits</span><strong>{money(selected.debit)}</strong></div>
            <div><span>Credits</span><strong>{money(selected.credit)}</strong></div>
            <div><span>Closing</span><strong>{selected.balance >= 0 ? money(selected.balance) : `${money(Math.abs(selected.balance))} Cr`}</strong></div>
          </div>

          <div className="table-wrap">
            <table className="data compact">
              <thead>
                <tr><th>Date</th><th>Reference</th><th>Description</th><th className="num">Debit</th><th className="num">Credit</th><th className="num">Balance</th></tr>
              </thead>
              <tbody>
                <tr className="opening-row">
                  <td className="muted">01 May 2026</td>
                  <td className="mono">OB</td>
                  <td className="strong">Opening balance</td>
                  <td className="num">—</td>
                  <td className="num">—</td>
                  <td className="num strong">{money(Math.abs(selected.opening))}{selected.opening < 0 ? " Cr" : ""}</td>
                </tr>
                {postings.map((row) => (
                  <tr key={`${row.id}-${row.line.code}`}>
                    <td className="muted">{dateLabel(row.date)}</td>
                    <td className="mono">{row.ref}</td>
                    <td>{row.description}</td>
                    <td className="num">{row.line.debit ? money(row.line.debit) : "—"}</td>
                    <td className="num">{row.line.credit ? money(row.line.credit) : "—"}</td>
                    <td className="num">{money(Math.abs(row.running))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="note">Every line above is traceable to its original receipt, payment or journal.</p>
        </Modal>
      ) : null}
    </>
  );
}
