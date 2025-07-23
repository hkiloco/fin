<template>
  <div :class="$style.transactionGrid">
    <!-- Header -->
    <span />
    <span />
    <span />

    <!-- Column Headers -->
    <span :class="[$style.columnHeader, $style.start]">{{ t('bankAccount.date') }}</span>
    <span :class="[$style.columnHeader, $style.start]">{{ t('bankAccount.payee') }}</span>
    <span :class="$style.columnHeader">{{ t('bankAccount.group') }}</span>
    <span :class="$style.columnHeader">{{ t('bankAccount.category') }}</span>
    <span :class="$style.columnHeader">{{ t('bankAccount.amount') }}</span>
    <span />
    <span />

    <!-- Date Filter Row -->
    <span />
    <Button
      color="danger"
      :icon="RiDeleteBinLine"
      textual
      @click="deleteAllTransactions"
    />
    <span :class="[$style.dateFilter]">
      <DatePicker
        :modelValue="filterDate"
        placeholder="Filter by date..."
        @update:model-value="setFilterDate"
      />
    </span>
    <Currency :value="totalsByPayee.length > 0 ? totalsByPayee.reduce((a, b) => a + b.total, 0) : 0" :class="$style.sum" />
    <Currency :value="totalsByGroup.length > 0 ? totalsByGroup.reduce((a, b) => a + b.total, 0) : 0" :class="$style.sum" />
    <Currency :value="totalsByCategory.length > 0 ? totalsByCategory.reduce((a, b) => a + b.total, 0) : 0" :class="$style.sum" />
    <Currency :value="grandTotal" :class="$style.sum" />
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
        :allowDelete="allowDelete" 
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
import { RiAddCircleLine, RiDeleteBinLine, RiSkipDownLine } from '@remixicon/vue';
import DatePicker from '@components/base/date-picker/DatePicker.vue';
import { useTransactionStore, type Transaction } from '@store/transactions';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import type { Component } from 'vue';

const props = defineProps<{
  transactions: Transaction[];
}>();

const { t } = useI18n();
const transactionStore = useTransactionStore();
const filterDate = ref<string>('');

// Group transactions by payee
const groupedTransactions = computed(() => {
  const groups = new Map<string, Transaction[]>();
  
  props.transactions.forEach(transaction => {
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
    bankAccountId: '',
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
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-m);
  padding-right: 20px;
  padding-bottom: 5px;
  text-transform: uppercase;
  letter-spacing: 0.5px;

  position: sticky;
  position: -webkit-sticky;
  top: 0;
  background: var(--app-background);
  border: 2px var(--app-background);

  &.start {
    border-bottom-left-radius: var(--border-radius-l);
    padding-left: 8px;
  }

  &:last-of-type {
    border-bottom-right-radius: var(--border-radius-l);
    padding-right: 8px;
  }
}

.dateFilter {
  margin-left: 5px;
}

.addTransactionBtn {
  margin-top: 20px;
  grid-area: auto / 2 / auto / 4;
}
</style>
