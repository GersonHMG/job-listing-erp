import React, { useState } from "react";
import { MoneyInput } from "./inputs";
import { type Expense, type Invoice } from "../types";
import { parseNumber, formatNumberCL, currency } from "../utils";

export function AddExpenseForm({
  onSubmit,
  initial,
  onCancel,
  invoices,
}: {
  onSubmit: (e: { description: string; amount: number; invoiceId?: string | null }) => void;
  initial?: Partial<Expense>;
  onCancel?: () => void;
  invoices?: Invoice[];
}) {
  const [description, setDescription] = useState<string>(initial?.description || "");
  const [amountDisp, setAmountDisp] = useState<string>(
    initial?.amount ? formatNumberCL(parseNumber(initial.amount)) : ""
  );
  const [amount, setAmount] = useState<number>(parseNumber(initial?.amount || ""));
  const [error, setError] = useState<string>("");
  const [invoiceId, setInvoiceId] = useState<string | "__none__" | "">(
    initial?.invoiceId ? String(initial.invoiceId) : "__none__"
  );

  const handle = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseNumber(amount);
    if (!description.trim()) return setError("La descripción es obligatoria.");
    if (val <= 0) return setError("El monto debe ser mayor a 0.");
    onSubmit({
      description: description.trim(),
      amount: val,
      invoiceId: invoiceId && invoiceId !== "__none__" ? invoiceId : null,
    });
    setDescription("");
    setAmountDisp("");
    setAmount(0);
    setError("");
    setInvoiceId("__none__");
  };

  return (
    <form onSubmit={handle} className="mt-3 grid grid-cols-1 gap-2">
      <label className="text-xs text-gray-500">Descripción</label>
      <input
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Ej: Combustible"
        className="rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-200"
      />
      <label className="text-xs text-gray-500 mt-2">Monto</label>
      <MoneyInput
        value={amountDisp}
        onChange={(pretty, num) => {
          setAmountDisp(pretty);
          setAmount(num);
        }}
        placeholder="Ej: 35.000"
      />
      {invoices && invoices.length > 0 && (
        <div className="mt-2">
          <label className="text-xs text-gray-500">Asignar a factura</label>
          <select
            value={invoiceId}
            onChange={(e) => setInvoiceId(e.target.value)}
            className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm bg-white"
          >
            <option value="__none__">— Sin factura —</option>
            {invoices.map((inv) => (
              <option key={inv.id} value={inv.id}>
                {`#${inv.number} • ${currency.format(inv.total)}`}
              </option>
            ))}
          </select>
        </div>
      )}
      {error && <p className="text-xs text-rose-600">{error}</p>}
      <div className="flex justify-end gap-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="mt-2 inline-flex items-center gap-2 rounded-2xl border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50"
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          className="mt-2 inline-flex items-center gap-2 rounded-2xl border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50 active:scale-[0.99] transition"
        >
          Guardar gasto
        </button>
      </div>
    </form>
  );
}

export function InlineExpenseEditor({
  initial,
  onSave,
  onCancel,
  invoices,
}: {
  initial: Expense;
  onSave: (vals: { description: string; amount: number; invoiceId?: string | null }) => void;
  onCancel: () => void;
  invoices?: Invoice[];
}) {
  return (
    <AddExpenseForm
      initial={initial}
      onSubmit={onSave}
      onCancel={onCancel}
      invoices={invoices}
    />
  );
}
