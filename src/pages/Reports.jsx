import { useMemo, useState } from "react";
import { useApp } from "../lib/store";
import { balanceSheet, incomeStatement, ledger, money } from "../lib/accounting";
import { Button, Card, PageHead, Stat, Tabs, printDocument } from "../components/UI";
import Icon from "../components/Icon";

export default function Reports() {
  const { state } = useApp();
  const [tab, setTab] = useState("ie");
  const books = useMemo(() => ledger(state), [state]);
  const ie = useMemo(() => incomeStatement(state), [state]);
  const sheet = useMemo(() => balanceSheet(state), [state]);

  const assetRows = Object.values(books).filter((r) => r.type === "asset" && Math.abs(r.balance) > 0.5);
  const liabilityRows = Object.values(books).filter((r) => r.type === "liability" && Math.abs(r.balance) > 0.5);
  const fundRows = Object.values(books).filter((r) => r.type === "equity" && Math.abs(r.balance) > 0.5);

  const printIE = () => {
    const body = `
      <div class="head"><h1>AMIS Cooperative</h1><p>Statement of income and expenditure · ${state.period.label}</p></div>
      <table><thead><tr><th>Income</th><th class="r">₦</th></tr></thead><tbody>
      ${ie.incomeRows.map((r) => `<tr><td>${r.name}</td><td class="r">${money(r.amount)}</td></tr>`).join("")}
      <tr><td><strong>Total income</strong></td><td class="r"><strong>${money(ie.totalIncome)}</strong></td></tr></tbody></table>
      <table><thead><tr><th>Expenditure</th><th class="r">₦</th></tr></thead><tbody>
      ${ie.expenseRows.map((r) => `<tr><td>${r.name}</td><td class="r">${money(r.amount)}</td></tr>`).join("")}
      <tr><td><strong>Total expenditure</strong></td><td class="r"><strong>${money(ie.totalExpense)}</strong></td></tr></tbody></table>
      <table><tbody><tr><td><strong>${ie.surplus >= 0 ? "Surplus" : "Deficit"} for the period</strong></td><td class="r"><strong>${money(ie.surplus)}</strong></td></tr></tbody></table>`;
    printDocument(`Income and expenditure — ${state.period.label}`, body);
  };

  const printFS = () => {
    const body = `
      <div class="head"><h1>AMIS Cooperative</h1><p>Statement of financial position · ${state.period.label}</p></div>
      <table><thead><tr><th>Assets</th><th class="r">₦</th></tr></thead><tbody>
      ${assetRows.map((r) => `<tr><td>${r.name}</td><td class="r">${money(r.balance)}</td></tr>`).join("")}
      <tr><td><strong>Total assets</strong></td><td class="r"><strong>${money(sheet.assets)}</strong></td></tr></tbody></table>
      <table><thead><tr><th>Liabilities</th><th class="r">₦</th></tr></thead><tbody>
      ${liabilityRows.map((r) => `<tr><td>${r.name}</td><td class="r">${money(-r.balance)}</td></tr>`).join("")}
      <tr><td><strong>Total liabilities</strong></td><td class="r"><strong>${money(sheet.liabilities)}</strong></td></tr></tbody></table>
      <table><thead><tr><th>Members' funds</th><th class="r">₦</th></tr></thead><tbody>
      ${fundRows.map((r) => `<tr><td>${r.name}</td><td class="r">${money(-r.balance)}</td></tr>`).join("")}
      <tr><td>Results to date</td><td class="r">${money(sheet.pnl)}</td></tr>
      <tr><td><strong>Total members' funds</strong></td><td class="r"><strong>${money(sheet.funds)}</strong></td></tr></tbody></table>
      <p><strong>Assets ${money(sheet.assets)} = Liabilities ${money(sheet.liabilities)} + Funds ${money(sheet.funds)}</strong></p>`;
    printDocument(`Financial position — ${state.period.label}`, body);
  };

  return (
    <>
      <PageHead
        kicker="Financial statements"
        title="Reports"
        subtitle={`${state.period.label} · prepared from the posted ledger`}
        actions={<Button variant="secondary" icon="printer" onClick={tab === "ie" ? printIE : printFS}>Print statement</Button>}
      />

      <div className="stat-grid four">
        <Stat label="Total income" value={money(ie.totalIncome)} hint="For the period" />
        <Stat label="Total expenditure" value={money(ie.totalExpense)} hint="For the period" />
        <Stat label="Surplus" value={money(ie.surplus)} tone={ie.surplus >= 0 ? "positive" : "negative"} hint={`${ie.totalIncome ? ((ie.surplus / ie.totalIncome) * 100).toFixed(1) : "0.0"}% margin`} />
        <Stat label="Balance sheet" value={sheet.balanced ? "Balanced" : "Out"} tone={sheet.balanced ? "positive" : "negative"} hint="Assets = liabilities + funds" />
      </div>

      <Card>
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { key: "ie", label: "Income & expenditure" },
            { key: "fp", label: "Financial position" },
          ]}
        />

        {tab === "ie" ? (
          <div className="statement">
            <div className="statement-head">
              <h2>Statement of income and expenditure</h2>
              <p>AMIS Cooperative · {state.period.label} · amounts in Naira</p>
            </div>
            <table className="statement-table">
              <thead><tr><th>Income</th><th className="num">₦</th></tr></thead>
              <tbody>
                {ie.incomeRows.map((r) => (
                  <tr key={r.name}><td>{r.name}</td><td className="num">{money(r.amount)}</td></tr>
                ))}
                <tr className="total"><td>Total income</td><td className="num">{money(ie.totalIncome)}</td></tr>
              </tbody>
            </table>
            <table className="statement-table">
              <thead><tr><th>Expenditure</th><th className="num">₦</th></tr></thead>
              <tbody>
                {ie.expenseRows.map((r) => (
                  <tr key={r.name}><td>{r.name}</td><td className="num">{money(r.amount)}</td></tr>
                ))}
                <tr className="total"><td>Total expenditure</td><td className="num">{money(ie.totalExpense)}</td></tr>
              </tbody>
            </table>
            <div className={`statement-result ${ie.surplus >= 0 ? "positive" : "negative"}`}>
              <span>{ie.surplus >= 0 ? "Surplus for the period" : "Deficit for the period"}</span>
              <strong>{money(ie.surplus)}</strong>
            </div>
            <p className="note">Cash basis, prepared from approved receipts and payment vouchers posted to the general ledger.</p>
          </div>
        ) : (
          <div className="statement">
            <div className="statement-head">
              <h2>Statement of financial position</h2>
              <p>AMIS Cooperative · as at {state.period.end} · amounts in Naira</p>
            </div>
            <table className="statement-table">
              <thead><tr><th>Assets</th><th className="num">₦</th></tr></thead>
              <tbody>
                {assetRows.map((r) => (
                  <tr key={r.code}><td>{r.name}</td><td className="num">{money(r.balance)}</td></tr>
                ))}
                <tr className="total"><td>Total assets</td><td className="num">{money(sheet.assets)}</td></tr>
              </tbody>
            </table>
            <table className="statement-table">
              <thead><tr><th>Liabilities</th><th className="num">₦</th></tr></thead>
              <tbody>
                {liabilityRows.map((r) => (
                  <tr key={r.code}><td>{r.name}</td><td className="num">{money(-r.balance)}</td></tr>
                ))}
                <tr className="total"><td>Total liabilities</td><td className="num">{money(sheet.liabilities)}</td></tr>
              </tbody>
            </table>
            <table className="statement-table">
              <thead><tr><th>Members’ funds</th><th className="num">₦</th></tr></thead>
              <tbody>
                {fundRows.map((r) => (
                  <tr key={r.code}><td>{r.name}</td><td className="num">{money(-r.balance)}</td></tr>
                ))}
                <tr><td>Results to date</td><td className="num">{money(sheet.pnl)}</td></tr>
                <tr className="total"><td>Total members’ funds</td><td className="num">{money(sheet.funds)}</td></tr>
              </tbody>
            </table>
            <div className={`statement-result ${sheet.balanced ? "positive" : "negative"}`}>
              <span><Icon name={sheet.balanced ? "check" : "alert"} size={15} /> Assets = liabilities + members’ funds</span>
              <strong>{money(sheet.assets)}</strong>
            </div>
            <p className="note">
              Assets are shown net of accumulated depreciation. Members’ funds include results to date before closing.
            </p>
          </div>
        )}
      </Card>
    </>
  );
}



