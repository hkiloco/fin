export interface Transaction {
  id: string;
  date: string;
  payee: string;
  category: string;
  accountId: string;
  amount: number;
  notes?: string;
  type: 'expense' | 'income';
}

export interface TransactionStore {
  transactions: Transaction[];
}
