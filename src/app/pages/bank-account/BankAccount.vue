<template>
  <div v-if="!accountSlug || !selectedBankAccount" :class="$style.errorState">
    <h2>{{ t('bankAccount.noAccountFound') }}</h2>
    <p>{{ t('bankAccount.noAccountFoundMessage') }}</p>
    <Button :text="t('common.goBack')" @click="$router.push('/')" />
  </div>
  <div v-else :class="$style.bankAccount">
    <!-- Header -->
    <div :class="$style.header">
      <div :class="$style.headerTitle">
        <RiMoneyDollarCircleLine
          v-if="selectedBankAccount?.name?.toLowerCase() === 'cash'"
          :class="$style.headerIcon"
        />
        <RiBankLine
          v-else
          :class="$style.headerIcon"
        />
        <h1 :class="$style.bankName">{{ selectedBankAccount?.bankName || t('bankAccount.bankAccount') }}</h1>
      </div>
      <div :class="$style.accountInfo">
        <span :class="$style.accountName">{{ selectedBankAccount?.name }}</span>
        <span :class="$style.accountType">{{ getAccountTypeLabel(selectedBankAccount?.accountType) }}</span>
        <span :class="$style.balance">
          {{ t('bankAccount.balance') }}: <Currency :value="accountBalance" />
        </span>
      </div>

      <!-- Transaction Summary -->
      <div v-if="accountSummary" :class="$style.summaryCards">
        <div :class="$style.summaryCard">
          <span :class="$style.summaryLabel">{{ t('bankAccount.totalIncome') }}</span>
          <span :class="[$style.summaryValue, $style.income]">
            <Currency :value="accountSummary.income" />
          </span>
        </div>
        <div :class="$style.summaryCard">
          <span :class="$style.summaryLabel">{{ t('bankAccount.totalExpenses') }}</span>
          <span :class="[$style.summaryValue, $style.expense]">
            <Currency :value="accountSummary.expenses" />
          </span>
        </div>
        <div :class="$style.summaryCard">
          <span :class="$style.summaryLabel">{{ t('bankAccount.netChange') }}</span>
          <span :class="[$style.summaryValue, accountSummary.net >= 0 ? $style.income : $style.expense]">
            <Currency :value="accountSummary.net" />
          </span>
        </div>
        <div :class="$style.summaryCard">
          <span :class="$style.summaryLabel">{{ t('bankAccount.transactionCount') }}</span>
          <span :class="$style.summaryValue">{{ accountSummary.totalTransactions }}</span>
        </div>
      </div>
    </div>

    <!-- Transaction Grid -->
    <div :class="$style.transactionGrid">
      <div :class="$style.gridActions">
        <Button
          :icon="RiAddLine"
          :text="t('bankAccount.addTransaction')"
          color="primary"
          size="s"
          @click="addNewTransaction"
        />
      </div>

      <div :class="$style.grid">
        <!-- Grid Header -->
        <div
          v-for="(header, colIndex) in gridHeaders"
          :key="`header-${colIndex}`"
          :class="[
            $style.gridCell,
            $style.headerCell,
            {
              [$style.tlc]: colIndex === 0,
              [$style.trc]: colIndex === gridHeaders.length - 1
            }
          ]"
        >
          {{ header }}
        </div>

        <!-- Grid Rows -->
        <template v-for="(transaction, rowIndex) in transactions" :key="transaction.id">
          <div
            :class="[
              $style.gridCell,
              {
                [$style.even]: rowIndex % 2 === 1,
                [$style.blc]: rowIndex === transactions.length - 1,
                [$style.tlc]: rowIndex === 0 && gridHeaders.length === 0
              }
            ]"
          >
            <DatePicker
              :modelValue="transaction.date"
              @update:model-value="updateTransaction(transaction.id, 'date', $event)"
            />
          </div>

          <div
            :class="[
              $style.gridCell,
              {
                [$style.even]: rowIndex % 2 === 1
              }
            ]"
          >
            <TextCell
              :modelValue="transaction.payee"
              @update:model-value="updateTransaction(transaction.id, 'payee', $event)"
            />
          </div>

          <div
            :class="[
              $style.gridCell,
              {
                [$style.even]: rowIndex % 2 === 1
              }
            ]"
          >
            <InlineSelect
              v-model="transaction.group"
              :options="getGroupOptions()"
              placeholder="Select group..."
              @update:model-value="updateTransaction(transaction.id, 'group', $event)"
            />
          </div>

          <div
            :class="[
              $style.gridCell,
              {
                [$style.even]: rowIndex % 2 === 1
              }
            ]"
          >
            <InlineSelect
              v-model="transaction.category"
              :options="getCategoryOptions(transaction.group)"
              :disabled="!transaction.group"
              placeholder="Select category..."
              @update:model-value="updateTransaction(transaction.id, 'category', $event)"
            />
          </div>

          <div
            :class="[
              $style.gridCell,
              {
                [$style.even]: rowIndex % 2 === 1,
                [$style.brc]: rowIndex === transactions.length - 1,
                [$style.trc]: rowIndex === 0 && gridHeaders.length === 0
              }
            ]"
          >
            <CurrencyCell
              :modelValue="transaction.amount"
              @update:model-value="updateTransaction(transaction.id, 'amount', $event)"
            />
          </div>

          <div :class="$style.actionCell">
            <Button
              :icon="RiDeleteBinLine"
              color="danger"
              size="s"
              textual
              @click="deleteTransaction(transaction.id)"
            />
          </div>
        </template>

        <!-- Empty state -->
        <div v-if="transactions.length === 0" :class="$style.emptyGrid">
          <p>{{ t('bankAccount.noTransactions') }}</p>
          <Button
            :icon="RiAddLine"
            :text="t('bankAccount.addFirstTransaction')"
            color="primary"
            @click="addNewTransaction"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import Button from '@components/base/button/Button.vue';
import Currency from '@components/base/currency/Currency.vue';
import CurrencyCell from '@components/base/currency-cell/CurrencyCell.vue';
import DatePicker from '@components/base/date-picker/DatePicker.vue';
import InlineSelect from '@components/base/inline-select/InlineSelect.vue';
import TextCell from '@components/base/text-cell/TextCell.vue';
import {
  RiAddLine,
  RiDeleteBinLine,
  RiMoneyDollarCircleLine,
  RiBankLine
} from '@remixicon/vue';
import { useBankAccountStore } from '@store/bank-accounts';
import { useDataStore } from '@store/state';
import { useTransactionStore, type Transaction } from '@store/transactions';
import { findAccountBySlug } from '@utils/bankAccountRoutes.ts';
import { uuid } from '@utils/uuid.ts';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';

const { t } = useI18n();
const route = useRoute();
const $router = useRouter();
const bankAccountStore = useBankAccountStore();
const transactionStore = useTransactionStore();
const { state: dataState } = useDataStore();

// Get selected bank account from route parameter
const accountSlug = computed(() => route.params.accountSlug as string || '');
const selectedBankAccount = computed(() => {
  if (!accountSlug.value) return null;
  return findAccountBySlug(bankAccountStore.accounts.value, accountSlug.value);
});

// Get transactions for current account
const transactions = computed(() => {
  if (!selectedBankAccount.value) return [];
  return transactionStore.getTransactionsByAccountId(selectedBankAccount.value.id).value;
});

// Computed values
const accountBalance = computed(() => {
  if (!selectedBankAccount.value) return 0;
  return transactionStore.getAccountBalance(selectedBankAccount.value.id, selectedBankAccount.value.balance || 0).value;
});

// Account summary statistics
const accountSummary = computed(() => {
  if (!selectedBankAccount.value) return null;
  return transactionStore.getAccountSummary(selectedBankAccount.value.id).value;
});

// Methods for transaction management
const getAccountTypeLabel = (type?: string) => {
  if (!type) return '';
  return t(`bankAccounts.${type}`);
};

const addNewTransaction = () => {
  if (!selectedBankAccount.value) return;

  transactionStore.addTransaction({
    bankAccountId: selectedBankAccount.value.id,
    date: new Date().toISOString().split('T')[0],
    payee: '',
    group: '',
    category: '',
    amount: 0
  });
};

const updateTransaction = (id: string, field: string, value: string | number) => {
  const updates: any = {};

  if (field === 'amount') {
    updates[field] = typeof value === 'string' ? parseFloat(value) || 0 : value;
  } else {
    updates[field] = value;
  }

  transactionStore.updateTransaction(id, updates);
};

const deleteTransaction = (id: string) => {
  if (confirm(t('bankAccount.confirmDeleteTransaction'))) {
    transactionStore.deleteTransaction(id);
  }
};

// Helper functions for group and category options
const getGroupOptions = () => {
  const currentYear = new Date().getFullYear();
  const currentYearData = dataState.years.find(y => y.year === currentYear);

  if (!currentYearData) return [];

  const incomeGroups = currentYearData.income || [];
  const expenseGroups = currentYearData.expenses || [];
  const existingGroups = transactionStore.getAvailableGroups.value;

  const allGroups = new Set([
    ...incomeGroups.map(g => g.name),
    ...expenseGroups.map(g => g.name),
    ...existingGroups
  ]);

  return Array.from(allGroups).sort().map(name => ({
    id: name,
    label: name
  }));
};

const getCategoryOptions = (groupName: string) => {
  if (!groupName) return [];

  const currentYear = new Date().getFullYear();
  const currentYearData = dataState.years.find(y => y.year === currentYear);

  if (!currentYearData) return [];

  const incomeGroups = currentYearData.income || [];
  const expenseGroups = currentYearData.expenses || [];
  const allBudgetGroups = [...incomeGroups, ...expenseGroups];

  const budgetGroup = allBudgetGroups.find(g => g.name === groupName);
  const budgetCategories = budgetGroup ? budgetGroup.budgets.map(b => b.name) : [];

  const existingCategories = transactionStore.getAvailableCategoriesForGroup(groupName).value;

  const allCategories = new Set([
    ...budgetCategories,
    ...existingCategories
  ]);

  return Array.from(allCategories).sort().map(name => ({
    id: name,
    label: name
  }));
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

.headerTitle {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.headerIcon {
  font-size: 32px;
  color: rgba(255, 255, 255, 0.9);
}

.bankName {
  margin: 0;
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-l);
  color: white;
}

.accountInfo {
  display: flex;
  gap: 20px;
  font-size: var(--font-size-s);
  color: rgba(255, 255, 255, 0.9);
}

.accountName {
  font-weight: var(--font-weight-m);
}

.accountType {
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-size: var(--font-size-xs);
}

.balance {
  font-weight: var(--font-weight-m);
}

.summaryCards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin: 20px 0;
  padding: 0 24px;
}

.summaryCard {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.summaryLabel {
  color: rgba(255, 255, 255, 0.8);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-l);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.summaryValue {
  color: white;
  font-size: var(--font-size-l);
  font-weight: var(--font-weight-xl);

  &.income {
    color: #10B981;
  }

  &.expense {
    color: #EF4444;
  }
}

.transactionContainer {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.tableActions {
  padding: 16px 20px;
  border-bottom: 1px solid var(--app-border);
  background: var(--app-background-secondary);
}

.transactionTable {
  flex: 1;
  overflow-y: auto;
}

.tableHeader {
  display: grid;
  grid-template-columns: 110px 2fr 150px 150px 120px 50px;
  gap: 0;
  background: var(--grid-header-background);
  color: var(--grid-header-text);
  font-weight: var(--font-weight-l);
  font-size: var(--font-size-xs);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  position: sticky;
  top: 0;
  z-index: 1;

  > span {
    display: flex;
    align-items: center;
    padding: 12px 8px;
    border-right: 1px solid var(--grid-border-color);
    border-bottom: 2px solid var(--grid-border-color);
    border-top: 1px solid var(--grid-border-color);

    &:first-child {
      border-left: 1px solid var(--grid-border-color);
    }
  }
}

.tableRow {
  display: grid;
  grid-template-columns: 110px 2fr 150px 150px 120px 50px;
  gap: 0;
  align-items: stretch;
  min-height: 40px;
}

.currencyCell {
  display: flex;
  align-items: center;
  background: var(--grid-background-odd);
  height: 100%;
  border-right: 1px solid var(--grid-border-color);
  border-bottom: 1px solid var(--grid-border-color);
  transition: background-color var(--input-field-transition);
  box-shadow: inset 0 0 0 1px transparent;
  padding: 0 8px;
  font-size: var(--font-size-xs);

  &.firstRow {
    border-top: 1px solid var(--grid-border-color);
  }

  &.firstColumn {
    border-left: 1px solid var(--grid-border-color);
  }

  &:focus-within {
    box-shadow: 0 0 0 2px var(--c-primary) inset;
    border-radius: 1px;
  }

  &.even {
    background: var(--grid-background-even);
  }

  &.tlc {
    border-top-left-radius: var(--grid-border-radius);
  }

  &.trc {
    border-top-right-radius: var(--grid-border-radius);
  }

  &.blc {
    border-bottom-left-radius: var(--grid-border-radius);
  }

  &.brc {
    border-bottom-right-radius: var(--grid-border-radius);
  }
}

.colActions {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 48px;
  background: var(--app-background-secondary);
  border-bottom: 1px solid var(--app-border);
}

.emptyState {
  text-align: center;
  padding: 80px 20px;
  color: var(--c-text-dimmed);

  p {
    margin-bottom: 16px;
  }
}

@media (max-width: 768px) {
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
      margin-bottom: 8px;

      &:before {
        content: attr(data-label) ': ';
        font-weight: var(--font-weight-m);
        color: var(--c-text-dimmed);
        font-size: var(--font-size-xs);
      }
    }
  }
}

.errorState {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 40px;
  text-align: center;
  color: var(--theme-text);

  h2 {
    margin-bottom: 16px;
    color: var(--c-danger);
  }

  p {
    margin-bottom: 24px;
    color: var(--c-dimmed);
  }
}
</style>
