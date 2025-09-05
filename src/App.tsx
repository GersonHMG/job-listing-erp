import React, { useEffect, useMemo, useState } from "react";
import {
  Plus,
  X,
  Search,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  BadgeDollarSign,
  Pencil,
  Trash2,
  CalendarClock,
  CheckCircle2,
  FileText,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

// ============================
// Tipos
// ============================
interface Expense {
  id: string;
  description: string;
  amount: number;
  createdAt: string; // ISO
}
interface JobItem {
  id: string;
  name: string;
  quote: number; // CLP
  quoteDate: string; // ISO
  dueDate?: string; // ISO
  paid?: boolean; // true = Pagado (✅), false = Facturado (📄)
  expenses: Expense[];
}

// ============================
// Formato de moneda y fechas
// ============================
const currency = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
  currencyDisplay: "narrowSymbol",
});
const numberCL = new Intl.NumberFormat("es-CL", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});
const fmtDate = new Intl.DateTimeFormat("es-CL", { dateStyle: "medium" });

// ============================
// Helpers numéricos y de fechas
// ============================
const parseNumber = (val: unknown): number => {
  if (typeof val === "number") return val;
  if (!val) return 0;
  const cleaned = String(val)
    .replace(/\s|\$|CLP/gi, "")
    .replace(/\./g, "")
    .replace(/,/g, ".");
  const n = Number(cleaned);
  return isNaN(n) ? 0 : n;
};
const formatNumberCL = (val: number): string => numberCL.format(val);

// dd/mm/aaaa -> ISO
const dmyToISO = (dmy: string): string => {
  if (!dmy) return "";
  const m = String(dmy).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return "";
  const [, dd, mm, yyyy] = m;
  const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  if (isNaN(d.getTime())) return "";
  return d.toISOString();
};
// ISO -> dd/mm/aaaa
const isoToDMY = (iso: string): string => {
  if (!iso) return "";
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

const addMonths = (isoDate: string, months = 1): string => {
  const d = new Date(isoDate);
  const nd = new Date(d.getFullYear(), d.getMonth() + months, d.getDate());
  return nd.toISOString();
};
const daysUntil = (isoDate: string): number => {
  const now = new Date();
  const d = new Date(isoDate);
  const ms = d.setHours(0, 0, 0, 0) - now.setHours(0, 0, 0, 0);
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
};

// ============================
// Storage & util ids
// ============================
const storageKey = "joblist-erp-jobs";
const rid = () =>
  (globalThis.crypto as any)?.randomUUID
    ? (globalThis.crypto as any).randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

// ============================
// Componente principal
// ============================
export default function JobListingApp(): JSX.Element {
  const [jobs, setJobs] = useState<JobItem[]>(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? (JSON.parse(raw) as JobItem[]) : [];
    } catch {
      return [] as JobItem[];
    }
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isNewJobOpen, setIsNewJobOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<JobItem | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(jobs));
    } catch {}
  }, [jobs]);

  // Tests en consola (una vez)
  useEffect(() => {
    runUnitTests();
  }, []);

  const selectedJob = useMemo(() => jobs.find((j) => j.id === selectedId) || null, [jobs, selectedId]);
  const filteredJobs = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return jobs;
    return jobs.filter((j) => j.name.toLowerCase().includes(q));
  }, [jobs, query]);

  // Acciones trabajos
  const addJob = (job: Omit<JobItem, "id" | "expenses">) => {
    setJobs((prev) => [{ ...job, id: rid(), expenses: [], paid: !!job.paid }, ...prev]);
    setIsNewJobOpen(false);
  };
  const updateJob = (jobId: string, fields: Partial<JobItem>) => {
    setJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, ...fields } : j)));
    setEditingJob(null);
  };
  const deleteJob = (jobId: string) => {
    setJobs((prev) => prev.filter((j) => j.id !== jobId));
    if (selectedId === jobId) setSelectedId(null);
  };

  // Acciones gastos
  const addExpense = (jobId: string, expense: Omit<Expense, "id" | "createdAt">) => {
    setJobs((prev) =>
      prev.map((j) =>
        j.id === jobId
          ? { ...j, expenses: [{ id: rid(), createdAt: new Date().toISOString(), ...expense }, ...(j.expenses || [])] }
          : j
      )
    );
  };
  const updateExpense = (jobId: string, expenseId: string, fields: Partial<Expense>) => {
    setJobs((prev) =>
      prev.map((j) =>
        j.id === jobId
          ? { ...j, expenses: (j.expenses || []).map((e) => (e.id === expenseId ? { ...e, ...fields } : e)) }
          : j
      )
    );
  };
  const deleteExpense = (jobId: string, expenseId: string) => {
    setJobs((prev) =>
      prev.map((j) => (j.id === jobId ? { ...j, expenses: (j.expenses || []).filter((e) => e.id !== expenseId) } : j))
    );
  };

  // Cálculos
  const totals = (job: JobItem) => {
    const quote = parseNumber(job.quote || 0);
    const totalExpenses = (job.expenses || []).reduce((sum, e) => sum + parseNumber(e.amount), 0);
    const profit = quote - totalExpenses;
    const margin = quote > 0 ? profit / quote : 0;
    return { quote, totalExpenses, profit, margin };
  };

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <header className="sticky top-0 z-10 bg-white/70 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="flex-1">
            <h1 className="text-2xl font-semibold tracking-tight">Listado de Trabajos</h1>
            <p className="text-sm text-gray-500">Crea trabajos, registra gastos y consulta la rentabilidad.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1 text-xs text-gray-500 border border-gray-200 rounded-xl px-2 py-1">
              <BadgeDollarSign size={14} /> CLP
            </span>
            <button
              onClick={() => setIsNewJobOpen(true)}
              className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50 active:scale-[0.99] transition"
            >
              <Plus size={16} /> Agregar trabajo
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna izquierda: listado */}
        <section className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2 rounded-2xl border border-gray-200 px-3 py-2">
            <Search className="shrink-0" size={16} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nombre..."
              className="w-full bg-transparent outline-none text-sm py-1"
            />
          </div>

          {filteredJobs.length === 0 ? (
            <EmptyState onAdd={() => setIsNewJobOpen(true)} />
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {filteredJobs.map((job) => {
                const t = totals(job);
                const positive = t.profit >= 0;
                const dLeft = job.dueDate ? daysUntil(job.dueDate) : null;
                const isPaid = !!job.paid; // true => Pagado; false => Facturado
                return (
                  <button
                    key={job.id}
                    onClick={() => setSelectedId(job.id)}
                    className={`relative group text-left rounded-2xl border px-4 py-4 transition hover:shadow-sm active:scale-[0.99] ${
                      selectedId === job.id ? "border-gray-900" : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {/* Estado solo ícono en esquina derecha (📄 Facturado | ✅ Pagado) */}
                    <span className="absolute top-2 right-2">
                      {isPaid ? (
                        <CheckCircle2 className="text-emerald-600" size={16} />
                      ) : (
                        <FileText className="text-gray-500" size={16} />
                      )}
                    </span>

                    <div className="flex items-start justify-between gap-2">
                      <div className="pr-6">
                        <h3 className="font-medium leading-tight">{job.name}</h3>
                        {job.dueDate && (
                          <p className={`mt-1 text-[11px] ${dLeft! < 0 ? "text-rose-600" : dLeft! <= 7 ? "text-amber-600" : "text-gray-500"}`}>
                            {dLeft! >= 0 ? `Vence en ${dLeft} día${dLeft === 1 ? "" : "s"}` : `Vencido hace ${Math.abs(dLeft!)} día${Math.abs(dLeft!) === 1 ? "" : "s"}`}
                          </p>
                        )}
                      </div>
                      <ChevronRight className="opacity-0 group-hover:opacity-100 transition" size={18} />
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <Stat label="Cotización" value={currency.format(t.quote)} />
                      <Stat label="Rentabilidad" value={currency.format(t.profit)} tone={positive ? "positive" : "negative"} hint={t.quote > 0 ? `${Math.round(t.margin * 100)}%` : undefined} />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Columna derecha: detalle */}
        <section className="lg:col-span-1">
          {selectedJob ? (
            <JobDetail
              job={selectedJob}
              totals={totals(selectedJob)}
              onAddExpense={(e) => addExpense(selectedJob.id, e)}
              onUpdateExpense={(eid, fields) => updateExpense(selectedJob.id, eid, fields)}
              onDeleteExpense={(eid) => deleteExpense(selectedJob.id, eid)}
              onEditJob={() => setEditingJob(selectedJob)}
              onTogglePaid={() => updateJob(selectedJob.id, { paid: !selectedJob.paid })}
            />
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-200 p-6 text-center text-sm text-gray-500">
              Selecciona un trabajo para ver gastos y agregar nuevos.
            </div>
          )}
        </section>
      </main>

      <JobModal
        open={isNewJobOpen || !!editingJob}
        initial={editingJob || undefined}
        onClose={() => {
          setIsNewJobOpen(false);
          setEditingJob(null);
        }}
        onSubmit={(job) => {
          if (editingJob) {
            updateJob(editingJob.id, job as Partial<JobItem>);
          } else {
            addJob(job as Omit<JobItem, "id" | "expenses">);
          }
        }}
        onDelete={(jobId) => deleteJob(jobId)}
      />
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-gray-200 p-10 text-center">
      <p className="text-sm text-gray-600">Aún no hay trabajos.</p>
      <button
        onClick={onAdd}
        className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50 active:scale-[0.99] transition"
      >
        <Plus size={16} /> Crear el primero
      </button>
    </div>
  );
}

function Stat({ label, value, tone = "neutral", hint }: { label: string; value: string; tone?: "neutral" | "positive" | "negative"; hint?: string }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <div className="mt-1 flex items-center gap-1">
        {tone === "positive" && <TrendingUp size={16} className="text-emerald-600" />}
        {tone === "negative" && <TrendingDown size={16} className="text-rose-600" />}
        <p className={`text-sm font-medium ${tone === "negative" ? "text-rose-700" : tone === "positive" ? "text-emerald-700" : "text-gray-900"}`}>{value}</p>
        {hint && <span className="text-xs text-gray-400 ml-1">({hint})</span>}
      </div>
    </div>
  );
}

function JobDetail({
  job,
  totals,
  onAddExpense,
  onUpdateExpense,
  onDeleteExpense,
  onEditJob,
  onTogglePaid,
}: {
  job: JobItem;
  totals: { quote: number; totalExpenses: number; profit: number; margin: number };
  onAddExpense: (e: { description: string; amount: number }) => void;
  onUpdateExpense: (id: string, fields: Partial<Expense>) => void;
  onDeleteExpense: (id: string) => void;
  onEditJob: () => void;
  onTogglePaid: () => void;
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
            {/* Estado textual eliminado del encabezado para mantener consistencia con el resumen minimalista */}
          </div>
          <p className="text-xs text-gray-500">Cotizado el {fmtDate.format(new Date(job.quoteDate))}</p>
          {job.dueDate && (
            <p className={`text-xs mt-1 inline-flex items-center gap-1 ${dLeft! < 0 ? "text-rose-600" : dLeft! <= 7 ? "text-amber-600" : "text-gray-500"}`}>
              <CalendarClock size={12} /> {dLeft! >= 0 ? `Vence en ${dLeft} día${dLeft === 1 ? "" : "s"}` : `Vencido hace ${Math.abs(dLeft!)} día${Math.abs(dLeft!) === 1 ? "" : "s"}`}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Toggle estado: 📄 Facturado <-> ✅ Pagado */}
          <span className="inline-flex items-center gap-1 text-xs text-gray-500 border border-gray-200 rounded-xl px-2 py-1">
            {job.paid ? <CheckCircle2 className="text-emerald-600" size={14} /> : <FileText className="text-gray-500" size={14} />}
          </span>
          <button onClick={onEditJob} className="text-xs rounded-xl border px-3 py-1 hover:bg-gray-50 inline-flex items-center gap-1">
            <Pencil size={14} /> Editar
          </button>
          <button onClick={onTogglePaid} className="text-xs rounded-xl border px-3 py-1 hover:bg-gray-50 inline-flex items-center gap-1">
            {job.paid ? "Marcar como facturado" : "Marcar como pagado"}
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Stat label="Cotización" value={currency.format(totals.quote)} />
        <Stat label="Gastos" value={currency.format(totals.totalExpenses)} />
        <Stat label="Rentabilidad" value={currency.format(totals.profit)} tone={totals.profit >= 0 ? "positive" : "negative"} />
        <Stat label="Margen" value={`${Math.round(totals.margin * 100)}%`} />
      </div>

      <div className="mt-6 border-y border-gray-100 py-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium">Gastos</h4>
          <button onClick={() => setOpenForm((v) => !v)} className="text-xs rounded-xl border px-3 py-1 hover:bg-gray-50 inline-flex items-center gap-1">
            <Plus size={14} /> {openForm ? "Cerrar" : "Agregar nuevo gasto"}
          </button>
        </div>
        <AnimatePresence initial={false}>
          {openForm && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
              <AddExpenseForm
                onSubmit={(e) => {
                  onAddExpense({ description: e.description, amount: parseNumber(e.amount) });
                  setOpenForm(false);
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {(!job.expenses || job.expenses.length === 0) ? (
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
                    onUpdateExpense(e.id, { description: vals.description.trim(), amount: parseNumber(vals.amount) });
                    setEditingId(null);
                  }}
                />
              ) : (
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm">{e.description}</p>
                    <p className="text-xs text-gray-500">{fmtDate.format(new Date(e.createdAt))}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{currency.format(parseNumber(e.amount))}</span>
                    <button onClick={() => setEditingId(e.id)} className="p-1 rounded-lg hover:bg-gray-50" title="Editar">
                      <Pencil size={16} />
                    </button>
                    <button onClick={() => onDeleteExpense(e.id)} className="p-1 rounded-lg hover:bg-gray-50 text-rose-600" title="Eliminar">
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

// ============================
// Inputs reutilizables
// ============================
function MoneyInput({ value, onChange, placeholder }: { value: string; onChange?: (pretty: string, num: number) => void; placeholder?: string }) {
  const [display, setDisplay] = useState<string>(value ? formatNumberCL(parseNumber(value)) : "");

  useEffect(() => {
    setDisplay(value ? formatNumberCL(parseNumber(value)) : "");
  }, [value]);

  const handle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^\d,\.]/g, "");
    const num = parseNumber(raw);
    const pretty = formatNumberCL(num);
    setDisplay(pretty);
    onChange?.(pretty, num);
  };

  return (
    <div className="relative">
      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">$</span>
      <input
        value={display}
        onChange={handle}
        placeholder={placeholder}
        inputMode="decimal"
        className="w-full rounded-xl border border-gray-200 pl-6 pr-10 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-200"
      />
      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">CLP</span>
    </div>
  );
}

function DateDMYInput({ value, onChange, placeholder = "dd/mm/aaaa" }: { value?: string; onChange?: (iso: string) => void; placeholder?: string }) {
  const [display, setDisplay] = useState<string>(value ? isoToDMY(value) : "");

  useEffect(() => {
    setDisplay(value ? isoToDMY(value) : "");
  }, [value]);

  const handle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^\d/]/g, "");
    setDisplay(raw);
    const iso = dmyToISO(raw);
    if (iso) onChange?.(iso);
  };

  return (
    <input
      value={display}
      onChange={handle}
      placeholder={placeholder}
      className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-200"
    />
  );
}

function AddExpenseForm({ onSubmit, initial, onCancel }: { onSubmit: (e: { description: string; amount: number }) => void; initial?: Partial<Expense>; onCancel?: () => void }) {
  const [description, setDescription] = useState<string>(initial?.description || "");
  const [amountDisp, setAmountDisp] = useState<string>(initial?.amount ? formatNumberCL(parseNumber(initial.amount)) : "");
  const [amount, setAmount] = useState<number>(parseNumber(initial?.amount || ""));
  const [error, setError] = useState<string>("");

  const handle = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseNumber(amount);
    if (!description.trim()) return setError("La descripción es obligatoria.");
    if (val <= 0) return setError("El monto debe ser mayor a 0.");
    onSubmit({ description: description.trim(), amount: val });
    setDescription("");
    setAmountDisp("");
    setAmount(0);
    setError("");
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
      {error && <p className="text-xs text-rose-600">{error}</p>}
      <div className="flex justify-end gap-2">
        {onCancel && (
          <button type="button" onClick={onCancel} className="mt-2 inline-flex items-center gap-2 rounded-2xl border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50">
            Cancelar
          </button>
        )}
        <button type="submit" className="mt-2 inline-flex items-center gap-2 rounded-2xl border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50 active:scale-[0.99] transition">
          Guardar gasto
        </button>
      </div>
    </form>
  );
}

function InlineExpenseEditor({ initial, onSave, onCancel }: { initial: Expense; onSave: (vals: { description: string; amount: number }) => void; onCancel: () => void }) {
  return <AddExpenseForm initial={initial} onSubmit={onSave} onCancel={onCancel} />;
}

function JobModal({ open, onClose, onSubmit, onDelete, initial }: { open: boolean; onClose: () => void; onSubmit: (job: Partial<JobItem>) => void; onDelete: (id: string) => void; initial?: JobItem }) {
  const [name, setName] = useState<string>(initial?.name || "");
  const [quoteDisp, setQuoteDisp] = useState<string>(initial?.quote ? formatNumberCL(parseNumber(initial.quote)) : "");
  const [quote, setQuote] = useState<number>(parseNumber(initial?.quote || ""));
  const [date, setDate] = useState<string>(() => (initial?.quoteDate ? new Date(initial.quoteDate).toISOString() : new Date().toISOString()));
  const [dueDate, setDueDate] = useState<string>(() => (initial?.dueDate ? new Date(initial.dueDate).toISOString() : addMonths(new Date().toISOString(), 1)));
  const [dueTouched, setDueTouched] = useState<boolean>(false);
  const [paid, setPaid] = useState<boolean>(!!initial?.paid);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (!open) {
      setName("");
      setQuoteDisp("");
      setQuote(0);
      const todayISO = new Date().toISOString();
      setDate(todayISO);
      setDueDate(addMonths(todayISO, 1));
      setDueTouched(false);
      setPaid(false);
      setError("");
    } else if (initial) {
      setName(initial.name || "");
      setQuoteDisp(initial.quote ? formatNumberCL(parseNumber(initial.quote)) : "");
      setQuote(parseNumber(initial.quote || ""));
      setDate(new Date(initial.quoteDate).toISOString());
      setDueDate(initial.dueDate ? new Date(initial.dueDate).toISOString() : addMonths(initial.quoteDate, 1));
      setPaid(!!initial.paid);
    }
  }, [open, initial]);

  useEffect(() => {
    if (!dueTouched && date) {
      setDueDate(addMonths(date, 1));
    }
  }, [date, dueTouched]);

  const handle = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseNumber(quote);
    if (!name.trim()) return setError("El nombre del trabajo es obligatorio.");
    if (val <= 0) return setError("La cotización debe ser mayor a 0.");
    if (!date) return setError("La fecha de la cotización es obligatoria.");
    if (!dueDate) return setError("La fecha de vencimiento es obligatoria.");
    onSubmit({ name: name.trim(), quote: val, quoteDate: new Date(date).toISOString(), dueDate: new Date(dueDate).toISOString(), paid });
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-20 bg-black/30 flex items-end sm:items-center justify-center p-2"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            className="w-full max-w-md rounded-2xl bg-white p-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{initial ? "Editar trabajo" : "Nuevo trabajo"}</h3>
              <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-50">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handle} className="mt-3 grid grid-cols-1 gap-3">
              <div>
                <label className="text-xs text-gray-500">Nombre del trabajo</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Instalación eléctrica"
                  className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-200"
                />
              </div>

              <div>
                <label className="text-xs text-gray-500">Cotización</label>
                <MoneyInput
                  value={quoteDisp}
                  onChange={(pretty, num) => {
                    setQuoteDisp(pretty);
                    setQuote(num);
                  }}
                  placeholder="Ej: 1.500.000"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500">Fecha de la cotización (dd/mm/aaaa)</label>
                  <DateDMYInput value={date} onChange={(iso) => setDate(iso)} />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Vencimiento factura (dd/mm/aaaa)</label>
                  <DateDMYInput value={dueDate} onChange={(iso) => { setDueTouched(true); setDueDate(iso); }} />
                </div>
              </div>

              <div className="flex items-center gap-2 mt-1">
                <input id="paid" type="checkbox" checked={paid} onChange={(e) => setPaid(e.target.checked)} className="rounded border-gray-300" />
                <label htmlFor="paid" className="text-sm">Pagado (si está off queda como <span className="font-medium">Facturado</span>)</label>
              </div>

              {error && <p className="text-xs text-rose-600">{error}</p>}

              <div className="flex items-center justify-between gap-2">
                {initial ? (
                  <button
                    type="button"
                    onClick={() => { if (confirm("¿Eliminar este trabajo?")) onDelete(initial.id); }}
                    className="text-xs rounded-xl border px-3 py-2 hover:bg-gray-50 inline-flex items-center gap-1 text-rose-600 border-rose-200"
                  >
                    <Trash2 size={14} /> Eliminar trabajo
                  </button>
                ) : <span />}

                <div className="flex items-center gap-2">
                  <button type="button" onClick={onClose} className="rounded-2xl border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50">Cancelar</button>
                  <button type="submit" className="rounded-2xl border border-gray-900 bg-gray-900 text-white px-4 py-2 text-sm hover:bg-black">{initial ? "Guardar cambios" : "Guardar"}</button>
                </div>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ==========================
   Tests básicos (consola)
   ========================== */
function runUnitTests() {
  const approx = (a: number, b: number, eps = 1e-6) => Math.abs(a - b) < eps;

  // parseNumber
  console.assert(parseNumber("") === 0, "parseNumber('') debe ser 0");
  console.assert(parseNumber("1.500.000") === 1500000, "parseNumber con miles");
  console.assert(approx(parseNumber("1,5"), 1.5), "parseNumber coma decimal");
  console.assert(approx(parseNumber("35.000,75"), 35000.75), "parseNumber miles+decimales");
  console.assert(parseNumber("abc") === 0, "parseNumber inválido => 0");

  // MoneyInput comportamiento (formateo en vivo)
  console.assert(formatNumberCL(125000) === "125.000", "MoneyInput base (miles)");

  // Fechas DMY helpers
  const iso = dmyToISO("05/09/2025");
  console.assert(iso && isoToDMY(iso) === "05/09/2025", "DMY <-> ISO redondo");

  // totals
  const job0 = { quote: 1000000, expenses: [] } as JobItem;
  const q0 = parseNumber(job0.quote); const e0 = 0; const p0 = q0 - e0; const m0 = q0 > 0 ? p0 / q0 : 0;
  console.assert(q0 === 1000000 && e0 === 0 && p0 === 1000000 && approx(m0, 1), "totals sin gastos");

  const job1 = { quote: 1000000, expenses: [{ amount: 250000.5 }, { amount: 125000.25 }] } as JobItem;
  const q1 = parseNumber(job1.quote);
  const e1 = (job1.expenses as any[]).reduce((s, x) => s + parseNumber((x as any).amount), 0);
  const p1 = q1 - e1; const m1 = q1 > 0 ? p1 / q1 : 0;
  console.assert(approx(e1, 375000.75) && approx(p1, 624999.25) && approx(m1, 0.62499925), "totals con decimales");

  // Vencimiento + días restantes
  const today = new Date();
  const isoToday = today.toISOString();
  const plus1m = addMonths(isoToday, 1);
  console.assert(new Date(plus1m).getMonth() === (today.getMonth() + 1) % 12, "+1 mes calculado");
  const dleft = daysUntil(isoToday);
  console.assert(typeof dleft === "number", "daysUntil retorna número");

  // Formato CLP
  console.assert(currency.format(1500000).includes("$"), "formato CLP incluye $");
}
