<template>
  <!-- Individual Transactions -->
  <template v-for="(transaction, index) of group.transactions" :key="transaction.id + index">
    <!-- Column 1: Empty span -->
    <span />

    <!-- Column 2: Delete button -->
    <Button
      color="dimmed"
      :disabled="!allowDelete"
      :icon="RiCloseCircleLine"
      textual
      @click="$emit('deleteTransaction', transaction.id)"
    />

    <!-- Column 3: Date -->
    <span
      :class="[
        $style.gridCell,
        {
          [$style.even]: index % 2,
          [$style.firstRow]: index === 0,
          [$style.tlc]: index === 0,
          [$style.blc]: index === group.transactions.length - 1
        }
      ]"
    >
      <DatePicker
        :modelValue="transaction.date"
        @update:model-value="$emit('updateTransaction', transaction.id, 'date', $event)"
      />
    </span>

    <!-- Column 4: Payee -->
    <span
      :class="[
        $style.gridCell,
        {
          [$style.even]: index % 2,
          [$style.firstRow]: index === 0
        }
      ]"
    >
      <TextCell
        :modelValue="transaction.payee"
        @update:model-value="$emit('updateTransaction', transaction.id, 'payee', $event)"
      />
    </span>

    <!-- Column 5: Group -->
    <span
      :class="[
        $style.gridCell,
        {
          [$style.even]: index % 2,
          [$style.firstRow]: index === 0,
          [$style.tlc]: index === 0,
          [$style.blc]: index === group.transactions.length - 1
        }
      ]"
    >
      <InlineSelect
        :modelValue="transaction.group"
        :options="getGroupOptions()"
        placeholder="Select group..."
        @update:model-value="$emit('updateTransaction', transaction.id, 'group', $event)"
      />
    </span>

    <!-- Column 6: Category -->
    <span
      :class="[
        $style.gridCell,
        {
          [$style.even]: index % 2,
          [$style.firstRow]: index === 0
        }
      ]"
    >
      <InlineSelect
        :modelValue="transaction.category"
        :options="getCategoryOptions(transaction.group)"
        :disabled="!transaction.group"
        placeholder="Select category..."
        @update:model-value="$emit('updateTransaction', transaction.id, 'category', $event)"
      />
    </span>

    <!-- Column 7: Amount -->
    <span
      :class="[
        $style.gridCell,
        {
          [$style.even]: index % 2,
          [$style.firstRow]: index === 0,
          [$style.trc]: index === 0,
          [$style.brc]: index === group.transactions.length - 1
        }
      ]"
    >
      <CurrencyCell
        :testId="`${testId}-transaction-${index}-amount`"
        :modelValue="transaction.amount"
        @update:model-value="$emit('updateTransaction', transaction.id, 'amount', $event)"
      />
      <Currency :testId="`${testId}-transaction-${index}-total`" :class="$style.meta" :value="transaction.amount" />
    </span>

    <!-- Column 8: Empty span -->
    <span />

    <!-- Column 9: Empty span -->
    <span />
  </template>


</template>

<script lang="ts" setup>
import Button from '@components/base/button/Button.vue';
import Currency from '@components/base/currency/Currency.vue';
import CurrencyCell from '@components/base/currency-cell/CurrencyCell.vue';

import TextCell from '@components/base/text-cell/TextCell.vue';
import InlineSelect from '@components/base/inline-select/InlineSelect.vue';
import DatePicker from '@components/base/date-picker/DatePicker.vue';
import { RiCloseCircleLine } from '@remixicon/vue';
import { useDataStore } from '@store/state';
import { useTransactionStore, type Transaction } from '@store/transactions';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

interface TransactionGroup {
  payee: string;
  transactions: Transaction[];
  total: number;
}

const props = defineProps<{
  group: TransactionGroup;
  testId: string;
  allowDelete: boolean;
}>();

const emit = defineEmits<{
  updateTransaction: [id: string, field: string, value: string | number];
  deleteTransaction: [id: string];
}>();

const { t } = useI18n();
const transactionStore = useTransactionStore();
const { state: dataState } = useDataStore();

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString();
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
.header {
  font-style: italic;
  font-size: var(--input-field-font-size);
  font-weight: var(--font-weight-m);
}

.meta {
  font-size: var(--input-field-font-size);
  font-weight: var(--font-weight-m);
  padding: 0 10px;

  &.bold {
    position: relative;
    font-weight: var(--font-weight-l);
    text-decoration: underline;
  }
}

.top {
  background: var(--c-primary);
  color: var(--c-text-light);
  display: inline-block;
  font-size: var(--input-field-font-size);
  font-weight: var(--font-weight-m);
  margin: 4px 0;
  padding: 5px 0;

  > span {
    display: inline-block;
    padding: 0 4px;
  }

  &.start {
    border-radius: 6px 0 0 6px;
    padding: 5px 4px 5px 8px;
    cursor: text;
  }

  &.end {
    border-radius: 0 6px 6px 0;
    padding: 5px 8px 5px 0;
  }
}

.gridCell {
  display: flex;
  align-items: center;
  background: var(--grid-background-odd);
  height: 100%;
  border-right: 1px solid var(--grid-border-color);
  border-bottom: 1px solid var(--grid-border-color);
  transition: background-color var(--input-field-transition);
  box-shadow: inset 0 0 0 1px transparent;

  &.firstRow {
    border-top: 1px solid var(--grid-border-color);
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
</style>
