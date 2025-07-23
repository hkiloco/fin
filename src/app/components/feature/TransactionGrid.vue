<template>
  <div :class="$style.transactionGrid">
    <!-- Header -->
    <span />
    <span />
    <span />

    <!-- Column Headers -->
    <span />
    <span :class="[$style.columnHeader, $style.dateColumn]">{{ t('bankAccount.date') }}</span>
    <span :class="$style.columnHeader">{{ t('bankAccount.payee') }}</span>
    <span />
    <span :class="$style.columnHeader">{{ t('bankAccount.group') }}</span>
    <span :class="$style.columnHeader">{{ t('bankAccount.category') }}</span>
    <span :class="[$style.columnHeader, $style.lastColumn]">{{ t('bankAccount.amount') }}</span>
    <span />
    <span />

    <!-- Empty Filter Row -->
    <span />
    <span />
    <span />
    <span :class="[$style.dateFilter]" />
    <span />
    <span />
    <span />
    <span />
    <span />

    <!-- Transaction Groups -->
    <template v-for="(payeeGroup, index) in groupedTransactions" :key="payeeGroup.payee">
      <Draggable
        :id="payeeGroup.payee"
        :icon="buildDraggableIcon"
        :text="buildDraggableText"
        name="transaction-groups"
        @drop="reorder"
      />
      <TransactionGroup
        :allowDelete="true"
        :group="payeeGroup"
        :testId="`payee-${index}`"
        @updateTransaction="updateTransaction"
        @deleteTransaction="deleteTransaction"
      />
    </template>

    <!-- Footer -->
    <span />
    <Button
      :class="$style.addTransactionBtn"
      color="primary"
      size="s"
      :icon="RiAddCircleLine"
      :text="t('bankAccount.addTransaction')"
      @click="addNewTransaction"
    />
  </div>
</template>

<script lang="ts" setup>
import TransactionGroup from './TransactionGroup.vue';
import Button from '@components/base/button/Button.vue';
import Currency from '@components/base/currency/Currency.vue';
import { ReorderEvent } from '@components/base/draggable/Draggable.types';
import Draggable from '@components/base/draggable/Draggable.vue';
import { DraggableStore } from '@components/base/draggable/store';
import { RiAddCircleLine, RiSkipDownLine } from '@remixicon/vue';
import { useTransactionStore, type Transaction } from '@store/transactions';
import { useDataStore } from '@store/state';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import type { Component } from 'vue';

const props = defineProps<{
  transactions: Transaction[];
  accountId?: string;
}>();

const { t } = useI18n();
const transactionStore = useTransactionStore();
const { state: dataState } = useDataStore();
const filterDate = ref<string>('');

// Filter transactions by date if filter is set
const filteredTransactions = computed(() => {
  if (!filterDate.value) {
    return props.transactions;
  }
  return props.transactions.filter(transaction =>
    transaction.date === filterDate.value
  );
});

// Group transactions by payee
const groupedTransactions = computed(() => {
  const groups = new Map<string, Transaction[]>();

  filteredTransactions.value.forEach(transaction => {
    const payee = transaction.payee || 'Unknown';
    if (!groups.has(payee)) {
      groups.set(payee, []);
    }
    groups.get(payee)!.push(transaction);
  });

  return Array.from(groups.entries()).map(([payee, transactions]) => ({
    payee,
    transactions,
    total: transactions.reduce((sum, t) => sum + t.amount, 0)
  }));
});

// Calculate totals by different categories
const totalsByPayee = computed(() => {
  return groupedTransactions.value.map(group => ({
    payee: group.payee,
    total: group.total
  }));
});

const totalsByGroup = computed(() => {
  const groups = new Map<string, number>();
  props.transactions.forEach(transaction => {
    const group = transaction.group || 'Unassigned';
    groups.set(group, (groups.get(group) || 0) + transaction.amount);
  });
  return Array.from(groups.entries()).map(([group, total]) => ({ group, total }));
});

const totalsByCategory = computed(() => {
  const categories = new Map<string, number>();
  props.transactions.forEach(transaction => {
    const category = transaction.category || 'Unassigned';
    categories.set(category, (categories.get(category) || 0) + transaction.amount);
  });
  return Array.from(categories.entries()).map(([category, total]) => ({ category, total }));
});

const grandTotal = computed(() => {
  return props.transactions.reduce((sum, transaction) => sum + transaction.amount, 0);
});

const buildDraggableIcon = (store: DraggableStore): Component | undefined =>
  store.group === 'transaction-group' ? RiSkipDownLine : undefined;

const buildDraggableText = (store: DraggableStore) => {
  return 'Move transaction group';
};

const reorder = (evt: ReorderEvent) => {
  // Handle reordering logic here
  console.log('Reorder event:', evt);
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

const setFilterDate = (date: string) => {
  filterDate.value = date;
};

const deleteAllTransactions = () => {
  if (confirm(t('bankAccount.confirmDeleteAllTransactions'))) {
    props.transactions.forEach(transaction => {
      transactionStore.deleteTransaction(transaction.id);
    });
  }
};

const addNewTransaction = () => {
  transactionStore.addTransaction({
    bankAccountId: props.accountId || '',
    date: new Date().toISOString().split('T')[0],
    payee: '',
    group: '',
    category: '',
    amount: 0
  });
};
</script>

<style lang="scss" module>
@use '@styles/globals.scss';

.transactionGrid {
  display: grid;
  grid-template: auto / max-content max-content max-content max-content 1fr 1fr 1fr 1fr max-content;
  align-items: center;
  padding-bottom: 20px;
}

.sum {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-l);
  padding-right: 10px;


}

.columnHeader {
  background: var(--c-primary);
  color: var(--c-text-light);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-m);
  margin: 4px 0;
  padding: 5px 0;
  position: sticky;
  top: 0;

  &.dateColumn {
    border-radius: 6px 0 0 6px;
    padding: 5px 4px 5px 8px;
  }

  &.lastColumn {
    border-bottom-right-radius: 6px;
    border-top-right-radius: 6px;
    padding: 5px 8px 5px 0;
  }
}

.dateFilter {
  margin-left: 5px;
}

.addTransactionBtn {
  margin-top: 20px;
  grid-area: auto / 2 / auto / 4;
  background: var(--c-primary);
}
</style>
