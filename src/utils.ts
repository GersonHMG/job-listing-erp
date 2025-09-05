// Formato de moneda y fechas
export const currency = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
  currencyDisplay: "narrowSymbol",
});

export const numberCL = new Intl.NumberFormat("es-CL", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export const fmtDate = new Intl.DateTimeFormat("es-CL", { dateStyle: "medium" });

// Helpers numéricos y de fechas
export const parseNumber = (val: unknown): number => {
  if (typeof val === "number") return val;
  if (!val) return 0;
  const cleaned = String(val)
    .replace(/\s|\$|CLP/gi, "")
    .replace(/\./g, "")
    .replace(/,/g, ".");
  const n = Number(cleaned);
  return isNaN(n) ? 0 : n;
};

export const formatNumberCL = (val: number): string => numberCL.format(val);

// dd/mm/aaaa -> ISO
export const dmyToISO = (dmy: string): string => {
  if (!dmy) return "";
  const m = String(dmy).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return "";
  const [, dd, mm, yyyy] = m;
  const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  if (isNaN(d.getTime())) return "";
  return d.toISOString();
};

// ISO -> dd/mm/aaaa
export const isoToDMY = (iso: string): string => {
  if (!iso) return "";
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

export const addMonths = (isoDate: string, months = 1): string => {
  const d = new Date(isoDate);
  const nd = new Date(d.getFullYear(), d.getMonth() + months, d.getDate());
  return nd.toISOString();
};

export const daysUntil = (isoDate: string): number => {
  const now = new Date();
  const d = new Date(isoDate);
  const ms = d.setHours(0, 0, 0, 0) - now.setHours(0, 0, 0, 0);
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
};

// Storage & util ids
export const storageKey = "joblist-erp-jobs";
export const rid = () =>
  typeof globalThis.crypto?.randomUUID === "function"
    ? globalThis.crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
