export interface Company {
  id: string;
  name: string;
  rut?: string;
}

export interface Invoice {
  id: string;
  jobId: string;
  companyId?: string;
  number: string;
  issueDate: string; // ISO
  dueDate: string; // ISO
  net: number;
  vat: number;
  total: number;
  paid: boolean;
}

export interface Expense {
  id: string;
  jobId: string;
  description: string;
  amount: number;
  createdAt: string; // ISO
  invoiceId?: string | null;
}

export interface JobItem {
  id: string;
  name: string;
  quote: number; // CLP
  quoteDate: string; // ISO
  dueDate?: string; // ISO
  paid?: boolean; // true = Pagado, false = Facturado
  companyId?: string;
  invoices?: Invoice[];
  expenses: Expense[];
}

export interface AppData {
  jobs: JobItem[];
  companies: Company[];
}
