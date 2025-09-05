import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2 } from "lucide-react";
import { type JobItem } from "../types";
import {
  parseNumber,
  addMonths,
  formatNumberCL,
} from "../utils";
import { MoneyInput, DateDMYInput } from "./inputs";

export function JobModal({
  open,
  onClose,
  onSubmit,
  onDelete,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (job: Partial<JobItem>) => void;
  onDelete: (id: string) => void;
  initial?: JobItem;
}) {
  const [name, setName] = useState<string>(initial?.name || "");
  const [quoteDisp, setQuoteDisp] = useState<string>(
    initial?.quote ? formatNumberCL(parseNumber(initial.quote)) : ""
  );
  const [quote, setQuote] = useState<number>(parseNumber(initial?.quote || ""));
  const [date, setDate] = useState<string>(() =>
    initial?.quoteDate
      ? new Date(initial.quoteDate).toISOString()
      : new Date().toISOString()
  );
  const [dueDate, setDueDate] = useState<string>(() =>
    initial?.dueDate
      ? new Date(initial.dueDate).toISOString()
      : addMonths(new Date().toISOString(), 1)
  );
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
      setQuoteDisp(
        initial.quote ? formatNumberCL(parseNumber(initial.quote)) : ""
      );
      setQuote(parseNumber(initial.quote || ""));
      setDate(new Date(initial.quoteDate).toISOString());
      setDueDate(
        initial.dueDate
          ? new Date(initial.dueDate).toISOString()
          : addMonths(initial.quoteDate, 1)
      );
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
    onSubmit({
      name: name.trim(),
      quote: val,
      quoteDate: new Date(date).toISOString(),
      dueDate: new Date(dueDate).toISOString(),
      paid,
    });
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
            <h3 className="font-semibold">
              {initial ? "Editar trabajo" : "Nuevo trabajo"}
            </h3>
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
                <label className="text-xs text-gray-500">
                  Fecha de la cotización (dd/mm/aaaa)
                </label>
                <DateDMYInput value={date} onChange={(iso) => setDate(iso)} />
              </div>
              <div>
                <label className="text-xs text-gray-500">
                  Vencimiento factura (dd/mm/aaaa)
                </label>
                <DateDMYInput
                  value={dueDate}
                  onChange={(iso) => {
                    setDueTouched(true);
                    setDueDate(iso);
                  }}
                />
              </div>
            </div>

            <div className="flex items-center gap-2 mt-1">
              <input
                id="paid"
                type="checkbox"
                checked={paid}
                onChange={(e) => setPaid(e.target.checked)}
                className="rounded border-gray-300"
              />
              <label htmlFor="paid" className="text-sm">
                Pagado (si está off queda como
                <span className="font-medium"> Facturado</span>)
              </label>
            </div>

            {error && <p className="text-xs text-rose-600">{error}</p>}

            <div className="flex items-center justify-between gap-2">
              {initial ? (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm("¿Eliminar este trabajo?")) onDelete(initial.id);
                  }}
                  className="text-xs rounded-xl border px-3 py-2 hover:bg-gray-50 inline-flex items-center gap-1 text-rose-600 border-rose-200"
                >
                  <Trash2 size={14} /> Eliminar trabajo
                </button>
              ) : (
                <span />
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-2xl border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-2xl border border-gray-900 bg-gray-900 px-4 py-2 text-sm hover:bg-black"
                >
                  {initial ? "Guardar cambios" : "Guardar"}
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
  );
}
