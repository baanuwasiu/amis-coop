import { useMemo, useState } from "react";
import { useApp } from "../lib/store";
import { money } from "../lib/accounting";
import { Button, Card, Field, Modal, PageHead, Stat, StatusPill } from "../components/UI";

function ItemForm({ onClose }) {
  const { addInventoryItem } = useApp();
  const [form, setForm] = useState({ name: "", unit: "Unit", qty: "", reorder: "", unitCost: "" });
  const [error, setError] = useState("");
  const set = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }));

  const submit = (event) => {
    event.preventDefault();
    if (!form.name.trim()) return setError("Enter the item name.");
    if (!(Number(form.qty) >= 0)) return setError("Enter a valid opening quantity.");
    const result = addInventoryItem(form);
    if (!result.ok) return setError(result.error);
    onClose();
  };

  return (
    <form className="form" onSubmit={submit}>
      <div className="form-grid">
        <Field label="Item name" className="full">
          <input value={form.name} onChange={set("name")} placeholder="e.g. A4 printer paper" required />
        </Field>
        <Field label="Unit">
          <select value={form.unit} onChange={set("unit")}>
            {["Unit", "Ream", "Pack", "Box", "Litre", "Set"].map((u) => <option key={u}>{u}</option>)}
          </select>
        </Field>
        <Field label="Opening quantity">
          <input type="number" min="0" value={form.qty} onChange={set("qty")} required />
        </Field>
        <Field label="Reorder level">
          <input type="number" min="0" value={form.reorder} onChange={set("reorder")} required />
        </Field>
        <Field label="Unit cost (₦)">
          <input type="number" min="1" value={form.unitCost} onChange={set("unitCost")} required />
        </Field>
      </div>
      {error ? <div className="form-error">{error}</div> : null}
      <div className="form-actions">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button type="submit" icon="check">Add item</Button>
      </div>
    </form>
  );
}

function MovementForm({ item, mode, onClose }) {
  const { stockMove, state } = useApp();
  const [qty, setQty] = useState("");
  const [unitCost, setUnitCost] = useState(String(item.unitCost));
  const [error, setError] = useState("");

  const submit = (event) => {
    event.preventDefault();
    const result = stockMove({ itemId: item.id, mode, qty, unitCost });
    if (!result.ok) return setError(result.error);
    onClose();
  };

  return (
    <form className="form" onSubmit={submit}>
      <div className="detail-grid">
        <div><span>Item</span><strong>{item.name}</strong></div>
        <div><span>On hand</span><strong>{item.qty} {item.unit}</strong></div>
        <div><span>Unit cost</span><strong>{money(item.unitCost)}</strong></div>
        <div><span>Reorder level</span><strong>{item.reorder}</strong></div>
      </div>
      <div className="form-grid">
        <Field label="Quantity">
          <input type="number" min="1" value={qty} onChange={(e) => setQty(e.target.value)} required />
        </Field>
        {mode === "in" ? (
          <Field label="Purchase unit cost (₦)">
            <input type="number" min="1" value={unitCost} onChange={(e) => setUnitCost(e.target.value)} />
          </Field>
        ) : null}
      </div>
      <div className="form-note">
        {mode === "in"
          ? "Stock received debits inventory (1050) and credits bank (1010)."
          : "Stock issued debits operating expenses (5010) and credits inventory (1050)."}
      </div>
      {error ? <div className="form-error">{error}</div> : null}
      <div className="form-actions">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button type="submit" icon="check">Post {mode === "in" ? "receipt" : "issue"}</Button>
      </div>
    </form>
  );
}

export default function Inventory() {
  const { state, role } = useApp();
  const [itemForm, setItemForm] = useState(false);
  const [move, setMove] = useState(null);
  const summary = useMemo(
    () => state.inventory.reduce(
      (acc, item) => ({
        value: acc.value + item.qty * item.unitCost,
        low: acc.low + (item.qty <= item.reorder ? 1 : 0),
      }),
      { value: 0, low: 0 },
    ),
    [state.inventory],
  );

  return (
    <>
      <PageHead
        kicker="Stores"
        title="Inventory"
        subtitle="Items held for use, stock movements and reorder levels"
        actions={
          role.canManage ? (
            <Button icon="plus" onClick={() => setItemForm(true)}>Add item</Button>
          ) : null
        }
      />

      <div className="stat-grid">
        <Stat label="Inventory value" value={money(summary.value)} hint={`${state.inventory.length} items`} />
        <Stat label="Low stock items" value={String(summary.low)} hint="At or below reorder level" tone={summary.low ? "warning" : "positive"} />
        <Stat label="Control account" value={money(state.inventory.reduce((s, i) => s + i.qty * i.unitCost, 0))} hint="Ledger 1050" />
      </div>

      <Card title="Stock items" subtitle="Quantities and values from the store card">
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Code</th>
                <th>Item</th>
                <th>Unit</th>
                <th className="num">On hand</th>
                <th className="num">Reorder</th>
                <th className="num">Unit cost</th>
                <th className="num">Value</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {state.inventory.map((item) => (
                <tr key={item.id}>
                  <td className="mono">{item.id}</td>
                  <td className="strong">{item.name}</td>
                  <td className="muted">{item.unit}</td>
                  <td className="num">{item.qty}</td>
                  <td className="num muted">{item.reorder}</td>
                  <td className="num">{money(item.unitCost)}</td>
                  <td className="num strong">{money(item.qty * item.unitCost)}</td>
                  <td>
                    <StatusPill status={item.qty <= item.reorder ? "Open" : "Resolved"}>
                      {item.qty <= item.reorder ? "Low" : "OK"}
                    </StatusPill>
                  </td>
                  <td className="row-actions">
                    {role.canManage ? (
                      <>
                        <button className="btn btn-xs btn-ghost" onClick={() => setMove({ item, mode: "in" })}>In</button>
                        <button className="btn btn-xs btn-ghost" onClick={() => setMove({ item, mode: "out" })}>Out</button>
                      </>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="note">Stock movements post to inventory and the bank or operating expenses, so the store card and the ledger stay together.</p>
      </Card>

      {itemForm ? (
        <Modal title="Add inventory item" subtitle="Set the opening quantity and reorder level" onClose={() => setItemForm(false)}>
          <ItemForm onClose={() => setItemForm(false)} />
        </Modal>
      ) : null}

      {move ? (
        <Modal
          title={move.mode === "in" ? "Receive stock" : "Issue stock"}
          subtitle={`${move.item.name} · ${move.item.id}`}
          onClose={() => setMove(null)}
        >
          <MovementForm item={move.item} mode={move.mode} onClose={() => setMove(null)} />
        </Modal>
      ) : null}
    </>
  );
}
