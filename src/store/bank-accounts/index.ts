import { BankAccount } from './types';
import { useTransactionStore } from '@store/transactions';
import { uuid } from '@utils/uuid.ts';
import { ref, computed } from 'vue';

const bankAccounts = ref<BankAccount[]>([]);

export const useBankAccountStore = () => {
  const transactionStore = useTransactionStore();
  const accounts = computed(() => bankAccounts.value);

  const addBankAccount = (account: Omit<BankAccount, 'id'>) => {
    const newAccount: BankAccount = {
      ...account,
      id: uuid()
    };
    bankAccounts.value.push(newAccount);
    return newAccount;
  };

  const removeBankAccount = (id: string) => {
    const index = bankAccounts.value.findIndex(account => account.id === id);
    if (index !== -1) {
      bankAccounts.value.splice(index, 1);
    }
  };

  const updateBankAccount = (id: string, updates: Partial<BankAccount>) => {
    const account = bankAccounts.value.find(acc => acc.id === id);
    if (account) {
      Object.assign(account, updates);
    }
  };

  const getBankAccount = (id: string) => {
    return bankAccounts.value.find(account => account.id === id);
  };

  // Get account with current balance (including transactions)
  const getBankAccountWithBalance = (id: string) => {
    const account = getBankAccount(id);
    if (!account) return null;

    const currentBalance = transactionStore.getAccountBalance(id, account.balance || 0).value;
    return {
      ...account,
      currentBalance
    };
  };

  // Get all accounts with their current balances
  const getAccountsWithBalances = computed(() => {
    return bankAccounts.value.map(account => ({
      ...account,
      currentBalance: transactionStore.getAccountBalance(account.id, account.balance || 0).value,
      income: transactionStore.getAccountIncome(account.id).value,
      expenses: transactionStore.getAccountExpenses(account.id).value,
      transactionCount: transactionStore.getTransactionsByAccountId(account.id).value.length
    }));
  });

  // Get total portfolio balance
  const getTotalPortfolioBalance = computed(() => {
    return transactionStore.getTotalBalance(bankAccounts.value).value;
  });

  // Get portfolio summary
  const getPortfolioSummary = computed(() => {
    const accounts = getAccountsWithBalances.value;
    const totalBalance = getTotalPortfolioBalance.value;
    const totalIncome = accounts.reduce((sum, acc) => sum + acc.income, 0);
    const totalExpenses = accounts.reduce((sum, acc) => sum + acc.expenses, 0);

    return {
      totalBalance,
      totalIncome,
      totalExpenses,
      netChange: totalIncome - totalExpenses,
      accountCount: accounts.length,
      accounts: accounts
    };
  });

  return {
    accounts,
    getAccountsWithBalances,
    getTotalPortfolioBalance,
    getPortfolioSummary,
    addBankAccount,
    removeBankAccount,
    updateBankAccount,
    getBankAccount,
    getBankAccountWithBalance
  };
};
