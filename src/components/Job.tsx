import React from "react";
import {
  ChevronRight,
  CheckCircle2,
  FileText,
} from "lucide-react";
import { Stat } from "./Stat";
import { type JobItem } from "../types";
import { currency } from "../utils";
import { JobDetail } from "./JobDetail";

interface JobDetailProps {
  totals: { quote: number; totalExpenses: number; profit: number; margin: number };
  onAddExpense: (e: { description: string; amount: number; invoiceId?: string | null }) => void;
  onUpdateExpense: (id: string, fields: any) => void;
  onDeleteExpense: (id: string) => void;
  onEditJob: () => void;
  onTogglePaid: () => void;
  companyName?: string;
}

interface JobProps {
  job: JobItem;
  selected: boolean;
  onSelect: (id: string) => void;
  getCompanyName: (companyId?: string | null) => string;
  fmtDate: Intl.DateTimeFormat;
  daysUntil: (date: string) => number;
  totals: (job: JobItem) => { quote: number; totalExpenses: number; profit: number; margin: number };
  jobDetailProps: JobDetailProps;
}

export const Job: React.FC<JobProps> = ({
  job,
  selected,
  onSelect,
  getCompanyName,
  fmtDate,
  daysUntil,
  totals,
  jobDetailProps,
}) => {
  const t = totals(job);
  const positive = t.profit >= 0;
  const dLeft = job.dueDate ? daysUntil(job.dueDate) : null;
  const isPaid = !!job.paid;

  return (
    <div>
      <button
        type="button"
        onClick={() => onSelect(job.id)}
        className={`w-full relative group text-left rounded-2xl border px-4 py-4 transition hover:shadow-sm active:scale-[0.99] ${
          selected ? "border-gray-900" : "border-gray-200 hover:border-gray-300"
        }`}
      >
        <span className="absolute top-2 right-2">
          {isPaid ? (
            <CheckCircle2 className="text-emerald-600" size={16} />
          ) : (
            <FileText className="text-orange-500" size={16} />
          )}
        </span>

        <div className="flex items-start justify-between gap-2">
          <div className="pr-6">
            <h3 className="font-medium leading-tight">{job.name}</h3>
            {job.companyId && (
              <p className="mt-1 text-[11px] text-gray-500">
                {getCompanyName(job.companyId)}
              </p>
            )}
            {job.dueDate &&
              (isPaid ? (
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
                    ? `Factura vence en ${dLeft} día${dLeft === 1 ? "" : "s"}`
                    : `Vencido hace ${Math.abs(dLeft!)} día${
                        Math.abs(dLeft!) === 1 ? "" : "s"
                      }`}
                </p>
              ))}
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
            hint={t.quote > 0 ? `${Math.round(t.margin * 100)}%` : undefined}
          />
        </div>
      </button>
      {selected && (
        <div className="mt-4">
          <JobDetail
            job={job}
            {...jobDetailProps}
          />
        </div>
      )}
    </div>
  );
};