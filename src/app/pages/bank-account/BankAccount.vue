<template>
  <div :class="$style.bankAccount">
    <!-- Header with account summary -->
    <div :class="$style.header">
      <div :class="$style.accountHeader">
        <div :class="$style.accountInfo">
          <h1 :class="$style.accountTitle">
            {{ selectedBankAccount?.name || t('bankAccount.bankAccount') }}
          </h1>
          <div :class="$style.accountMeta">
            <span :class="$style.bankName">{{ selectedBankAccount?.bankName }}</span>
            <span :class="$style.accountType">{{ getAccountTypeLabel(selectedBankAccount?.accountType) }}</span>
            <span :class="$style.balance">
              {{ t('bankAccount.balance') }}: 
              <Currency :value="currentBalance" />
            </span>
            <span :class="$style.uncleared">
              {{ t('bankAccount.thisMonth') }}: 
              <Currency :value="currentMonthTransactions" />
            </span>
          </div>
        </div>
        <div :class="$style.yearToggle">
          <YearToggle keyPath="bankAccount.transactionsFor" />
        </div>
      </div>
    </div>

    <!-- Action buttons -->
    <div :class="$style.actionBar">
      <Button
        :icon="RiAddLine"
        :text="t('bankAccount.addTransaction')"
        color="primary"
        size="s"
        @click="showAddTransaction = true"
      />
      <Button
        :icon="RiFilterLine"
        :text="t('bankAccount.filter')"
        color="secondary"
        size="s"
        @click="showFilters = !showFilters"
      />
      <Button
        :icon="RiDownloadLine"
        :text="t('bankAccount.export')"
        color="secondary"
        size="s"
        @click="exportTransactions"
      />
    </div>

    <!-- Filters -->
    <div v-if="showFilters" :class="$style.filtersSection">
      <div :class="$style.filters">
        <Select
          :value="selectedCategory"
          :options="categoryOptions"
          :placeholder="t('bankAccount.allCategories')"
          @update:value="selectedCategory = $event"
        />
        <TextField
          :value="searchQuery"
          :placeholder="t('bankAccount.searchTransactions')"
          @update:value="searchQuery = $event"
        />
      </div>
    </div>

    <!-- Transaction table -->
    <div :class="$style.transactionTable">
      <div :class="$style.tableHeader">
        <span :class="$style.colDate">{{ t('bankAccount.date') }}</span>
        <span :class="$style.colPayee">{{ t('bankAccount.payee') }}</span>
        <span :class="$style.colCategory">{{ t('bankAccount.category') }}</span>
        <span :class="$style.colNotes">{{ t('bankAccount.notes') }}</span>
        <span :class="$style.colAmount">{{ t('bankAccount.amount') }}</span>
        <span :class="$style.colActions"></span>
      </div>

      <div v-if="filteredTransactions.length === 0" :class="$style.emptyState">
        <RiInformationLine :class="$style.emptyIcon" />
        <p>{{ t('bankAccount.noTransactions') }}</p>
        <Button
          :icon="RiAddLine"
          :text="t('bankAccount.addFirstTransaction')"
          color="primary"
          @click="showAddTransaction = true"
        />
      </div>

      <div
        v-for="transaction in paginatedTransactions"
        :key="transaction.id"
        :class="$style.tableRow"
      >
        <span :class="$style.colDate">{{ formatDate(transaction.date) }}</span>
        <span :class="$style.colPayee">{{ transaction.payee }}</span>
        <span :class="$style.colCategory">
          <span :class="$style.categoryBadge">{{ transaction.category }}</span>
        </span>
        <span :class="$style.colNotes">{{ transaction.notes || '—' }}</span>
        <span :class="$style.colAmount">
          <Currency :value="transaction.amount" :class="getAmountClass(transaction.amount)" />
        </span>
        <span :class="$style.colActions">
          <Button
            :icon="RiEditLine"
            color="secondary"
            size="s"
            textual
            @click="editTransaction(transaction)"
          />
          <Button
            :icon="RiDeleteBinLine"
            color="danger"
            size="s"
            textual
            @click="deleteTransaction(transaction.id)"
          />
        </span>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" :class="$style.pagination">
      <Button
        :icon="RiArrowLeftSLine"
        :disabled="currentPage === 1"
        textual
        @click="currentPage--"
      />
      <span :class="$style.pageInfo">
        {{ t('bankAccount.pageOf', { current: currentPage, total: totalPages }) }}
      </span>
      <Button
        :icon="RiArrowRightSLine"
        :disabled="currentPage === totalPages"
        textual
        @click="currentPage++"
      />
    </div>

    <!-- Add/Edit Transaction Dialog -->
    <Dialog v-if="showAddTransaction" @close="closeTransactionDialog">
      <template #title>
        {{ editingTransaction ? t('bankAccount.editTransaction') : t('bankAccount.addTransaction') }}
      </template>
      <template #content>
        <div :class="$style.transactionForm">
          <div :class="$style.formRow">
            <TextField
              :value="transactionForm.date"
              :label="t('bankAccount.date')"
              type="date"
              required
              @update:value="transactionForm.date = $event"
            />
            <TextField
              :value="transactionForm.payee"
              :label="t('bankAccount.payee')"
              required
              @update:value="transactionForm.payee = $event"
            />
          </div>
          <div :class="$style.formRow">
            <Select
              :value="transactionForm.category"
              :options="categorySelectOptions"
              :label="t('bankAccount.category')"
              required
              @update:value="transactionForm.category = $event"
            />
            <Select
              :value="transactionForm.type"
              :options="transactionTypeOptions"
              :label="t('bankAccount.type')"
              required
              @update:value="transactionForm.type = $event"
            />
          </div>
          <div :class="$style.formRow">
            <TextField
              :value="transactionForm.amount"
              :label="t('bankAccount.amount')"
              type="number"
              step="0.01"
              required
              @update:value="transactionForm.amount = parseFloat($event) || 0"
            />
          </div>
          <TextField
            :value="transactionForm.notes"
            :label="t('bankAccount.notes')"
            @update:value="transactionForm.notes = $event"
          />
          <div :class="$style.formActions">
            <Button
              :text="t('shared.cancel')"
              color="secondary"
              @click="closeTransactionDialog"
            />
            <Button
              :text="editingTransaction ? t('shared.update') : t('shared.add')"
              color="primary"
              @click="saveTransaction"
            />
          </div>
        </div>
      </template>
    </Dialog>
  </div>
</template>

<script lang="ts" setup>
import YearToggle from '@components/feature/YearToggle.vue';
import Button from '@components/base/button/Button.vue';
import Currency from '@components/base/currency/Currency.vue';
import Dialog from '@components/base/dialog/Dialog.vue';
import TextField from '@components/base/text-field/TextField.vue';
import Select from '@components/base/select/Select.vue';
import {
  RiAddLine,
  RiFilterLine,
  RiDownloadLine,
  RiInformationLine,
  RiEditLine,
  RiDeleteBinLine,
  RiArrowLeftSLine,
  RiArrowRightSLine
} from '@remixicon/vue';
import { useBankAccountStore } from '@store/bank-accounts';
import { Transaction } from '@store/state/transaction-types';
import { useDataStore } from '@store/state';
import { uuid } from '@utils/uuid.ts';
import { computed, ref, reactive } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';

const { state } = useDataStore();
const { t } = useI18n();
const route = useRoute();
const bankAccountStore = useBankAccountStore();

// Get selected bank account
const selectedBankAccountId = computed(() => route.query.accountId as string || '');
const selectedBankAccount = computed(() => {
  if (!selectedBankAccountId.value) return null;
  return bankAccountStore.getBankAccount(selectedBankAccountId.value);
});

// Transaction storage (in real app, this would be in a store)
const transactions = ref<Transaction[]>([]);

// UI state
const showAddTransaction = ref(false);
const showFilters = ref(false);
const editingTransaction = ref<Transaction | null>(null);
const currentPage = ref(1);
const itemsPerPage = 20;

// Filter state
const selectedCategory = ref('');
const searchQuery = ref('');

// Form state
const transactionForm = reactive({
  date: new Date().toISOString().split('T')[0],
  payee: '',
  category: '',
  type: 'expense' as 'expense' | 'income',
  amount: 0,
  notes: ''
});

// Computed values
const currentBalance = computed(() => {
  if (!selectedBankAccount.value) return 0;
  const accountTransactions = transactions.value.filter(t => t.accountId === selectedBankAccountId.value);
  return selectedBankAccount.value.balance + accountTransactions.reduce((sum, t) => {
    return sum + (t.type === 'income' ? t.amount : -t.amount);
  }, 0);
});

const currentMonthTransactions = computed(() => {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  return transactions.value
    .filter(transaction => {
      if (transaction.accountId !== selectedBankAccountId.value) return false;
      const transactionDate = new Date(transaction.date);
      return transactionDate.getMonth() === currentMonth && 
             transactionDate.getFullYear() === currentYear;
    })
    .reduce((total, transaction) => total + (transaction.type === 'income' ? transaction.amount : -transaction.amount), 0);
});

const categoryOptions = computed(() => {
  const options = [{ value: '', label: t('bankAccount.allCategories') }];
  const categories = new Set<string>();
  
  state.expenses.forEach(account => {
    account.budgets.forEach(budget => {
      categories.add(budget.name);
    });
  });
  
  Array.from(categories).forEach(category => {
    options.push({ value: category, label: category });
  });
  
  return options;
});

const categorySelectOptions = computed(() => {
  const categories = new Set<string>();
  state.expenses.forEach(account => {
    account.budgets.forEach(budget => {
      categories.add(budget.name);
    });
  });
  
  return Array.from(categories).map(category => ({
    value: category,
    label: category
  }));
});

const transactionTypeOptions = computed(() => [
  { value: 'expense', label: t('bankAccount.expense') },
  { value: 'income', label: t('bankAccount.income') }
]);

const filteredTransactions = computed(() => {
  return transactions.value.filter(transaction => {
    if (transaction.accountId !== selectedBankAccountId.value) return false;
    if (selectedCategory.value && transaction.category !== selectedCategory.value) {
      return false;
    }
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase();
      return transaction.payee.toLowerCase().includes(query) ||
             transaction.notes?.toLowerCase().includes(query) ||
             transaction.category.toLowerCase().includes(query);
    }
    return true;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
});

const totalPages = computed(() => Math.ceil(filteredTransactions.value.length / itemsPerPage));

const paginatedTransactions = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return filteredTransactions.value.slice(start, end);
});

// Methods
const getAccountTypeLabel = (type?: string) => {
  if (!type) return '';
  return t(`bankAccounts.${type}`);
};

const getAmountClass = (amount: number) => {
  return amount >= 0 ? $style.incomeAmount : $style.expenseAmount;
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString();
};

const resetForm = () => {
  transactionForm.date = new Date().toISOString().split('T')[0];
  transactionForm.payee = '';
  transactionForm.category = '';
  transactionForm.type = 'expense';
  transactionForm.amount = 0;
  transactionForm.notes = '';
};

const closeTransactionDialog = () => {
  showAddTransaction.value = false;
  editingTransaction.value = null;
  resetForm();
};

const saveTransaction = () => {
  if (!selectedBankAccountId.value) return;
  
  if (editingTransaction.value) {
    // Edit existing transaction
    const index = transactions.value.findIndex(t => t.id === editingTransaction.value!.id);
    if (index !== -1) {
      transactions.value[index] = {
        ...editingTransaction.value,
        ...transactionForm,
        accountId: selectedBankAccountId.value
      };
    }
  } else {
    // Add new transaction
    const newTransaction: Transaction = {
      id: uuid(),
      ...transactionForm,
      accountId: selectedBankAccountId.value
    };
    transactions.value.push(newTransaction);
  }
  
  closeTransactionDialog();
};

const editTransaction = (transaction: Transaction) => {
  editingTransaction.value = transaction;
  Object.assign(transactionForm, transaction);
  showAddTransaction.value = true;
};

const deleteTransaction = (id: string) => {
  if (confirm(t('bankAccount.confirmDeleteTransaction'))) {
    const index = transactions.value.findIndex(t => t.id === id);
    if (index !== -1) {
      transactions.value.splice(index, 1);
    }
  }
};

const exportTransactions = () => {
  const accountTransactions = transactions.value.filter(t => t.accountId === selectedBankAccountId.value);
  const data = JSON.stringify(accountTransactions, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${selectedBankAccount.value?.name || 'bank-account'}-transactions-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
};
</script>

<style lang="scss" module>
.bankAccount {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--app-background);
}

.header {
  background: linear-gradient(135deg, #1a365d 0%, #2c5282 100%);
  color: white;
  padding: 20px;
  border-bottom: 2px solid var(--app-border);
}

.accountHeader {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
}

.accountInfo {
  flex: 1;
}

.accountTitle {
  margin: 0 0 12px 0;
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-l);
  color: white;
}

.accountMeta {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: var(--font-size-s);
  
  .bankName {
    color: rgba(255, 255, 255, 0.9);
    font-weight: var(--font-weight-m);
  }
  
  .accountType {
    color: rgba(255, 255, 255, 0.8);
    font-size: var(--font-size-xs);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  .balance, .uncleared {
    color: rgba(255, 255, 255, 0.9);
  }
  
  .balance {
    font-weight: var(--font-weight-m);
  }
}

.yearToggle {
  padding: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: var(--border-radius-m);
}

.actionBar {
  display: flex;
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 1px solid var(--app-border);
  background: var(--app-background-secondary);
}

.filtersSection {
  padding: 16px 20px;
  border-bottom: 1px solid var(--app-border);
  background: var(--app-background-secondary);
}

.filters {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 16px;
  align-items: end;
}

.transactionTable {
  flex: 1;
  overflow-y: auto;
  background: var(--app-background);
}

.tableHeader {
  display: grid;
  grid-template-columns: 100px 1fr 150px 150px 120px 80px;
  gap: 12px;
  padding: 12px 20px;
  background: var(--app-background-secondary);
  border-bottom: 2px solid var(--app-border);
  font-weight: var(--font-weight-m);
  font-size: var(--font-size-xs);
  color: var(--c-text-dimmed);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  position: sticky;
  top: 0;
  z-index: 1;
}

.tableRow {
  display: grid;
  grid-template-columns: 100px 1fr 150px 150px 120px 80px;
  gap: 12px;
  padding: 12px 20px;
  border-bottom: 1px solid var(--app-border);
  font-size: var(--font-size-s);
  transition: background-color 0.2s;
  
  &:hover {
    background: var(--app-background-secondary);
  }
  
  &:nth-child(even) {
    background: rgba(0, 0, 0, 0.02);
    
    &:hover {
      background: var(--app-background-secondary);
    }
  }
}

.colDate {
  font-size: var(--font-size-xs);
  color: var(--c-text-dimmed);
}

.colPayee {
  font-weight: var(--font-weight-m);
}

.colCategory {
  .categoryBadge {
    display: inline-block;
    padding: 4px 8px;
    background: var(--c-primary);
    color: white;
    border-radius: var(--border-radius-s);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-m);
  }
}

.colNotes {
  font-size: var(--font-size-xs);
  color: var(--c-text-dimmed);
}

.colAmount {
  text-align: right;
  
  .expenseAmount {
    font-weight: var(--font-weight-l);
    color: #e53e3e;
  }
  
  .incomeAmount {
    font-weight: var(--font-weight-l);
    color: #38a169;
  }
}

.colActions {
  display: flex;
  gap: 4px;
  justify-content: center;
}

.emptyState {
  text-align: center;
  padding: 80px 20px;
  color: var(--c-text-dimmed);
}

.emptyIcon {
  font-size: 64px;
  margin-bottom: 20px;
  color: var(--c-text-dimmed);
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  border-top: 1px solid var(--app-border);
  background: var(--app-background-secondary);
}

.pageInfo {
  font-size: var(--font-size-s);
  color: var(--c-text-dimmed);
}

.transactionForm {
  min-width: 500px;
}

.formRow {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
}

.formActions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}

@media (max-width: 1024px) {
  .tableHeader,
  .tableRow {
    grid-template-columns: 80px 1fr 120px 100px 100px 60px;
    gap: 8px;
    padding: 8px 12px;
  }
  
  .filters {
    grid-template-columns: 1fr;
  }
  
  .formRow {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .accountHeader {
    flex-direction: column;
    gap: 12px;
  }
  
  .accountMeta {
    gap: 4px;
  }
  
  .actionBar {
    flex-wrap: wrap;
  }
  
  .tableHeader,
  .tableRow {
    grid-template-columns: 1fr;
    gap: 4px;
  }
  
  .tableHeader {
    display: none;
  }
  
  .tableRow {
    display: block;
    padding: 16px;
    
    > span {
      display: block;
      margin-bottom: 4px;
    }
  }
}
</style>
