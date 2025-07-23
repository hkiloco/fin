<template>
  <div :class="$style.transactionGrid">
    <!-- Column Headers -->
    <span />
    <span />
    <span />
    <span
      :class="[$style.columnHeader, $style.dateColumn, $style.sortable]"
      @click="sortBy('date')"
    >
      {{ t('bankAccount.date') }}
      <span v-if="sortField === 'date'" :class="$style.sortIcon">
        {{ sortDirection === 'asc' ? '↑' : '↓' }}
      </span>
    </span>
    <span
      :class="[$style.columnHeader, $style.sortable]"
      @click="sortBy('payee')"
    >
      {{ t('bankAccount.payee') }}
      <span v-if="sortField === 'payee'" :class="$style.sortIcon">
        {{ sortDirection === 'asc' ? '���' : '↓' }}
      </span>
    </span>
    <span
      :class="[$style.columnHeader, $style.sortable]"
      @click="sortBy('group')"
    >
      {{ t('bankAccount.group') }}
      <span v-if="sortField === 'group'" :class="$style.sortIcon">
        {{ sortDirection === 'asc' ? '↑' : '↓' }}
      </span>
    </span>
    <span
      :class="[$style.columnHeader, $style.sortable]"
      @click="sortBy('category')"
    >
      {{ t('bankAccount.category') }}
      <span v-if="sortField === 'category'" :class="$style.sortIcon">
        {{ sortDirection === 'asc' ? '↑' : '↓' }}
      </span>
    </span>
    <span
      :class="[$style.columnHeader, $style.lastColumn, $style.sortable]"
      @click="sortBy('amount')"
    >
      {{ t('bankAccount.amount') }}
      <span v-if="sortField === 'amount'" :class="$style.sortIcon">
        {{ sortDirection === 'asc' ? '↑' : '↓' }}
      </span>
    </span>
    <span />
    <span />

    <!-- Transaction Groups -->
    <template v-for="(payeeGroup, index) in groupedTransactions" :key="payeeGroup.payee">
      <TransactionGroup
        :allowDelete="true"
        :group="payeeGroup"
        :testId="`payee-${index}`"
        @updateTransaction="updateTransaction"
        @deleteTransaction="deleteTransaction"
        @reorderTransaction="handleReorderTransaction"
      />
    </template>

    <!-- Footer -->
    <span />
    <Button
      :class="$style.addTransactionBtn"
      :icon="RiAddCircleLine"
      :text="t('bankAccount.addTransaction')"
      textual
      @click="addNewTransaction"
    />
  </div>
</template>

<script lang="ts" setup>
import TransactionGroup from './TransactionGroup.vue';
import Button from '@components/base/button/Button.vue';
import Currency from '@components/base/currency/Currency.vue';

import { RiAddCircleLine } from '@remixicon/vue';
import { useTransactionStore, type Transaction } from '@store/transactions';
import { useDataStore } from '@store/state';
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import type { Component } from 'vue';

const props = defineProps<{
  transactions: Transaction[];
  accountId?: string;
}>();

const { t } = useI18n();
const transactionStore = useTransactionStore();
const { state: dataState } = useDataStore();

// Sorting state
const sortField = ref<'date' | 'payee' | 'group' | 'category' | 'amount'>('date');
const sortDirection = ref<'asc' | 'desc'>('desc'); // Default to newest first
const isManualSort = ref(false); // Track if user has manually sorted

// Sort and group transactions
const sortedTransactions = computed(() => {
  const sorted = [...props.transactions];

  // Always sort by date first (default behavior)
  if (sortField.value === 'date' || !isManualSort.value) {
    return sorted.sort((a, b) => {
      const aDate = new Date(a.date);
      const bDate = new Date(b.date);

      if (sortField.value === 'date') {
        if (sortDirection.value === 'asc') {
          // Oldest first: earlier dates first, then by creation time (earliest first)
          return aDate.getTime() - bDate.getTime() || new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        } else {
          // Newest first: later dates first, then by creation time (latest first)
          return bDate.getTime() - aDate.getTime() || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
      } else {
        // Default: newest first, with newest created transactions at top
        return bDate.getTime() - aDate.getTime() || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
  }

  // Manual sorting for other fields
  return sorted.sort((a, b) => {
    let aValue: any, bValue: any;

    switch (sortField.value) {
      case 'payee':
        aValue = a.payee || '';
        bValue = b.payee || '';
        break;
      case 'group':
        aValue = a.group || '';
        bValue = b.group || '';
        break;
      case 'category':
        aValue = a.category || '';
        bValue = b.category || '';
        break;
      case 'amount':
        aValue = a.amount;
        bValue = b.amount;
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return sortDirection.value === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection.value === 'asc' ? 1 : -1;
    return 0;
  });
});

// Group transactions by payee (after sorting)
const groupedTransactions = computed(() => {
  const groups = new Map<string, Transaction[]>();

  sortedTransactions.value.forEach(transaction => {
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

const handleReorderTransaction = (data: { sourceId: string; targetId: string; type: string }) => {
  // Find source and target transactions
  const sourceTransaction = props.transactions.find(t => t.id === data.sourceId);
  const targetTransaction = props.transactions.find(t => t.id === data.targetId);

  if (sourceTransaction && targetTransaction) {
    // Instead of changing dates, adjust the createdAt timestamp to control order
    const targetTime = new Date(targetTransaction.createdAt).getTime();
    let newTime: number;

    if (data.type === 'before') {
      // Make source transaction appear before target by subtracting 1 second
      newTime = targetTime - 1000;
    } else {
      // Make source transaction appear after target by adding 1 second
      newTime = targetTime + 1000;
    }

    const newCreatedAt = new Date(newTime).toISOString();
    transactionStore.updateTransaction(data.sourceId, { createdAt: newCreatedAt });
  }
};



const sortBy = (field: 'date' | 'payee' | 'group' | 'category' | 'amount') => {
  if (sortField.value === field) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortField.value = field;
    sortDirection.value = field === 'date' ? 'desc' : 'asc'; // Default newest first for date
  }

  // Mark as manual sort when user clicks on any column
  isManualSort.value = true;
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

// Keyboard event handler
const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Enter' && e.ctrlKey) {
    addNewTransaction();
  }
};

// Add/remove event listeners
onMounted(() => {
  document.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown);
});
</script>

<style lang="scss" module>
@use '@styles/globals.scss';

.transactionGrid {
  display: grid;
  grid-template-columns: max-content max-content max-content 110px 2fr 150px 150px 120px 50px max-content;
  align-items: center;
  padding-bottom: 20px;
  gap: 0;
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
  display: flex;
  align-items: center;
  justify-content: space-between;

  &.dateColumn {
    border-radius: 6px 0 0 6px;
    padding: 5px 4px 5px 8px;
  }

  &.lastColumn {
    border-bottom-right-radius: 6px;
    border-top-right-radius: 6px;
    padding: 5px 8px 5px 0;
  }

  &.sortable {
    cursor: pointer;
    transition: background-color 0.2s ease;

    &:hover {
      background: var(--c-primary-dark, #4c7bd9);
    }
  }
}

.sortIcon {
  font-size: 10px;
  margin-left: 4px;
  opacity: 0.8;
}



.addTransactionBtn {
  margin-top: 18px;
  grid-column: 2 / span 3;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-m);
}
</style>
