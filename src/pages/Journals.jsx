import { useMemo, useState } from "react";
import { useApp } from "../lib/store";
import { accountMap, dateLabel, money, todayISO } from "../lib/accounting";
import { Button, Card, Empty, Field, Modal, PageHead, Search, Stat, StatusPill } from "../components/UI";

function JournalForm({ onClose }) {
  const { state, role, postJournal } = useApp();
  const [date, setDate] = useState(state.period.end);
  const [description, setDescription] = useState("");
  const [debitCode, setDebitCode] = useState("5050");
  const [creditCode, setCreditCode] = useState("1045");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");

  const submit = (event) => {
    event.preventDefault();
    setError("");
    const result = postJournal({
      date,
      description: description || "Manual journal adjustment",
      debitCode,
      creditCode,
      amount,
    });
    if (!result.ok) return setError(result.error);
    onClose();
  };

  return (
    <form className="form" onSubmit={submit}>
      <div className="form-grid">
        <Field label="Date">
          <input type="date" value={date} min={state.period.start} max={state.period.end} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label="Amount (₦)">
          <input type="number" min="1" step="1" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} required />
        </Field>
        <Field label="Debit account">
          <select value={debitCode} onChange={(e) => setDebitCode(e.target.value)}>
            {state.accounts.map((a) => (
              <option key={a.code} value={a.code}>{a.code} · {a.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Credit account">
          <select value={creditCode} onChange={(e) => setCreditCode(e.target.value)}>
            {state.accounts.map((a) => (
              <option key={a.code} value={a.code}>{a.code} · {a.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Explanation" className="full">
          <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Depreciation for November 2026" />
        </Field>
      </div>

      <div className="journal-preview">
        <div><span>Debit</span><strong>{debitCode} · {state.accounts.find((a) => a.code === debitCode)?.name}</strong></div>
        <div><span>Credit</span><strong>{creditCode} · {state.accounts.find((a) => a.code === creditCode)?.name}</strong></div>
        <div><span>Totals</span><strong>{money(Number(amount) || 0)} = {money(Number(amount) || 0)}</strong></div>
      </div>
      <div className="form-note">The journal posts immediately because it is prepared by an authorised accountant. The entry remains visible in the audit trail.</div>
      {error ? <div className="form-error">{error}</div> : null}
      <div className="form-actions">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button type="submit" icon="check" disabled={!role.canCreate}>Post journal</Button>
      </div>
    </form>
  );
}

export default function Journals() {
  const { state, role } = useApp();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [detail, setDetail] = useState(null);
  const accounts = accountMap(state);

  const journals = useMemo(
    () =>
      state.transactions
        .filter((t) => t.kind === "journal")
        .filter((t) => `${t.ref} ${t.description}`.toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) => b.date.localeCompare(a.date) || b.ref.localeCompare(a.ref)),
    [state.transactions, search],
  );
  const total = journals.reduce((sum, t) => sum + t.amount, 0);

  return (
    <>
      <PageHead
        kicker="Adjustments"
        title="Journal entries"
        subtitle="Accruals, prepayments, depreciation and corrections — always balanced"
        actions={
          role.canCreate ? (
            <Button icon="plus" onClick={() => setOpen(true)} disabled={state.period.locked}>New journal</Button>
          ) : null
        }
      />

      <div className="stat-grid">
        <Stat label="Journals posted" value={String(journals.length)} hint="This period and prior" />
        <Stat label="Value posted" value={money(total)} hint="Adjustment lines" />
        <Stat label="Last journal" value={journals[0]?.ref || "—"} hint={journals[0] ? dateLabel(journals[0].date) : "—"} />
      </div>

      <Card
        title="Journal register"
        subtitle="Each entry carries a debit and a credit of equal value"
        action={<Search value={search} onChange={setSearch} placeholder="Search journal or explanation" />}
      >
        {journals.length === 0 ? (
          <Empty title="No journals yet" text="Post an adjustment to correct or accrue an amount." />
        ) : (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Reference</th>
                  <th>Explanation</th>
                  <th>Debit</th>
                  <th>Credit</th>
                  <th className="num">Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {journals.map((tx) => {
                  const debit = tx.lines.find((l) => l.debit);
                  const credit = tx.lines.find((l) => l.credit);
                  return (
                    <tr key={tx.id} className="clickable" onClick={() => setDetail(tx)}>
                      <td className="muted">{dateLabel(tx.date)}</td>
                      <td className="mono">{tx.ref}</td>
                      <td className="strong">{tx.description}</td>
                      <td className="muted">{debit ? `${debit.code} · ${accounts[debit.code]?.name}` : "—"}</td>
                      <td className="muted">{credit ? `${credit.code} · ${accounts[credit.code]?.name}` : "—"}</td>
                      <td className="num strong">{money(tx.amount)}</td>
                      <td><StatusPill status={tx.status} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {open ? (
        <Modal title="New journal entry" subtitle="The debit and credit must be equal before posting" onClose={() => setOpen(false)} wide>
          <JournalForm onClose={() => setOpen(false)} />
        </Modal>
      ) : null}

      {detail ? (
        <Modal title={detail.ref} subtitle={detail.description} onClose={() => setDetail(null)}>
          <div className="detail-grid">
            <div><span>Date</span><strong>{dateLabel(detail.date)}</strong></div>
            <div><span>Prepared by</span><strong>{detail.createdBy}</strong></div>
            <div><span>Amount</span><strong>{money(detail.amount)}</strong></div>
            <div><span>Status</span><strong><StatusPill status={detail.status} /></strong></div>
          </div>
          <div className="table-wrap">
            <table className="data compact">
              <thead><tr><th>Account</th><th>Name</th><th className="num">Debit</th><th className="num">Credit</th></tr></thead>
              <tbody>
                {detail.lines.map((line, index) => (
                  <tr key={index}>
                    <td className="mono">{line.code}</td>
                    <td>{accounts[line.code]?.name}</td>
                    <td className="num">{line.debit ? money(line.debit) : "—"}</td>
                    <td className="num">{line.credit ? money(line.credit) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Modal>
      ) : null}
    </>
  );
}

