<template>
  <div :class="$style.transactionGrid">
    <!-- Column Headers -->
    <span />
    <span />
    <span />
    <span :class="[$style.columnHeader, $style.dateColumn]">{{ t('bankAccount.date') }}</span>
    <span :class="$style.columnHeader">{{ t('bankAccount.payee') }}</span>
    <span :class="$style.columnHeader">{{ t('bankAccount.group') }}</span>
    <span :class="$style.columnHeader">{{ t('bankAccount.category') }}</span>
    <span :class="[$style.columnHeader, $style.lastColumn]">{{ t('bankAccount.amount') }}</span>
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



.addTransactionBtn {
  margin-top: 20px;
  grid-column: 2 / span 3;
}
</style>
