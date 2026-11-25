import { useApp } from "../lib/store";
import { ROLES } from "../data/seed";
import { Button, Card, PageHead, Stat, StatusPill } from "../components/UI";

const PERMISSIONS = [
  ["Create receipts and payments", "canCreate"],
  ["Approve and post entries", "canApprove"],
  ["Manage assets and inventory", "canManage"],
  ["Lock or reopen the period", "canClose"],
];

export default function Team() {
  const { state, role, exportData, resetDemo } = useApp();

  return (
    <>
      <PageHead
        kicker="Administration"
        title="Team & access"
        subtitle="Named users, least-privilege roles and a recoverable demo dataset"
        actions={<Button variant="secondary" icon="download" onClick={exportData}>Export backup</Button>}
      />

      <div className="stat-grid">
        <Stat label="Users" value={String(state.users.length)} hint="Named accounts" />
        <Stat label="Roles" value={String(Object.keys(ROLES).length)} hint="Finance, accountant, treasurer, auditor" />
        <Stat label="Last backup" value="Today, 02:00" hint="Nightly demo export" tone="positive" />
      </div>

      <div className="grid-two">
        <Card title="Users" subtitle="Every action is attributable to a named user">
          <div className="table-wrap">
            <table className="data">
              <thead><tr><th>User</th><th>Role</th><th>Access</th><th>Last active</th></tr></thead>
              <tbody>
                {state.users.map((user) => (
                  <tr key={user.username}>
                    <td>
                      <div className="strong">{user.name}</div>
                      <div className="muted small mono">{user.username}</div>
                    </td>
                    <td><span className="action-tag">{ROLES[user.role].label}</span></td>
                    <td className="muted">{ROLES[user.role].access}</td>
                    <td className="muted">{user.lastActive}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="note">Demo password for every account: <span className="mono">demo1234</span>. The top-bar user switch changes the active role for the walkthrough.</p>
        </Card>

        <Card title="Data & recovery" subtitle="Frontend-only demo — data lives in this browser">
          <div className="data-tools">
            <div>
              <strong>Export a full backup</strong>
              <p>Download the demo dataset as JSON: accounts, members, transactions, assets, inventory and audit trail.</p>
              <Button variant="secondary" icon="download" onClick={exportData}>Download JSON</Button>
            </div>
            <div>
              <strong>Restore the sample data</strong>
              <p>Reset every module to the seeded opening position. Useful before a live walkthrough.</p>
              <Button
                variant="danger"
                icon="alert"
                onClick={() => {
                  if (window.confirm("Reset all demo data to the seeded position?")) resetDemo();
                }}
              >
                Reset demo
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <Card title="Permission matrix" subtitle="Preparation, approval, management and close are separated">
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Capability</th>
                {Object.values(ROLES).map((r) => <th key={r.key}>{r.label}</th>)}
              </tr>
            </thead>
            <tbody>
              {PERMISSIONS.map(([label, key]) => (
                <tr key={key}>
                  <td className="strong">{label}</td>
                  {Object.values(ROLES).map((r) => (
                    <td key={r.key}>
                      {r[key] ? <span className="yes">Allowed</span> : <span className="no">—</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="role-note">
          <StatusPill status="Active">{role.label}</StatusPill>
          <span>You are currently viewing as {role.label}. Switch users from the top bar to test approvals and read-only access.</span>
        </div>
      </Card>
    </>
  );
}
