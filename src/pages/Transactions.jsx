import { useMemo, useState } from "react";
import { useApp } from "../lib/store";
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from "../data/seed";
import { accountMap, dateLabel, incomeStatement, money, todayISO } from "../lib/accounting";
import { Button, Card, Empty, Field, Modal, PageHead, Search, Stat, StatusPill, Tabs } from "../components/UI";

function clampDate(value, state) {
  if (value < state.period.start) return state.period.start;
  if (value > state.period.end) return state.period.end;
  return value;
}

function EntryForm({ kind, onClose }) {
  const { state, role, addTransaction } = useApp();
  const categories = kind === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const [type, setType] = useState(categories[0].key);
  const [date, setDate] = useState(clampDate(todayISO(), state));
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("Bank");
  const [memberId, setMemberId] = useState("");
  const [party, setParty] = useState("");
  const [description, setDescription] = useState("");
  const [invoice, setInvoice] = useState("");
  const [error, setError] = useState("");

  const category = categories.find((c) => c.key === type);
  const member = state.members.find((m) => m.id === memberId);

  const submit = (event) => {
    event.preventDefault();
    setError("");
    const value = Number(amount);
    if (!role.canCreate) return setError("Your role cannot create entries.");
    if (state.period.locked) return setError("The period is locked.");
    if (!(value > 0)) return setError("Enter an amount greater than zero.");
    if (category.member && !memberId) return setError("Select the member this entry belongs to.");

    const label = category.label;
    const result = addTransaction({
      kind,
      type,
      date,
      amount: value,
      method,
      memberId,
      party: party || member?.name || "",
      description: description || `${label}${member ? ` — ${member.name}` : ""}`,
      invoice,
      evidence: invoice ? `${invoice.toLowerCase()}.pdf` : "receipt.pdf",
    });
    if (!result.ok) return setError(result.error);
    onClose();
  };

  return (
    <form onSubmit={submit} className="form">
      <div className="form-grid">
        <Field label="Date">
          <input
            type="date"
            value={date}
            min={state.period.start}
            max={state.period.end}
            onChange={(event) => setDate(event.target.value)}
            required
          />
        </Field>
        <Field label={kind === "income" ? "Income type" : "Expense type"}>
          <select value={type} onChange={(event) => setType(event.target.value)}>
            {categories.map((c) => (
              <option key={c.key} value={c.key}>{c.label}</option>
            ))}
          </select>
        </Field>
        {category.member ? (
          <Field label="Member" className="full">
            <select value={memberId} onChange={(event) => setMemberId(event.target.value)} required>
              <option value="">Select member</option>
              {state.members.map((m) => (
                <option key={m.id} value={m.id}>{m.id} · {m.name}</option>
              ))}
            </select>
          </Field>
        ) : null}
        <Field label="Amount (₦)">
          <input
            type="number"
            min="1"
            step="1"
            placeholder="0.00"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            required
          />
        </Field>
        <Field label="Method">
          <select value={method} onChange={(event) => setMethod(event.target.value)}>
            <option>Bank</option>
            <option>Cash</option>
          </select>
        </Field>
        <Field label={kind === "income" ? "Received from" : "Payee"}>
          <input
            value={party}
            onChange={(event) => setParty(event.target.value)}
            placeholder={kind === "income" ? "Member or payer" : "Supplier or payee"}
          />
        </Field>
        <Field label="Invoice / reference">
          <input value={invoice} onChange={(event) => setInvoice(event.target.value)} placeholder="Optional" />
        </Field>
        <Field label="Description" className="full">
          <input
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder={`${category.label}${kind === "income" ? "" : " — purpose"}`}
          />
        </Field>
      </div>

      <div className="form-note">
        This entry will be saved as <strong>pending approval</strong>. It reaches the ledger only after the approver posts it.
      </div>
      {error ? <div className="form-error">{error}</div> : null}

      <div className="form-actions">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button type="submit" icon="check">Submit for approval</Button>
      </div>
    </form>
  );
}

export default function Transactions() {
  const { state, role, approveTransaction, rejectTransaction } = useApp();
  const [tab, setTab] = useState("income");
  const [search, setSearch] = useState("");
  const [formKind, setFormKind] = useState(null);
  const [detail, setDetail] = useState(null);
  const { totalIncome, totalExpense } = incomeStatement(state);
  const accounts = accountMap(state);

  const rows = useMemo(() => {
    let list = state.transactions.filter((t) => t.kind !== "opening");
    if (tab === "pending") list = list.filter((t) => t.status === "pending");
    else list = list.filter((t) => t.kind === tab);
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((t) =>
        [t.ref, t.description, t.party, t.memberName, t.invoice].filter(Boolean).join(" ").toLowerCase().includes(q),
      );
    }
    return list.sort((a, b) => b.date.localeCompare(a.date) || b.ref.localeCompare(a.ref));
  }, [state.transactions, tab, search]);

  const pending = state.transactions.filter((t) => t.status === "pending").length;

  return (
    <>
      <PageHead
        kicker="Daily transactions"
        title="Receipts and payments"
        subtitle={`${state.period.label} · every entry carries a reference and an approval trail`}
        actions={
          role.canCreate ? (
            <>
              <Button variant="secondary" icon="plus" onClick={() => setFormKind("expense")} disabled={state.period.locked}>
                Record payment
              </Button>
              <Button icon="plus" onClick={() => setFormKind("income")} disabled={state.period.locked}>
                Record receipt
              </Button>
            </>
          ) : null
        }
      />

      <div className="stat-grid">
        <Stat label="Receipts this period" value={money(totalIncome)} hint="Posted income" />
        <Stat label="Payments this period" value={money(totalExpense)} hint="Posted expenditure" />
        <Stat label="Pending approval" value={String(pending)} hint="Awaiting reviewer" tone={pending ? "warning" : ""} />
      </div>

      <Card
        title="Transaction register"
        subtitle="Income, expenditure and items awaiting approval"
        action={<Search value={search} onChange={setSearch} placeholder="Search reference, member or payee" />}
      >
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { key: "income", label: "Income" },
            { key: "expense", label: "Expenditure" },
            { key: "pending", label: "Pending", count: pending },
          ]}
        />

        {rows.length === 0 ? (
          <Empty title="No transactions" text="Nothing matches this view yet." />
        ) : (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Reference</th>
                  <th>Description</th>
                  <th>Member / payee</th>
                  <th>Method</th>
                  <th className="num">Amount</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map((tx) => (
                  <tr key={tx.id} className="clickable" onClick={() => setDetail(tx)}>
                    <td className="muted">{dateLabel(tx.date)}</td>
                    <td className="mono">{tx.ref}</td>
                    <td>
                      <div className="strong">{tx.description}</div>
                      <div className="muted small">{accounts[tx.lines[0]?.code]?.name || tx.type}</div>
                    </td>
                    <td className="muted">{tx.memberName || tx.party}</td>
                    <td className="muted">{tx.method}</td>
                    <td className="num strong">{money(tx.amount)}</td>
                    <td><StatusPill status={tx.status} /></td>
                    <td className="row-actions" onClick={(event) => event.stopPropagation()}>
                      {tx.status === "pending" && role.canApprove ? (
                        <>
                          <button className="btn btn-xs btn-primary" onClick={() => approveTransaction(tx.id)}>Approve</button>
                          <button className="btn btn-xs btn-ghost" onClick={() => rejectTransaction(tx.id)}>Reject</button>
                        </>
                      ) : (
                        <button className="icon-btn" onClick={() => setDetail(tx)} aria-label="View entry">
                          <span className="mono">···</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {formKind ? (
        <Modal
          title={formKind === "income" ? "Record money received" : "Record a payment"}
          subtitle="Saved as pending until an approver posts it to the ledger"
          onClose={() => setFormKind(null)}
          wide
        >
          <EntryForm kind={formKind} onClose={() => setFormKind(null)} />
        </Modal>
      ) : null}

      {detail ? (
        <Modal
          title={`${detail.ref} · ${detail.status === "pending" ? "Pending approval" : detail.status}`}
          subtitle={`${detail.description} · ${dateLabel(detail.date)}`}
          onClose={() => setDetail(null)}
          wide
          footer={
            detail.status === "pending" && role.canApprove ? (
              <>
                <Button variant="secondary" onClick={() => { rejectTransaction(detail.id); setDetail(null); }}>Reject</Button>
                <Button icon="check" onClick={() => { approveTransaction(detail.id); setDetail(null); }}>Approve & post</Button>
              </>
            ) : null
          }
        >
          <div className="detail-grid">
            <div><span>Amount</span><strong>{money(detail.amount)}</strong></div>
            <div><span>Method</span><strong>{detail.method}</strong></div>
            <div><span>Member / party</span><strong>{detail.memberName || detail.party}</strong></div>
            <div><span>Prepared by</span><strong>{detail.createdBy}</strong></div>
            <div><span>Approved by</span><strong>{detail.approvedBy || "—"}</strong></div>
            <div><span>Evidence</span><strong>{detail.evidence || "—"}</strong></div>
          </div>
          <h3 className="subhead">Double-entry postings</h3>
          <div className="table-wrap">
            <table className="data compact">
              <thead>
                <tr><th>Account</th><th>Name</th><th className="num">Debit</th><th className="num">Credit</th></tr>
              </thead>
              <tbody>
                {detail.lines.map((line, index) => (
                  <tr key={index}>
                    <td className="mono">{line.code}</td>
                    <td>{accounts[line.code]?.name || line.code}</td>
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

