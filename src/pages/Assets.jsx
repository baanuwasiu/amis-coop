import { useMemo, useState } from "react";
import { useApp } from "../lib/store";
import { dateLabel, money, todayISO } from "../lib/accounting";
import { Button, Card, Field, Modal, PageHead, Stat } from "../components/UI";

function AssetForm({ onClose }) {
  const { addAsset } = useApp();
  const [form, setForm] = useState({
    name: "",
    category: "IT equipment",
    date: todayISO(),
    cost: "",
    location: "",
    custodian: "",
    life: "4",
    residual: "0",
  });
  const [error, setError] = useState("");

  const set = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }));

  const submit = (event) => {
    event.preventDefault();
    setError("");
    if (!form.name.trim()) return setError("Enter the asset description.");
    if (!(Number(form.cost) > 0)) return setError("Enter a cost greater than zero.");
    const result = addAsset(form);
    if (!result.ok) return setError(result.error);
    onClose();
  };

  return (
    <form className="form" onSubmit={submit}>
      <div className="form-grid">
        <Field label="Description" className="full">
          <input value={form.name} onChange={set("name")} placeholder="e.g. Laptop computers" required />
        </Field>
        <Field label="Category">
          <select value={form.category} onChange={set("category")}>
            {["IT equipment", "Furniture", "Plant & machinery", "Motor vehicle", "Building", "Other"].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>
        <Field label="Purchase date">
          <input type="date" value={form.date} onChange={set("date")} />
        </Field>
        <Field label="Cost (₦)">
          <input type="number" min="1" step="1" value={form.cost} onChange={set("cost")} placeholder="0.00" required />
        </Field>
        <Field label="Useful life (years)">
          <input type="number" min="1" max="30" value={form.life} onChange={set("life")} />
        </Field>
        <Field label="Residual value (₦)">
          <input type="number" min="0" step="1" value={form.residual} onChange={set("residual")} />
        </Field>
        <Field label="Location">
          <input value={form.location} onChange={set("location")} placeholder="e.g. Secretariat" />
        </Field>
        <Field label="Custodian" className="full">
          <input value={form.custodian} onChange={set("custodian")} placeholder="e.g. Admin Officer" />
        </Field>
      </div>
      <div className="form-note">
        The purchase posts to fixed assets and bank. Depreciation is posted separately from the register.
      </div>
      {error ? <div className="form-error">{error}</div> : null}
      <div className="form-actions">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button type="submit" icon="check">Add asset</Button>
      </div>
    </form>
  );
}

export default function Assets() {
  const { state, role, depreciateAsset } = useApp();
  const [open, setOpen] = useState(false);
  const totals = useMemo(
    () =>
      state.assets.reduce(
        (acc, a) => ({ cost: acc.cost + a.cost, accum: acc.accum + a.accum }),
        { cost: 0, accum: 0 },
      ),
    [state.assets],
  );
  const nbv = totals.cost - totals.accum;

  return (
    <>
      <PageHead
        kicker="Fixed assets"
        title="Asset register"
        subtitle="Cost, custody, depreciation and net book value"
        actions={
          role.canManage ? (
            <Button icon="plus" onClick={() => setOpen(true)} disabled={state.period.locked}>Add asset</Button>
          ) : null
        }
      />

      <div className="stat-grid">
        <Stat label="Asset cost" value={money(totals.cost)} hint={`${state.assets.length} assets`} />
        <Stat label="Accumulated depreciation" value={money(totals.accum)} hint="Charged to date" />
        <Stat label="Net book value" value={money(nbv)} hint="Cost less depreciation" />
      </div>

      <Card title="Asset register" subtitle="Every asset is tagged, located and assigned to a custodian">
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Asset ID</th>
                <th>Description</th>
                <th>Category</th>
                <th>Location</th>
                <th>Custodian</th>
                <th className="num">Cost</th>
                <th className="num">Accum. dep.</th>
                <th className="num">NBV</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {state.assets.map((asset) => {
                const value = asset.cost - asset.accum;
                return (
                  <tr key={asset.id}>
                    <td className="mono">{asset.id}</td>
                    <td>
                      <div className="strong">{asset.name}</div>
                      <div className="muted small">Acquired {dateLabel(asset.date)} · {asset.life} yr life</div>
                    </td>
                    <td className="muted">{asset.category}</td>
                    <td className="muted">{asset.location}</td>
                    <td className="muted">{asset.custodian}</td>
                    <td className="num">{money(asset.cost)}</td>
                    <td className="num">{money(asset.accum)}</td>
                    <td className="num strong">{money(value)}</td>
                    <td className="row-actions">
                      {role.canManage ? (
                        <button
                          className="btn btn-xs btn-ghost"
                          disabled={state.period.locked}
                          onClick={() => {
                            const result = depreciateAsset(asset.id);
                            if (!result.ok) window.alert(result.error);
                          }}
                        >
                          Depreciate
                        </button>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="note">
          Monthly depreciation is straight-line over the useful life, net of residual value. Each posting debits depreciation expense (5050) and credits accumulated depreciation (1045).
        </p>
      </Card>

      {open ? (
        <Modal title="Add fixed asset" subtitle="The purchase will post to the fixed asset register and bank" onClose={() => setOpen(false)} wide>
          <AssetForm onClose={() => setOpen(false)} />
        </Modal>
      ) : null}
    </>
  );
}

