import { useEffect } from "react";
import Icon from "./Icon";

export function Button({ variant = "primary", size = "md", icon, children, className = "", ...props }) {
  return (
    <button className={`btn btn-${variant} btn-${size} ${className}`} type="button" {...props}>
      {icon ? <Icon name={icon} size={size === "sm" ? 14 : 16} /> : null}
      {children}
    </button>
  );
}

export function PageHead({ kicker, title, subtitle, actions }) {
  return (
    <div className="page-head">
      <div>
        {kicker ? <div className="eyebrow">{kicker}</div> : null}
        <h1>{title}</h1>
        {subtitle ? <p className="sub">{subtitle}</p> : null}
      </div>
      {actions ? <div className="head-actions">{actions}</div> : null}
    </div>
  );
}

export function Card({ title, subtitle, action, children, className = "", padded = true }) {
  return (
    <section className={`card ${className}`}>
      {title || action ? (
        <div className="card-head">
          <div>
            {title ? <h2 className="card-title">{title}</h2> : null}
            {subtitle ? <p className="card-sub">{subtitle}</p> : null}
          </div>
          {action ? <div className="card-action">{action}</div> : null}
        </div>
      ) : null}
      <div className={padded ? "card-body" : ""}>{children}</div>
    </section>
  );
}

const STATUS_MAP = {
  posted: "success",
  pending: "warning",
  rejected: "danger",
  done: "success",
  Open: "warning",
  Review: "info",
  Resolved: "success",
  Active: "success",
  Locked: "danger",
  Open_period: "success",
};

export function StatusPill({ status, children }) {
  const tone = STATUS_MAP[status] || "neutral";
  return <span className={`pill pill-${tone}`}>{children || status}</span>;
}

export function Modal({ title, subtitle, onClose, children, footer, wide = false }) {
  useEffect(() => {
    const onKey = (event) => {
      if (event.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <div
        className={`modal ${wide ? "modal-wide" : ""}`}
        role="dialog"
        aria-modal="true"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-head">
          <div>
            <h2>{title}</h2>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <Icon name="x" />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer ? <div className="modal-foot">{footer}</div> : null}
      </div>
    </div>
  );
}

export function Field({ label, hint, children, className = "" }) {
  return (
    <label className={`field ${className}`}>
      <span>{label}</span>
      {children}
      {hint ? <em>{hint}</em> : null}
    </label>
  );
}

export function Empty({ title, text }) {
  return (
    <div className="empty">
      <strong>{title}</strong>
      <span>{text}</span>
    </div>
  );
}

export function Tabs({ tabs, value, onChange }) {
  return (
    <div className="tabs" role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          role="tab"
          aria-selected={value === tab.key}
          className={`tab ${value === tab.key ? "active" : ""}`}
          onClick={() => onChange(tab.key)}
        >
          {tab.label}
          {tab.count !== undefined ? <span className="tab-count">{tab.count}</span> : null}
        </button>
      ))}
    </div>
  );
}

export function Search({ value, onChange, placeholder = "Search" }) {
  return (
    <div className="search">
      <Icon name="search" size={15} />
      <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
    </div>
  );
}

export function Stat({ label, value, hint, tone = "", onClick }) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag className={`stat ${tone ? `stat-${tone}` : ""} ${onClick ? "stat-click" : ""}`} onClick={onClick}>
      <span className="stat-label">{label}</span>
      <strong className="stat-value">{value}</strong>
      {hint ? <span className="stat-hint">{hint}</span> : null}
    </Tag>
  );
}

export function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div className={`toast toast-${toast.tone || "success"}`} key={toast.id}>
      <Icon name={toast.tone === "warning" ? "alert" : "check"} size={16} />
      <span>{toast.message}</span>
    </div>
  );
}

export function printDocument(title, bodyHtml) {
  const win = window.open("", "_blank", "width=900,height=700");
  if (!win) return;
  win.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${title}</title>
    <style>
      body{font-family:"Segoe UI",Arial,sans-serif;color:#14241e;padding:34px;font-size:13px}
      h1{font-size:22px;margin:0 0 4px;color:#0b3a2c}
      .muted{color:#66776d}
      .head{border-bottom:2px solid #0b3a2c;padding-bottom:12px;margin-bottom:18px}
      .head p{margin:2px 0;color:#66776d}
      table{width:100%;border-collapse:collapse;margin-top:14px}
      th{text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:#66776d;border-bottom:1px solid #d8d2c0;padding:7px 5px}
      td{padding:7px 5px;border-bottom:1px solid #ece7d9}
      .r{text-align:right}
      tfoot td{font-weight:700;border-top:2px solid #0b3a2c;border-bottom:0}
      .stamp{margin-top:28px;color:#66776d;font-size:11px}
    </style></head><body>${bodyHtml}<div class="stamp">Generated from the AMIS Cooperative Finance Desk demo · ${new Date().toLocaleString("en-GB")}</div></body></html>`);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 350);
}
