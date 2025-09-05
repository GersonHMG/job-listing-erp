import { useEffect, useMemo, useState, type JSX } from "react";
import {
  Plus,
  Search,
  ChevronRight,
  BadgeDollarSign,
  CheckCircle2,
  FileText,
} from "lucide-react";
import { type Expense, type JobItem } from "./types";

import {
  currency,
  parseNumber,
  storageKey,
  rid,
  daysUntil,
  fmtDate,
} from "./utils";
import { EmptyState } from "./components/EmptyState";
import { Stat } from "./components/Stat";
import { JobDetail } from "./components/JobDetail";
import { JobModal } from "./components/JobModal";
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
    } catch {
      /* ignore */
    }
  }, [jobs]);


  const selectedJob = useMemo(
    () => jobs.find((j) => j.id === selectedId) || null,
    [jobs, selectedId]
  );
  const filteredJobs = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return jobs;
    return jobs.filter((j) => j.name.toLowerCase().includes(q));
  }, [jobs, query]);

  // Acciones trabajos
  const addJob = (job: Omit<JobItem, "id" | "expenses">) => {
    setJobs((prev) => [
      { ...job, id: rid(), expenses: [], paid: !!job.paid },
      ...prev,
    ]);
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
          ? {
              ...j,
              expenses: [
                { id: rid(), createdAt: new Date().toISOString(), ...expense },
                ...(j.expenses || []),
              ],
            }
          : j
      )
    );
  };
  const updateExpense = (
    jobId: string,
    expenseId: string,
    fields: Partial<Expense>
  ) => {
    setJobs((prev) =>
      prev.map((j) =>
        j.id === jobId
          ? {
              ...j,
              expenses: (j.expenses || []).map((e) =>
                e.id === expenseId ? { ...e, ...fields } : e
              ),
            }
          : j
      )
    );
  };
  const deleteExpense = (jobId: string, expenseId: string) => {
    setJobs((prev) =>
      prev.map((j) =>
        j.id === jobId
          ? {
              ...j,
              expenses: (j.expenses || []).filter((e) => e.id !== expenseId),
            }
          : j
      )
    );
  };

  // Cálculos
  const totals = (job: JobItem) => {
    const quote = parseNumber(job.quote || 0);
    const totalExpenses = (job.expenses || []).reduce(
      (sum, e) => sum + parseNumber(e.amount),
      0
    );
    const profit = quote - totalExpenses;
    const margin = quote > 0 ? profit / quote : 0;
    return { quote, totalExpenses, profit, margin };
  };

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <header className="sticky top-0 z-10 bg-white/70 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="flex-1">
            <div className="w-8 h-8 rounded bg-gray-200" />
            <p className="text-sm text-gray-500">
              Crea trabajos, registra gastos y consulta la rentabilidad.
            </p>
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
                const isPaid = !!job.paid;
                return (
                  <button
                    key={job.id}
                    onClick={() => setSelectedId(job.id)}
                    className={`relative group text-left rounded-2xl border px-4 py-4 transition hover:shadow-sm active:scale-[0.99] ${
                      selectedId === job.id
                        ? "border-gray-900"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
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
                          isPaid ? (
                            <p className="mt-1 text-[11px] text-gray-500">
                              Pago recibido: {fmtDate.format(new Date(job.dueDate))}
                            </p>
                          ) : (
                            <p
                              className={`mt-1 text-[11px] ${
                                dLeft! < 0
                                  ? "text-rose-600"
                                  : dLeft! <= 7
                                  ? "text-amber-600"
                                  : "text-gray-500"
                              }`}
                            >
                              {dLeft! >= 0
                                ? `Factura vence en ${dLeft} día${
                                    dLeft === 1 ? "" : "s"
                                  }`
                                : `Vencido hace ${Math.abs(dLeft!)} día${
                                    Math.abs(dLeft!) === 1 ? "" : "s"
                                  }`}
                            </p>
                          )
                        )}
                      </div>
                      <ChevronRight
                        className="opacity-0 group-hover:opacity-100 transition"
                        size={18}
                      />
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <Stat label="Cotización" value={currency.format(t.quote)} />
                      <Stat
                        label="Rentabilidad"
                        value={currency.format(t.profit)}
                        tone={positive ? "positive" : "negative"}
                        hint={
                          t.quote > 0
                            ? `${Math.round(t.margin * 100)}%`
                            : undefined
                        }
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <section className="lg:col-span-1">
          {selectedJob ? (
            <JobDetail
              job={selectedJob}
              totals={totals(selectedJob)}
              onAddExpense={(e) => addExpense(selectedJob.id, e)}
              onUpdateExpense={(eid, fields) =>
                updateExpense(selectedJob.id, eid, fields)
              }
              onDeleteExpense={(eid) => deleteExpense(selectedJob.id, eid)}
              onEditJob={() => setEditingJob(selectedJob)}
              onTogglePaid={() =>
                updateJob(selectedJob.id, { paid: !selectedJob.paid })
              }
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
