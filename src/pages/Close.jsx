import { useMemo } from "react";
import { useApp } from "../lib/store";
import { money, trialBalance } from "../lib/accounting";
import { Button, Card, PageHead, Stat, StatusPill } from "../components/UI";
import Icon from "../components/Icon";

export default function Close() {
  const { state, role, toggleCloseTask, lockPeriod, unlockPeriod } = useApp();
  const tb = useMemo(() => trialBalance(state), [state]);
  const pending = state.transactions.filter((t) => t.status === "pending").length;
  const exceptions = state.exceptions.filter((e) => e.status !== "Resolved").length;
  const done = state.closeTasks.filter((t) => t.status === "done").length;
  const ready = tb.balanced && pending === 0 && exceptions === 0;

  return (
    <>
      <PageHead
        kicker="Period control"
        title="Month-end close"
        subtitle={`${state.period.label} · reconcile, review, approve and lock`}
        actions={
          state.period.locked ? (
            role.canClose ? (
              <Button variant="secondary" icon="close" onClick={() => unlockPeriod()}>Reopen period</Button>
            ) : null
          ) : role.canClose ? (
            <Button icon="close" onClick={() => lockPeriod()}>
              Lock period
            </Button>
          ) : (
            <span className="muted small">Treasurer locks the period</span>
          )
        }
      />

      {state.period.locked ? (
        <div className="banner banner-lock">
          <Icon name="close" size={16} />
          <div>
            <strong>{state.period.label} is locked.</strong>
            <span> New transactions and journals are blocked until the Treasurer reopens the period.</span>
          </div>
        </div>
      ) : null}

      <div className="stat-grid four">
        <Stat label="Checklist" value={`${done} of ${state.closeTasks.length}`} hint="Tasks complete" tone={done === state.closeTasks.length ? "positive" : ""} />
        <Stat label="Trial balance" value={tb.balanced ? "Balanced" : "Out"} tone={tb.balanced ? "positive" : "negative"} hint={`${money(tb.debit)} = ${money(tb.credit)}`} />
        <Stat label="Pending approvals" value={String(pending)} tone={pending ? "warning" : "positive"} hint="Must be cleared before lock" />
        <Stat label="Open exceptions" value={String(exceptions)} tone={exceptions ? "warning" : "positive"} hint="Audit follow-ups" />
      </div>

      <div className="grid-two">
        <Card title="Close checklist" subtitle="Each task carries an owner and an expected evidence file">
          <div className="checklist">
            {state.closeTasks.map((task) => (
              <label key={task.id} className={`check-row ${task.status === "done" ? "done" : ""}`}>
                <input
                  type="checkbox"
                  checked={task.status === "done"}
                  disabled={!role.canManage && !role.canClose}
                  onChange={() => toggleCloseTask(task.id)}
                />
                <span className="check-box"><Icon name="check" size={13} /></span>
                <span className="check-text">
                  <strong>{task.label}</strong>
                  <small>Owner: {task.owner}</small>
                </span>
                <StatusPill status={task.status === "done" ? "done" : "pending"}>
                  {task.status === "done" ? "Done" : "Pending"}
                </StatusPill>
              </label>
            ))}
          </div>
        </Card>

        <Card title="Close readiness" subtitle="The period should not be locked until these are clear">
          <div className="readiness">
            <div className={tb.balanced ? "ready-row ok" : "ready-row bad"}>
              <Icon name={tb.balanced ? "check" : "alert"} size={16} />
              <span>Trial balance balanced</span>
              <strong>{tb.balanced ? "Yes" : "No"}</strong>
            </div>
            <div className={pending === 0 ? "ready-row ok" : "ready-row bad"}>
              <Icon name={pending === 0 ? "check" : "alert"} size={16} />
              <span>No pending approvals</span>
              <strong>{pending === 0 ? "Yes" : `${pending} open`}</strong>
            </div>
            <div className={exceptions === 0 ? "ready-row ok" : "ready-row bad"}>
              <Icon name={exceptions === 0 ? "check" : "alert"} size={16} />
              <span>Exceptions resolved</span>
              <strong>{exceptions === 0 ? "Yes" : `${exceptions} open`}</strong>
            </div>
            <div className={done === state.closeTasks.length ? "ready-row ok" : "ready-row bad"}>
              <Icon name={done === state.closeTasks.length ? "check" : "alert"} size={16} />
              <span>Checklist complete</span>
              <strong>{done}/{state.closeTasks.length}</strong>
            </div>
          </div>
          <div className={`close-callout ${ready ? "ok" : "warn"}`}>
            <strong>{ready ? "Ready to lock" : "Not ready yet"}</strong>
            <p>
              {ready
                ? "All checks pass. Locking the period keeps the books stable for reporting and audit."
                : "Clear the open items above, or lock with a documented exception if the Treasurer approves."}
            </p>
          </div>
        </Card>
      </div>

      <Card title="Period journal summary" subtitle="Posted value by transaction class">
        <div className="table-wrap">
          <table className="data">
            <thead><tr><th>Class</th><th className="num">Count</th><th className="num">Value</th></tr></thead>
            <tbody>
              {[
                ["Receipts", state.transactions.filter((t) => t.kind === "income" && t.status === "posted")],
                ["Payments", state.transactions.filter((t) => t.kind === "expense" && t.status === "posted")],
                ["Journals", state.transactions.filter((t) => t.kind === "journal" && t.status === "posted")],
              ].map(([label, list]) => (
                <tr key={label}>
                  <td className="strong">{label}</td>
                  <td className="num">{list.length}</td>
                  <td className="num">{money(list.reduce((s, t) => s + t.amount, 0))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="note">Locking is a control, not a deletion. A Treasurer can reopen with an audit reason if a correction is unavoidable.</p>
      </Card>
    </>
  );
}

