import { BankAccount } from './types';
import { supabase } from '@/lib/supabase';
import { ref, computed } from 'vue';

const bankAccounts = ref<BankAccount[]>([]);
const isLoading = ref(false);
const error = ref<string | null>(null);

export const useBankAccountStore = () => {
  const accounts = computed(() => bankAccounts.value);

  // Load all bank accounts from Supabase
  const loadBankAccounts = async () => {
    isLoading.value = true;
    error.value = null;
    
    try {
      const { data, error: supabaseError } = await supabase
        .from('bank_accounts')
        .select('*')
        .order('created_at', { ascending: true });

      if (supabaseError) throw supabaseError;

      bankAccounts.value = data?.map(account => ({
        id: account.id,
        name: account.name,
        bankName: account.bank_name,
        accountType: account.account_type,
        balance: account.balance || undefined,
        color: account.color || undefined
      })) || [];
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load bank accounts';
      console.error('Error loading bank accounts:', err);
    } finally {
      isLoading.value = false;
    }
  };

  // Add a new bank account to Supabase
  const addBankAccount = async (account: Omit<BankAccount, 'id'>) => {
    isLoading.value = true;
    error.value = null;

    try {
      const { data, error: supabaseError } = await supabase
        .from('bank_accounts')
        .insert({
          name: account.name,
          bank_name: account.bankName,
          account_type: account.accountType,
          balance: account.balance || null,
          color: account.color || null
        })
        .select()
        .single();

      if (supabaseError) throw supabaseError;

      const newAccount: BankAccount = {
        id: data.id,
        name: data.name,
        bankName: data.bank_name,
        accountType: data.account_type,
        balance: data.balance || undefined,
        color: data.color || undefined
      };

      bankAccounts.value.push(newAccount);
      return newAccount;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to add bank account';
      console.error('Error adding bank account:', err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  // Remove a bank account from Supabase
  const removeBankAccount = async (id: string) => {
    isLoading.value = true;
    error.value = null;

    try {
      const { error: supabaseError } = await supabase
        .from('bank_accounts')
        .delete()
        .eq('id', id);

      if (supabaseError) throw supabaseError;

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

  // Update a bank account in Supabase
  const updateBankAccount = async (id: string, updates: Partial<BankAccount>) => {
    isLoading.value = true;
    error.value = null;

    try {
      const { data, error: supabaseError } = await supabase
        .from('bank_accounts')
        .update({
          ...(updates.name && { name: updates.name }),
          ...(updates.bankName && { bank_name: updates.bankName }),
          ...(updates.accountType && { account_type: updates.accountType }),
          ...(updates.balance !== undefined && { balance: updates.balance }),
          ...(updates.color !== undefined && { color: updates.color }),
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (supabaseError) throw supabaseError;

      const account = bankAccounts.value.find(acc => acc.id === id);
      if (account && data) {
        Object.assign(account, {
          name: data.name,
          bankName: data.bank_name,
          accountType: data.account_type,
          balance: data.balance || undefined,
          color: data.color || undefined
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
