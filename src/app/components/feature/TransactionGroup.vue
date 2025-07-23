<template>
  <!-- Header -->
  <Button
    color="dimmed"
    :disabled="!allowDelete"
    :icon="RiCloseCircleLine"
    textual
    @click="deletePayeeGroup"
  />

  <span :class="[$style.top, $style.start]">
    <span>{{ formatDate(group.transactions[0]?.date || '') }}</span>
  </span>

  <TextCell
    :class="$style.top"
    :modelValue="group.payee"
    inline
    @update:model-value="updatePayeeName($event)"
  />

  <span :class="$style.top">
    <Currency :value="group.total" :testId="`${testId}-total`" />
  </span>

  <span :class="$style.top">
    <Currency :value="group.total" :testId="`${testId}-total`" />
  </span>

  <span :class="[$style.top, $style.end]">
    <span>{{ t('shared.total') }}</span>
  </span>

  <!-- Individual Transactions -->
  <template v-for="(transaction, index) of group.transactions" :key="transaction.id + index">
    <Draggable
      :id="transaction.id"
      :target="['transaction-group', 'transaction-groups']"
      name="transaction-group"
      :text="buildDraggableText"
      @drop="reorder"
    />

    <Button
      color="dimmed"
      :disabled="!allowDelete"
      :icon="RiCloseCircleLine"
      textual
      @click="$emit('deleteTransaction', transaction.id)"
    />

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

    <span :class="$style.header">
      <TextCell
        :modelValue="transaction.payee"
        @update:model-value="$emit('updateTransaction', transaction.id, 'payee', $event)"
      />
    </span>

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
    </span>

    <Currency :testId="`${testId}-transaction-${index}-total`" :class="$style.meta" :value="transaction.amount" />
    <span :class="$style.meta">{{ formatDate(transaction.date) }}</span>
  </template>

  <!-- Footer -->
  <span />
  <Button :icon="RiAddCircleLine" textual @click="addTransaction" />
  <span style="grid-column: 3 / 8" />
  <Currency :class="[$style.meta, $style.bold]" :value="group.total" />
  <span :class="[$style.meta, $style.bold]">{{ group.transactions.length }} items</span>
</template>

<script lang="ts" setup>
import Button from '@components/base/button/Button.vue';
import Currency from '@components/base/currency/Currency.vue';
import CurrencyCell from '@components/base/currency-cell/CurrencyCell.vue';
import { ReorderEvent } from '@components/base/draggable/Draggable.types';
import Draggable from '@components/base/draggable/Draggable.vue';
import { DraggableStore } from '@components/base/draggable/store';
import TextCell from '@components/base/text-cell/TextCell.vue';
import InlineSelect from '@components/base/inline-select/InlineSelect.vue';
import DatePicker from '@components/base/date-picker/DatePicker.vue';
import { RiAddCircleLine, RiCloseCircleLine } from '@remixicon/vue';
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

const buildDraggableText = (store: DraggableStore) => {
  return `Move transaction`;
};

const reorder = (evt: ReorderEvent) => {
  // Handle transaction reordering
  console.log('Reorder transaction:', evt);
};

const deletePayeeGroup = () => {
  if (confirm(`Delete all transactions for ${props.group.payee}?`)) {
    props.group.transactions.forEach(transaction => {
      emit('deleteTransaction', transaction.id);
    });
  }
};

const updatePayeeName = (newName: string) => {
  props.group.transactions.forEach(transaction => {
    emit('updateTransaction', transaction.id, 'payee', newName);
  });
};

const addTransaction = () => {
  transactionStore.addTransaction({
    bankAccountId: '',
    date: new Date().toISOString().split('T')[0],
    payee: props.group.payee,
    group: '',
    category: '',
    amount: 0
  });
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
  display: inline-block;
  font-size: var(--input-field-font-size);
  font-weight: var(--font-weight-l);
  margin: 4px 0;
  padding: 5px 0;
  background: var(--grid-header-background);
  color: var(--grid-header-text);

  > span {
    display: inline-block;
    padding: 0 4px;
  }

  &.start {
    border-top-left-radius: var(--border-radius-l);
    border-bottom-left-radius: var(--border-radius-l);
    padding-left: 8px;
    cursor: text;
  }

  &.end {
    border-top-right-radius: var(--border-radius-l);
    border-bottom-right-radius: var(--border-radius-l);
    padding-right: 8px;
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
