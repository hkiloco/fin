import { BankAccount } from './types';
import { prisma } from '@/lib/prisma';
import { ref, computed } from 'vue';

const bankAccounts = ref<BankAccount[]>([]);
const isLoading = ref(false);
const error = ref<string | null>(null);

export const useBankAccountStore = () => {
  const accounts = computed(() => bankAccounts.value);

  // Load all bank accounts from Prisma
  const loadBankAccounts = async () => {
    isLoading.value = true;
    error.value = null;
    
    try {
      const accounts = await prisma.bankAccount.findMany({
        orderBy: { createdAt: 'asc' }
      });

      bankAccounts.value = accounts.map(account => ({
        id: account.id,
        name: account.name,
        bankName: account.bankName,
        accountType: account.accountType as 'checking' | 'savings' | 'credit' | 'investment',
        balance: account.balance || undefined,
        color: account.color || undefined
      }));
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load bank accounts';
      console.error('Error loading bank accounts:', err);
    } finally {
      isLoading.value = false;
    }
  };

  // Add a new bank account via Prisma
  const addBankAccount = async (account: Omit<BankAccount, 'id'>) => {
    isLoading.value = true;
    error.value = null;

    try {
      const newAccount = await prisma.bankAccount.create({
        data: {
          name: account.name,
          bankName: account.bankName,
          accountType: account.accountType,
          balance: account.balance || null,
          color: account.color || null
        }
      });

      const formattedAccount: BankAccount = {
        id: newAccount.id,
        name: newAccount.name,
        bankName: newAccount.bankName,
        accountType: newAccount.accountType as 'checking' | 'savings' | 'credit' | 'investment',
        balance: newAccount.balance || undefined,
        color: newAccount.color || undefined
      };

      bankAccounts.value.push(formattedAccount);
      return formattedAccount;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to add bank account';
      console.error('Error adding bank account:', err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  // Remove a bank account via Prisma
  const removeBankAccount = async (id: string) => {
    isLoading.value = true;
    error.value = null;

    try {
      await prisma.bankAccount.delete({
        where: { id }
      });

      const index = bankAccounts.value.findIndex(account => account.id === id);
      if (index !== -1) {
        bankAccounts.value.splice(index, 1);
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to remove bank account';
      console.error('Error removing bank account:', err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  // Update a bank account via Prisma
  const updateBankAccount = async (id: string, updates: Partial<BankAccount>) => {
    isLoading.value = true;
    error.value = null;

    try {
      const updatedAccount = await prisma.bankAccount.update({
        where: { id },
        data: {
          ...(updates.name && { name: updates.name }),
          ...(updates.bankName && { bankName: updates.bankName }),
          ...(updates.accountType && { accountType: updates.accountType }),
          ...(updates.balance !== undefined && { balance: updates.balance }),
          ...(updates.color !== undefined && { color: updates.color })
        }
      });

      const account = bankAccounts.value.find(acc => acc.id === id);
      if (account) {
        Object.assign(account, {
          name: updatedAccount.name,
          bankName: updatedAccount.bankName,
          accountType: updatedAccount.accountType as 'checking' | 'savings' | 'credit' | 'investment',
          balance: updatedAccount.balance || undefined,
          color: updatedAccount.color || undefined
        });
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update bank account';
      console.error('Error updating bank account:', err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const getBankAccount = (id: string) => {
    return bankAccounts.value.find(account => account.id === id);
  };

  return {
    accounts,
    isLoading: computed(() => isLoading.value),
    error: computed(() => error.value),
    loadBankAccounts,
    addBankAccount,
    removeBankAccount,
    updateBankAccount,
    getBankAccount
  };
};
