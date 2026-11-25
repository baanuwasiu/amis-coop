import { useMemo, useState } from "react";
import { useApp } from "../lib/store";
import { Button, Card, PageHead, Search, Stat, StatusPill } from "../components/UI";

function timeLabel(at) {
  const d = new Date(at);
  return d.toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function Audit() {
  const { state, role, resolveException } = useApp();
  const [search, setSearch] = useState("");
  const [action, setAction] = useState("all");
  const actions = useMemo(() => ["all", ...new Set(state.audit.map((a) => a.action))], [state.audit]);

  const rows = state.audit
    .filter((a) => action === "all" || a.action === action)
    .filter((a) => `${a.user} ${a.role} ${a.action} ${a.object} ${a.detail}`.toLowerCase().includes(search.toLowerCase()));

  const open = state.exceptions.filter((e) => e.status !== "Resolved").length;

  return (
    <>
      <PageHead
        kicker="Assurance"
        title="Audit & compliance"
        subtitle="Who created, edited, approved or posted each transaction"
        actions={<Search value={search} onChange={setSearch} placeholder="Search user, reference or action" />}
      />

      <div className="stat-grid">
        <Stat label="Audit events" value={String(state.audit.length)} hint="This demo session and seed" />
        <Stat label="Open exceptions" value={String(open)} hint="Requires follow-up" tone={open ? "warning" : "positive"} />
        <Stat label="Actor roles" value={String(new Set(state.audit.map((a) => a.role)).size)} hint="Named users only" />
      </div>

      <div className="grid-two">
        <Card title="Audit trail" subtitle="Append-only record of activity">
          <div className="filter-row">
            {actions.map((a) => (
              <button key={a} className={`chip-filter ${action === a ? "active" : ""}`} onClick={() => setAction(a)}>
                {a === "all" ? "All activity" : a}
              </button>
            ))}
          </div>
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>User</th>
                  <th>Action</th>
                  <th>Object</th>
                  <th>Detail</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((event) => (
                  <tr key={event.id}>
                    <td className="muted nowrap">{timeLabel(event.at)}</td>
                    <td>
                      <div className="strong">{event.user}</div>
                      <div className="muted small">{event.role}</div>
                    </td>
                    <td><span className="action-tag">{event.action}</span></td>
                    <td className="mono">{event.object}</td>
                    <td className="muted">{event.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="Exceptions" subtitle="Items flagged for review or resolution">
          <div className="exception-list">
            {state.exceptions.map((item) => (
              <div className="exception" key={item.id}>
                <span className="exception-icon"><span className="mono">{item.id}</span></span>
                <div>
                  <div className="strong">{item.title}</div>
                  <div className="muted small">{item.detail}</div>
                  <div className="muted small">Owner: {item.owner}</div>
                </div>
                <div className="exception-side">
                  <StatusPill status={item.status} />
                  {item.status !== "Resolved" && role.canApprove ? (
                    <Button size="sm" variant="ghost" onClick={() => resolveException(item.id)}>Resolve</Button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <p className="note">
        Auditors have read-only access. Every approval, rejection and period lock is recorded against a named user; the trail cannot be edited from the interface.
      </p>
    </>
  );
}
