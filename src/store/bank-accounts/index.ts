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

  return {
    accounts,
    addBankAccount,
    removeBankAccount,
    updateBankAccount,
    getBankAccount
  };
};
