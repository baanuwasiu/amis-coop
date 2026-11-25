import { useApp } from "../lib/store";
import { ledger, incomeStatement, monthlyCash, money, shortMoney, dateLabel, balanceSheet } from "../lib/accounting";
import { Card, PageHead, Stat, Button, StatusPill, Empty } from "../components/UI";
import Icon from "../components/Icon";

function CashChart({ data }) {
  const width = 640;
  const height = 230;
  const pad = { l: 48, r: 10, t: 12, b: 30 };
  const plotW = width - pad.l - pad.r;
  const plotH = height - pad.t - pad.b;
  const max = Math.max(1, ...data.flatMap((d) => [d.inflow, d.outflow]));
  const step = Math.pow(10, Math.floor(Math.log10(max))) / 2;
  const niceMax = Math.ceil(max / step) * step;
  const group = plotW / data.length;
  const bar = Math.min(18, group * 0.26);

  return (
    <svg className="chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Monthly cash movement">
      {[0, 1, 2, 3, 4].map((i) => {
        const y = pad.t + plotH - (plotH * i) / 4;
        return (
          <g key={i}>
            <line x1={pad.l} y1={y} x2={width - pad.r} y2={y} stroke="#e6e0d0" />
            <text x={pad.l - 8} y={y + 3.5} textAnchor="end" fontSize="9.5" fill="#849188">
              {shortMoney((niceMax * i) / 4)}
            </text>
          </g>
        );
      })}
      {data.map((d, index) => {
        const x = pad.l + index * group + group / 2;
        const ih = (d.inflow / niceMax) * plotH;
        const oh = (d.outflow / niceMax) * plotH;
        return (
          <g key={d.key}>
            <rect x={x - bar - 2} y={pad.t + plotH - ih} width={bar} height={Math.max(ih, 1)} rx="2" fill="#0b5a43">
              <title>{`${d.label}: inflow ${money(d.inflow)}`}</title>
            </rect>
            <rect x={x + 2} y={pad.t + plotH - oh} width={bar} height={Math.max(oh, 1)} rx="2" fill="#c9a227">
              <title>{`${d.label}: outflow ${money(d.outflow)}`}</title>
            </rect>
            <text x={x} y={height - 9} textAnchor="middle" fontSize="10" fill="#849188">
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default function Dashboard() {
  const { state, role, approveTransaction, rejectTransaction } = useApp();
  const books = ledger(state);
  const cash = books["1020"].balance;
  const bank = books["1010"].balance;
  const savings = -books["2010"].balance;
  const loans = books["1030"].balance;
  const { surplus } = incomeStatement(state);
  const sheet = balanceSheet(state);
  const pending = state.transactions.filter((t) => t.status === "pending");
  const recent = state.transactions
    .filter((t) => t.kind !== "opening" && t.status !== "rejected")
    .sort((a, b) => b.date.localeCompare(a.date) || b.ref.localeCompare(a.ref))
    .slice(0, 6);
  const chart = monthlyCash(state, 7);
  const openExceptions = state.exceptions.filter((e) => e.status !== "Resolved").length;

  const go = (page) => {
    window.location.hash = `#/${page}`;
  };

  return (
    <>
      <PageHead
        kicker="Financial control centre"
        title="Cooperative overview"
        subtitle={`AMIS Cooperative · ${state.period.label} · figures in Naira`}
        actions={
          <>
            <Button variant="secondary" icon="check" onClick={() => go("transactions")}>
              Review approvals
            </Button>
            <Button icon="plus" onClick={() => go("transactions")} disabled={!role.canCreate || state.period.locked}>
              New entry
            </Button>
          </>
        }
      />

      <div className="stat-grid five">
        <Stat label="Bank balance" value={money(bank)} hint="Account 1010" onClick={() => go("ledger")} />
        <Stat label="Cash at hand" value={money(cash)} hint="Account 1020" onClick={() => go("ledger")} />
        <Stat label="Member savings" value={money(savings)} hint="Member control account" onClick={() => go("members")} />
        <Stat label="Loans receivable" value={money(loans)} hint="Principal outstanding" onClick={() => go("ledger")} />
        <Stat
          label="Period surplus"
          value={money(surplus)}
          hint={sheet.balanced ? "Books balanced" : "Check ledger"}
          tone={surplus >= 0 ? "positive" : "negative"}
          onClick={() => go("reports")}
        />
      </div>

      <div className="grid-main">
        <Card
          title="Monthly cash movement"
          subtitle="Bank and cash accounts · last seven months"
          action={
            <div className="legend">
              <span><i className="dot green" /> Inflow</span>
              <span><i className="dot gold" /> Outflow</span>
            </div>
          }
        >
          <CashChart data={chart} />
        </Card>

        <Card
          title="Pending approvals"
          subtitle={`${pending.length} transaction${pending.length === 1 ? "" : "s"} waiting`}
          action={<button className="link" onClick={() => go("transactions")}>View all</button>}
        >
          {pending.length === 0 ? (
            <Empty title="Nothing waiting" text="All transactions have been reviewed." />
          ) : (
            <div className="approval-list">
              {pending.slice(0, 3).map((tx) => (
                <div className="approval" key={tx.id}>
                  <div className="approval-top">
                    <span className="mono">{tx.ref}</span>
                    <strong>{money(tx.amount)}</strong>
                  </div>
                  <div className="approval-desc">{tx.description}</div>
                  <div className="approval-meta">
                    <span>{dateLabel(tx.date)}</span>
                    <span>{tx.createdBy}</span>
                  </div>
                  {role.canApprove ? (
                    <div className="approval-actions">
                      <button className="btn btn-sm btn-primary" onClick={() => approveTransaction(tx.id)}>
                        Approve
                      </button>
                      <button className="btn btn-sm btn-ghost" onClick={() => rejectTransaction(tx.id)}>
                        Reject
                      </button>
                    </div>
                  ) : (
                    <span className="muted small">Awaiting approver</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="grid-two">
        <Card title="Recent activity" subtitle="Latest posted and pending entries" action={<button className="link" onClick={() => go("transactions")}>Transactions</button>}>
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Reference</th>
                  <th>Description</th>
                  <th className="num">Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((tx) => (
                  <tr key={tx.id} onClick={() => go("transactions")} className="clickable">
                    <td className="muted">{dateLabel(tx.date)}</td>
                    <td className="mono">{tx.ref}</td>
                    <td>
                      <div className="strong">{tx.description}</div>
                      <div className="muted small">{tx.memberName || tx.party}</div>
                    </td>
                    <td className="num strong">{money(tx.amount)}</td>
                    <td><StatusPill status={tx.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card
          title="Exceptions"
          subtitle={`${openExceptions} open item${openExceptions === 1 ? "" : "s"}`}
          action={<button className="link" onClick={() => go("audit")}>Audit</button>}
        >
          <div className="exception-list">
            {state.exceptions.slice(0, 3).map((item) => (
              <div className="exception" key={item.id}>
                <span className="exception-icon"><Icon name="alert" size={15} /></span>
                <div>
                  <div className="strong">{item.title}</div>
                  <div className="muted small">{item.id} · {item.owner}</div>
                </div>
                <StatusPill status={item.status} />
              </div>
            ))}
          </div>
          <div className={`balance-note ${sheet.balanced ? "ok" : "bad"}`}>
            <Icon name={sheet.balanced ? "check" : "alert"} size={15} />
            {sheet.balanced
              ? `Assets ${money(sheet.assets)} = liabilities + funds`
              : `Balance sheet out by ${money(sheet.difference)}`}
          </div>
        </Card>
      </div>
    </>
  );
}
