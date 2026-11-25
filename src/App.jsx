import { useEffect, useState } from "react";
import { useApp } from "./lib/store";
import { ROLES, DEMO_PASSWORD } from "./data/seed";
import Icon from "./components/Icon";
import { Modal, Toast } from "./components/UI";
import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import Journals from "./pages/Journals";
import Members from "./pages/Members";
import Ledger from "./pages/Ledger";
import TrialBalance from "./pages/TrialBalance";
import Reports from "./pages/Reports";
import Assets from "./pages/Assets";
import Inventory from "./pages/Inventory";
import Audit from "./pages/Audit";
import Close from "./pages/Close";
import Team from "./pages/Team";

const PAGES = {
  dashboard: { title: "Dashboard", component: Dashboard },
  transactions: { title: "Transactions", component: Transactions },
  journals: { title: "Journals", component: Journals },
  members: { title: "Member ledgers", component: Members },
  ledger: { title: "General ledger", component: Ledger },
  trial: { title: "Trial balance", component: TrialBalance },
  reports: { title: "Reports", component: Reports },
  assets: { title: "Fixed assets", component: Assets },
  inventory: { title: "Inventory", component: Inventory },
  audit: { title: "Audit & compliance", component: Audit },
  close: { title: "Period close", component: Close },
  team: { title: "Team & access", component: Team },
};

const NAV = [
  { label: "Overview", items: [{ key: "dashboard", label: "Dashboard", icon: "dashboard" }] },
  {
    label: "Money",
    items: [
      { key: "transactions", label: "Transactions", icon: "transactions" },
      { key: "journals", label: "Journal entries", icon: "journal" },
      { key: "members", label: "Member ledgers", icon: "members" },
    ],
  },
  {
    label: "Books",
    items: [
      { key: "ledger", label: "General ledger", icon: "ledger" },
      { key: "trial", label: "Trial balance", icon: "trial" },
      { key: "reports", label: "Reports", icon: "reports" },
    ],
  },
  {
    label: "Control",
    items: [
      { key: "assets", label: "Fixed assets", icon: "assets" },
      { key: "inventory", label: "Inventory", icon: "inventory" },
      { key: "audit", label: "Audit & compliance", icon: "audit" },
      { key: "close", label: "Period close", icon: "close" },
    ],
  },
  { label: "Admin", items: [{ key: "team", label: "Team & access", icon: "team" }] },
];

function currentPage() {
  const value = window.location.hash.replace(/^#\/?/, "").split("?")[0];
  return PAGES[value] ? value : "dashboard";
}

function Login() {
  const { state, login } = useApp();
  const [username, setUsername] = useState("accountant");
  const [password, setPassword] = useState(DEMO_PASSWORD);
  const [error, setError] = useState("");

  const submit = (event) => {
    event.preventDefault();
    const result = login(username, password);
    if (!result.ok) return setError(result.error);
    window.location.hash = "#/dashboard";
    return null;
  };

  return (
    <div className="login-page">
      <section className="login-brand">
        <div className="login-brand-top">
          <div className="brand-mark large">AF</div>
          <div>
            <div className="login-kicker">AMIS COOPERATIVE</div>
            <div className="login-product">Finance Desk</div>
          </div>
        </div>
        <h1>One book for member savings, loans and the cooperative’s own funds.</h1>
        <p>
          A controlled flow from daily receipts to a trial balance and financial statements — with member ledgers,
          asset control and an audit trail built in.
        </p>
        <ul className="login-points">
          <li><Icon name="check" size={15} /> Member savings, shares and loan accounts</li>
          <li><Icon name="check" size={15} /> Receipts, payments, journals and approvals</li>
          <li><Icon name="check" size={15} /> Trial balance, statements and audit evidence</li>
        </ul>
        <div className="login-foot">Concept demo · sample data only · frontend prototype</div>
      </section>

      <section className="login-panel">
        <div className="login-card">
          <div className="login-card-head">
            <div className="eyebrow">Secure sign-in</div>
            <h2>Welcome back</h2>
            <p>Use a demo account to explore the finance desk.</p>
          </div>
          <form onSubmit={submit}>
            <label className="field">
              <span>Username</span>
              <input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" />
            </label>
            <label className="field">
              <span>Password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
              />
            </label>
            {error ? <div className="form-error">{error}</div> : null}
            <button className="btn btn-primary login-submit" type="submit">
              <Icon name="close" size={16} /> Sign in
            </button>
          </form>

          <div className="demo-divider"><span>Demo accounts</span></div>
          <div className="demo-accounts">
            {state.users.map((user) => (
              <button
                key={user.username}
                className={`demo-account ${username === user.username ? "active" : ""}`}
                onClick={() => {
                  setUsername(user.username);
                  setPassword(DEMO_PASSWORD);
                  setError("");
                }}
              >
                <span className="demo-avatar">{user.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}</span>
                <span>
                  <strong>{ROLES[user.role].label}</strong>
                  <small>{user.name} · {user.username}</small>
                </span>
              </button>
            ))}
          </div>
          <p className="login-hint">Password for all demo accounts: <span className="mono">{DEMO_PASSWORD}</span></p>
        </div>
      </section>
    </div>
  );
}

function Shell() {
  const { state, user, role, toast, logout, switchUser } = useApp();
  const [page, setPage] = useState(currentPage);
  const [menuOpen, setMenuOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);

  useEffect(() => {
    const onHash = () => setPage(currentPage());
    window.addEventListener("hashchange", onHash);
    if (!window.location.hash) window.location.hash = "#/dashboard";
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const navigate = (key) => {
    window.location.hash = `#/${key}`;
    setPage(key);
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const Current = PAGES[page]?.component || Dashboard;

  return (
    <div className="app">
      <aside className={`sidebar ${menuOpen ? "open" : ""}`}>
        <div className="brand">
          <div className="brand-mark">AF</div>
          <div>
            <div className="brand-name">AMIS <span>Cooperative</span></div>
            <div className="brand-sub">Finance Desk</div>
          </div>
        </div>

        <div className="sidebar-period">
          <span>Current period</span>
          <strong>{state.period.label}</strong>
          <em>{state.period.locked ? "Locked" : "Open for posting"}</em>
        </div>

        <nav>
          {NAV.map((group) => (
            <div className="nav-group" key={group.label}>
              <div className="nav-label">{group.label}</div>
              {group.items.map((item) => (
                <button
                  key={item.key}
                  className={`nav-link ${page === item.key ? "active" : ""}`}
                  onClick={() => navigate(item.key)}
                >
                  <Icon name={item.icon} size={17} />
                  <span>{item.label}</span>
                  {item.key === "transactions" && state.transactions.some((t) => t.status === "pending") ? (
                    <span className="nav-badge">
                      {state.transactions.filter((t) => t.status === "pending").length}
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-foot">
          <div className="user-card">
            <span className="avatar">{user.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}</span>
            <div>
              <strong>{user.name}</strong>
              <span>{role.label}</span>
            </div>
          </div>
          <button className="nav-link logout" onClick={logout}>
            <Icon name="logout" size={17} /> Sign out
          </button>
          <button className="nav-link guide-link" onClick={() => setGuideOpen(true)}>
            <Icon name="reports" size={17} /> Demo guide
          </button>
          <p className="demo-note">Demo data only. No live member, bank or accounting records.</p>
        </div>
      </aside>

      <div className="shell">
        <header className="topbar">
          <button className="icon-btn mobile-menu" onClick={() => setMenuOpen((v) => !v)} aria-label="Menu">
            <Icon name="menu" />
          </button>
          <div className="topbar-title">
            <span>{PAGES[page]?.title || "Dashboard"}</span>
            <small>{state.period.label} · AMIS Cooperative</small>
          </div>
          <div className="topbar-right">
            <span className="top-chip">{role.canApprove ? "Approver access" : role.canCreate ? "Data entry" : "Read only"}</span>
            <select
              className="user-switch"
              value={user.username}
              onChange={(event) => switchUser(event.target.value)}
              title="Switch demo user"
            >
              {state.users.map((u) => (
                <option key={u.username} value={u.username}>{u.name} · {ROLES[u.role].label}</option>
              ))}
            </select>
            <span className="top-avatar">{user.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}</span>
          </div>
        </header>

        {role.key === "auditor" ? (
          <div className="readonly-banner">
            <Icon name="audit" size={15} /> Read-only auditor view. You can inspect every book and the audit trail, but cannot post.
          </div>
        ) : null}

        <main>
          <Current />
        </main>
      </div>

      <Toast toast={toast} />
      {guideOpen ? (
        <Modal title="Five-minute walkthrough" subtitle="A suggested path through the finance desk" onClose={() => setGuideOpen(false)} wide>
          <ol className="guide-list">
            <li><strong>Sign in as the Accountant.</strong> The dashboard shows the cooperative’s bank, cash, member savings, loans and the period surplus.</li>
            <li><strong>Approve a pending item.</strong> Use the Approve button on the dashboard, then open Transactions to see it posted.</li>
            <li><strong>Record a receipt.</strong> Choose Income → Record receipt, select a member and “Monthly savings”, and submit. It waits for approval; approve it, then open Member ledgers to see the balance move.</li>
            <li><strong>Post a journal.</strong> Use Journal entries → New journal (for example, depreciation). The trial balance stays balanced.</li>
            <li><strong>Show the controls.</strong> Depreciate a fixed asset, issue stock, then open Reports for income &amp; expenditure and financial position.</li>
            <li><strong>Switch user.</strong> The top-bar user switch changes the role. As Treasurer, lock the period; as Auditor, the whole app becomes read-only. “Reset demo” in Team &amp; access restores the seed data.</li>
          </ol>
          <div className="form-note">Everything is local to this browser. No live member, bank or accounting record is connected.</div>
        </Modal>
      ) : null}
      {menuOpen ? <button className="sidebar-scrim" onClick={() => setMenuOpen(false)} aria-label="Close menu" /> : null}
    </div>
  );
}

export default function App() {
  const { user } = useApp();
  return user ? <Shell /> : <Login />;
}
