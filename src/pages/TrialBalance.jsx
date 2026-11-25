import { useMemo } from "react";
import { useApp } from "../lib/store";
import { money, trialBalance, typeLabel } from "../lib/accounting";
import { Button, Card, PageHead, Stat, printDocument } from "../components/UI";
import Icon from "../components/Icon";

export default function TrialBalance() {
  const { state } = useApp();
  const tb = useMemo(() => trialBalance(state), [state]);

  const print = () => {
    const body = `
      <div class="head"><h1>AMIS Cooperative</h1><p>Trial balance · ${state.period.label}</p></div>
      <table><thead><tr><th>Code</th><th>Account</th><th>Type</th><th class="r">Debit</th><th class="r">Credit</th></tr></thead>
      <tbody>${tb.rows.map((r) => `<tr><td>${r.code}</td><td>${r.name}</td><td>${typeLabel(r.type)}</td><td class="r">${r.debit ? money(r.debit) : "—"}</td><td class="r">${r.credit ? money(r.credit) : "—"}</td></tr>`).join("")}
      <tr><td colspan="3"><strong>Total</strong></td><td class="r"><strong>${money(tb.debit)}</strong></td><td class="r"><strong>${money(tb.credit)}</strong></td></tr></tbody></table>`;
    printDocument(`Trial balance — ${state.period.label}`, body);
  };

  return (
    <>
      <PageHead
        kicker="Arithmetic check"
        title="Trial balance"
        subtitle={`${state.period.label} · extracted from the posted general ledger`}
        actions={<Button variant="secondary" icon="printer" onClick={print}>Print</Button>}
      />

      <div className="stat-grid">
        <Stat label="Total debits" value={money(tb.debit)} hint={`${tb.rows.length} accounts`} />
        <Stat label="Total credits" value={money(tb.credit)} hint="Should equal debits" />
        <Stat
          label="Status"
          value={tb.balanced ? "Balanced" : "Out of balance"}
          hint={tb.balanced ? "Debits equal credits" : `Difference ${money(tb.debit - tb.credit)}`}
          tone={tb.balanced ? "positive" : "negative"}
        />
      </div>

      <Card
        title="Trial balance extract"
        subtitle="Every account with a non-zero balance at the period end"
        action={
          <span className={`balance-pill ${tb.balanced ? "ok" : "bad"}`}>
            <Icon name={tb.balanced ? "check" : "alert"} size={14} />
            {tb.balanced ? "Balanced" : "Check postings"}
          </span>
        }
      >
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Code</th>
                <th>Account</th>
                <th>Type</th>
                <th className="num">Debit</th>
                <th className="num">Credit</th>
              </tr>
            </thead>
            <tbody>
              {tb.rows.map((row) => (
                <tr key={row.code}>
                  <td className="mono">{row.code}</td>
                  <td className="strong">{row.name}</td>
                  <td className="muted">{typeLabel(row.type)}</td>
                  <td className="num">{row.debit ? money(row.debit) : "—"}</td>
                  <td className="num">{row.credit ? money(row.credit) : "—"}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3} className="strong">Total</td>
                <td className="num strong">{money(tb.debit)}</td>
                <td className="num strong">{money(tb.credit)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
        <p className="note">
          A balanced trial balance confirms the arithmetic, not the completeness of the records. Review the audit exceptions before closing the period.
        </p>
      </Card>
    </>
  );
}
