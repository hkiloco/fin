import { ref, computed } from 'vue';
import { uuid } from '@utils/uuid.ts';

export interface Transaction {
  id: string;
  bankAccountId: string;
  date: string;
  payee: string;
  category: string;
  notes?: string;
  amount: number;
  type: 'income' | 'expense';
  createdAt: string;
  updatedAt: string;
}

const transactions = ref<Transaction[]>([]);

export const useTransactionStore = () => {
  const allTransactions = computed(() => transactions.value);

  // Get transactions for specific bank account
  const getTransactionsByAccountId = (accountId: string) => {
    return computed(() => 
      transactions.value.filter(t => t.bankAccountId === accountId)
    );
  };

  // Calculate total balance for a bank account (including transactions)
  const getAccountBalance = (accountId: string, initialBalance: number = 0) => {
    return computed(() => {
      const accountTransactions = transactions.value.filter(t => t.bankAccountId === accountId);
      const transactionTotal = accountTransactions.reduce((sum, t) => sum + t.amount, 0);
      return initialBalance + transactionTotal;
    });
  };

  // Calculate income total for a bank account
  const getAccountIncome = (accountId: string) => {
    return computed(() => {
      const accountTransactions = transactions.value.filter(t => 
        t.bankAccountId === accountId && t.amount > 0
      );
      return accountTransactions.reduce((sum, t) => sum + t.amount, 0);
    });
  };

  // Calculate expense total for a bank account
  const getAccountExpenses = (accountId: string) => {
    return computed(() => {
      const accountTransactions = transactions.value.filter(t => 
        t.bankAccountId === accountId && t.amount < 0
      );
      return Math.abs(accountTransactions.reduce((sum, t) => sum + t.amount, 0));
    });
  };

  // Get total across all accounts
  const getTotalBalance = (bankAccounts: any[]) => {
    return computed(() => {
      return bankAccounts.reduce((total, account) => {
        const accountTotal = getAccountBalance(account.id, account.balance || 0).value;
        return total + accountTotal;
      }, 0);
    });
  };

  // Add new transaction
  const addTransaction = (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: uuid(),
      type: transaction.amount > 0 ? 'income' : 'expense',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    transactions.value.push(newTransaction);
    return newTransaction;
  };

  // Update transaction
  const updateTransaction = (id: string, updates: Partial<Omit<Transaction, 'id' | 'createdAt'>>) => {
    const transaction = transactions.value.find(t => t.id === id);
    if (transaction) {
      Object.assign(transaction, {
        ...updates,
        type: (updates.amount ?? transaction.amount) > 0 ? 'income' : 'expense',
        updatedAt: new Date().toISOString()
      });
    }
  };

  // Delete transaction
  const deleteTransaction = (id: string) => {
    const index = transactions.value.findIndex(t => t.id === id);
    if (index !== -1) {
      transactions.value.splice(index, 1);
    }
  };

  // Get transactions by date range
  const getTransactionsByDateRange = (accountId: string, startDate: string, endDate: string) => {
    return computed(() => 
      transactions.value.filter(t => 
        t.bankAccountId === accountId &&
        t.date >= startDate &&
        t.date <= endDate
      )
    );
  };

  // Get summary statistics for an account
  const getAccountSummary = (accountId: string) => {
    return computed(() => {
      const accountTransactions = transactions.value.filter(t => t.bankAccountId === accountId);
      const income = accountTransactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
      const expenses = Math.abs(accountTransactions.filter(t => t.amount < 0).reduce((sum, t) => sum + t.amount, 0));
      const net = income - expenses;
      
      return {
        totalTransactions: accountTransactions.length,
        income,
        expenses,
        net,
        averageTransaction: accountTransactions.length > 0 ? 
          accountTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0) / accountTransactions.length : 0
      };
    });
  };

  return {
    allTransactions,
    getTransactionsByAccountId,
    getAccountBalance,
    getAccountIncome,
    getAccountExpenses,
    getTotalBalance,
    getTransactionsByDateRange,
    getAccountSummary,
    addTransaction,
    updateTransaction,
    deleteTransaction
  };
};
