<template>
  <Pane :testId="'transactions'" :amount="totalAmount" :title="title">
    <template v-if="$slots.title" #title>
      <slot name="title" />
    </template>
    <template #header>
      <MiniChart :class="$style.miniChart" :values="monthlyTotals" />
    </template>
    <TransactionGrid :transactions="transactions" :accountId="accountId" />
  </Pane>
</template>

<script lang="ts" setup>
import Pane from './Pane.vue';
import MiniChart from './mini-chart/MiniChart.vue';
import TransactionGrid from './TransactionGrid.vue';
import { useTransactionStore } from '@store/transactions';
import { computed } from 'vue';

const props = defineProps<{
  title?: string;
  accountId?: string;
}>();

const transactionStore = useTransactionStore();

const transactions = computed(() => {
  if (props.accountId) {
    return transactionStore.getTransactionsByAccountId(props.accountId).value;
  }
  return transactionStore.getAllTransactions().value;
});

const totalAmount = computed(() => {
  return transactions.value.reduce((sum, transaction) => sum + transaction.amount, 0);
});

const monthlyTotals = computed(() => {
  const totals = new Array(12).fill(0);
  
  transactions.value.forEach(transaction => {
    const date = new Date(transaction.date);
    const month = date.getMonth();
    totals[month] += transaction.amount;
  });
  
  return totals;
});
</script>

<style lang="scss" module>
.miniChart {
  width: 75px;
  height: 100%;
  cursor: default;
}
</style>
