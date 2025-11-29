export interface BankAccount {
  id: string;
  name: string;
  bankName: string;
  accountType: 'checking' | 'savings' | 'credit' | 'investment';
  balance?: number;
  color?: string;
}

export interface BankAccountStore {
  accounts: BankAccount[];
}
