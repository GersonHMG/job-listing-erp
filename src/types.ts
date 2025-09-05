export interface Expense {
  id: string;
  description: string;
  amount: number;
  createdAt: string; // ISO
}

export interface JobItem {
  id: string;
  name: string;
  quote: number; // CLP
  quoteDate: string; // ISO
  dueDate?: string; // ISO
  paid?: boolean; // true = Pagado, false = Facturado
  expenses: Expense[];
}
