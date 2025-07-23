import { ref, computed } from 'vue';
import { uuid } from '@utils/uuid.ts';

export interface Transaction {
  id: string;
  bankAccountId: string;
  date: string;
  payee: string;
  group: string;        // Maps to BudgetGroup (e.g., "Home", "Transportation")
  category: string;     // Maps to Budget within group (e.g., "Rent/mortgage", "Food")
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
  const addTransaction = (transaction: Omit<Transaction, 'id' | 'type' | 'createdAt' | 'updatedAt'>) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: uuid(),
      type: transaction.amount >= 0 ? 'income' : 'expense',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    transactions.value.push(newTransaction);
    return newTransaction;
  };

  // Update transaction
  const updateTransaction = (id: string, updates: Partial<Omit<Transaction, 'id'>>) => {
    const transaction = transactions.value.find(t => t.id === id);
    if (transaction) {
      const newAmount = updates.amount ?? transaction.amount;

      // Only update updatedAt if we're not updating createdAt (for reordering)
      const updateData = {
        ...updates,
        type: newAmount >= 0 ? 'income' : 'expense'
      };

      if (!updates.createdAt) {
        updateData.updatedAt = new Date().toISOString();
      }

      Object.assign(transaction, updateData);
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

  // Get transactions by group and category for budget integration
  const getTransactionsByBudgetCategory = (group: string, category: string, year?: number) => {
    return computed(() => {
      let filtered = transactions.value.filter(t => t.group === group && t.category === category);

      if (year) {
        filtered = filtered.filter(t => new Date(t.date).getFullYear() === year);
      }

      return filtered;
    });
  };

  // Calculate actual spending for a budget category
  const getActualSpendingForBudget = (group: string, category: string, year: number, month?: number) => {
    return computed(() => {
      let filtered = transactions.value.filter(t =>
        t.group === group &&
        t.category === category &&
        new Date(t.date).getFullYear() === year
      );

      if (month !== undefined) {
        filtered = filtered.filter(t => new Date(t.date).getMonth() === month);
      }

      return Math.abs(filtered.reduce((sum, t) => sum + (t.amount < 0 ? t.amount : 0), 0));
    });
  };

  // Get available groups from existing transactions
  const getAvailableGroups = computed(() => {
    const groups = [...new Set(transactions.value.map(t => t.group))].filter(Boolean);
    return groups.sort();
  });

  // Get available categories for a group
  const getAvailableCategoriesForGroup = (group: string) => {
    return computed(() => {
      const categories = [...new Set(
        transactions.value
          .filter(t => t.group === group)
          .map(t => t.category)
      )].filter(Boolean);
      return categories.sort();
    });
  };

  // Get all transactions across all accounts
  const getAllTransactions = () => {
    return computed(() => transactions.value);
  };

  return {
    allTransactions,
    getAllTransactions,
    getTransactionsByAccountId,
    getAccountBalance,
    getAccountIncome,
    getAccountExpenses,
    getTotalBalance,
    getTransactionsByDateRange,
    getAccountSummary,
    getTransactionsByBudgetCategory,
    getActualSpendingForBudget,
    getAvailableGroups,
    getAvailableCategoriesForGroup,
    addTransaction,
    updateTransaction,
    deleteTransaction
  };
};
