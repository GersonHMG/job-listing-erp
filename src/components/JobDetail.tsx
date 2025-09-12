import { useState } from "react";
import {
  Pencil,
  Trash2,
  CalendarClock,
  Plus,
  CheckCircle2,
  FileText,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { type Expense, type JobItem } from "../types";
import {
  currency,
  fmtDate,
  parseNumber,
  daysUntil,
} from "../utils";
import { Stat } from "./Stat";
import { AddExpenseForm, InlineExpenseEditor } from "./AddExpenseForm";

export function JobDetail({
  job,
  totals,
  onAddExpense,
  onUpdateExpense,
  onDeleteExpense,
  onEditJob,
  onTogglePaid,
  companyName,
}: {
  job: JobItem;
  totals: { quote: number; totalExpenses: number; profit: number; margin: number };
  onAddExpense: (e: { description: string; amount: number; invoiceId?: string | null }) => void;
  onUpdateExpense: (id: string, fields: Partial<Expense>) => void;
  onDeleteExpense: (id: string) => void;
  onEditJob: () => void;
  onTogglePaid: () => void;
  companyName?: string;
}) {
  const [openForm, setOpenForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const dLeft = job.dueDate ? daysUntil(job.dueDate) : null;

  return (
    <div className="rounded-2xl border border-gray-200 p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-semibold leading-tight">{job.name}</h2>
          </div>
          {companyName && (
            <p className="text-xs text-gray-500">{companyName}</p>
          )}
          <p className="text-xs text-gray-500">
            Cotizado el {fmtDate.format(new Date(job.quoteDate))}
          </p>
          {job.dueDate && (
            job.paid ? (
              <p className="text-xs mt-1 inline-flex items-center gap-1 text-gray-500">
                <CheckCircle2 className="text-emerald-600" size={12} />
                Pago recibido: {fmtDate.format(new Date(job.dueDate))}
              </p>
            ) : (
              <p
                className={`text-xs mt-1 inline-flex items-center gap-1 ${
                  dLeft! < 0
                    ? "text-rose-600"
                    : dLeft! <= 7
                    ? "text-amber-600"
                    : "text-gray-500"
                }`}
              >
                <CalendarClock size={12} />
                {dLeft! >= 0
                  ? `Vence en ${dLeft} día${dLeft === 1 ? "" : "s"}`
                  : `Vencido hace ${Math.abs(dLeft!)} día${
                      Math.abs(dLeft!) === 1 ? "" : "s"
                    }`}
              </p>
            )
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 text-xs text-gray-500 border border-gray-200 rounded-xl px-2 py-1">
            {job.paid ? (
              <CheckCircle2 className="text-emerald-600" size={14} />
            ) : (
              <FileText className="text-gray-500" size={14} />
            )}
          </span>
          <button
            onClick={onEditJob}
            className="text-xs rounded-xl border px-3 py-1 hover:bg-gray-50 inline-flex items-center gap-1"
          >
            <Pencil size={14} /> Editar
          </button>
          <button
            onClick={onTogglePaid}
            className="text-xs rounded-xl border px-3 py-1 hover:bg-gray-50 inline-flex items-center gap-1"
          >
            {job.paid ? "Marcar como facturado" : "Marcar como pagado"}
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Stat label="Cotización" value={currency.format(totals.quote)} />
        <Stat label="Gastos" value={currency.format(totals.totalExpenses)} />
        <Stat
          label="Rentabilidad"
          value={currency.format(totals.profit)}
          tone={totals.profit >= 0 ? "positive" : "negative"}
        />
        <Stat label="Margen" value={`${Math.round(totals.margin * 100)}%`} />
      </div>

      <div className="mt-6 border-y border-gray-100 py-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium">Gastos</h4>
          <button
            onClick={() => setOpenForm((v) => !v)}
            className="text-xs rounded-xl border px-3 py-1 hover:bg-gray-50 inline-flex items-center gap-1"
          >
            <Plus size={14} /> {openForm ? "Cerrar" : "Agregar nuevo gasto"}
          </button>
        </div>
        <AnimatePresence initial={false}>
          {openForm && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
            >
              <AddExpenseForm
                onSubmit={(e) => {
                  onAddExpense({
                    description: e.description,
                    amount: parseNumber(e.amount),
                    invoiceId: e.invoiceId ?? null,
                  });
                  setOpenForm(false);
                }}
                invoices={job.invoices}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {!job.expenses || job.expenses.length === 0 ? (
        <p className="mt-2 text-sm text-gray-500">Sin gastos registrados.</p>
      ) : (
        <ul className="mt-2 space-y-2">
          {job.expenses.map((e) => (
            <li key={e.id} className="rounded-xl border border-gray-200 px-3 py-2">
              {editingId === e.id ? (
                <InlineExpenseEditor
                  initial={e}
                  onCancel={() => setEditingId(null)}
                  onSave={(vals) => {
                    onUpdateExpense(e.id, {
                      description: vals.description.trim(),
                      amount: parseNumber(vals.amount),
                      invoiceId: vals.invoiceId ?? null,
                    });
                    setEditingId(null);
                  }}
                  invoices={job.invoices}
                />
              ) : (
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm">{e.description}</p>
                    <p className="text-xs text-gray-500">
                      {fmtDate.format(new Date(e.createdAt))}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] rounded-full border px-2 py-0.5 text-gray-600 border-gray-200">
                      {e.invoiceId
                        ? (() => {
                            const inv = (job.invoices || []).find((i) => i.id === e.invoiceId);
                            return inv ? `Factura #${inv.number}` : "Factura";
                          })()
                        : "General"}
                    </span>
                    <span className="text-sm font-medium">
                      {currency.format(parseNumber(e.amount))}
                    </span>
                    <button
                      onClick={() => setEditingId(e.id)}
                      className="p-1 rounded-lg hover:bg-gray-50"
                      title="Editar"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => onDeleteExpense(e.id)}
                      className="p-1 rounded-lg hover:bg-gray-50 text-rose-600"
                      title="Eliminar"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
