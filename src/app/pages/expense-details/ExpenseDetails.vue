<template>
  <div :class="$style.expenseDetails">
    <!-- Header with account summary -->
    <div :class="$style.header">
      <div :class="$style.accountHeader">
        <div :class="$style.accountInfo">
          <h1 :class="$style.accountTitle">{{ t('expenseDetails.expenseTracker') }}</h1>
          <div :class="$style.accountMeta">
            <span :class="$style.balance">
              {{ t('expenseDetails.totalExpenses') }}:
              <Currency :value="totalExpenses" />
            </span>
            <span :class="$style.uncleared">
              {{ t('expenseDetails.thisMonth') }}:
              <Currency :value="currentMonthExpenses" />
            </span>
          </div>
        </div>
        <div :class="$style.yearToggle">
          <YearToggle keyPath="expenses.expenseTrackingDetails" />
        </div>
      </div>
    </div>

    <!-- Action buttons -->
    <div :class="$style.actionBar">
      <Button
        :icon="RiAddLine"
        :text="t('expenseDetails.addTransaction')"
        color="primary"
        size="s"
        @click="showAddTransaction = true"
      />
      <Button
        :icon="RiFilterLine"
        :text="t('expenseDetails.filter')"
        color="secondary"
        size="s"
        @click="showFilters = !showFilters"
      />
      <Button
        :icon="RiDownloadLine"
        :text="t('expenseDetails.export')"
        color="secondary"
        size="s"
        @click="exportTransactions"
      />
    </div>

    <!-- Filters -->
    <div v-if="showFilters" :class="$style.filtersSection">
      <div :class="$style.filters">
        <Select
          :value="selectedAccount"
          :options="accountOptions"
          :placeholder="t('expenseDetails.allAccounts')"
          @update:value="selectedAccount = $event"
        />
        <Select
          :value="selectedCategory"
          :options="categoryOptions"
          :placeholder="t('expenseDetails.allCategories')"
          @update:value="selectedCategory = $event"
        />
        <TextField
          :value="searchQuery"
          :placeholder="t('expenseDetails.searchTransactions')"
          @update:value="searchQuery = $event"
        />
      </div>
    </div>

    <!-- Transaction table -->
    <div :class="$style.transactionTable">
      <div :class="$style.tableHeader">
        <span :class="$style.colDate">{{ t('expenseDetails.date') }}</span>
        <span :class="$style.colPayee">{{ t('expenseDetails.payee') }}</span>
        <span :class="$style.colCategory">{{ t('expenseDetails.category') }}</span>
        <span :class="$style.colNotes">{{ t('expenseDetails.notes') }}</span>
        <span :class="$style.colAmount">{{ t('expenseDetails.amount') }}</span>
        <span :class="$style.colActions"></span>
      </div>

      <div v-if="filteredTransactions.length === 0" :class="$style.emptyState">
        <RiInformationLine :class="$style.emptyIcon" />
        <p>{{ t('expenseDetails.noTransactions') }}</p>
        <Button
          :icon="RiAddLine"
          :text="t('expenseDetails.addFirstTransaction')"
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
          <Currency :value="transaction.amount" :class="$style.expenseAmount" />
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
        {{ t('expenseDetails.pageOf', { current: currentPage, total: totalPages }) }}
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
        {{ editingTransaction ? t('expenseDetails.editTransaction') : t('expenseDetails.addTransaction') }}
      </template>
      <template #content>
        <Form :class="$style.transactionForm" @submit="saveTransaction">
          <div :class="$style.formRow">
            <TextField
              :value="transactionForm.date"
              :label="t('expenseDetails.date')"
              type="date"
              required
              @update:value="transactionForm.date = $event"
            />
            <TextField
              :value="transactionForm.payee"
              :label="t('expenseDetails.payee')"
              required
              @update:value="transactionForm.payee = $event"
            />
          </div>
          <div :class="$style.formRow">
            <Select
              :value="transactionForm.accountId"
              :options="accountSelectOptions"
              :label="t('expenseDetails.account')"
              required
              @update:value="transactionForm.accountId = $event"
            />
            <Select
              :value="transactionForm.category"
              :options="categorySelectOptions"
              :label="t('expenseDetails.category')"
              required
              @update:value="transactionForm.category = $event"
            />
          </div>
          <div :class="$style.formRow">
            <TextField
              :value="transactionForm.amount"
              :label="t('expenseDetails.amount')"
              type="number"
              step="0.01"
              required
              @update:value="transactionForm.amount = parseFloat($event) || 0"
            />
          </div>
          <TextField
            :value="transactionForm.notes"
            :label="t('expenseDetails.notes')"
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
              type="submit"
            />
          </div>
        </Form>
      </template>
    </Dialog>
  </div>
</template>

<script lang="ts" setup>
import YearToggle from '@components/feature/YearToggle.vue';
import Button from '@components/base/button/Button.vue';
import Currency from '@components/base/currency/Currency.vue';
import Dialog from '@components/base/dialog/Dialog.vue';
import Form from '@components/base/form/Form.vue';
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
import { useDataStore } from '@store/state';
import { BudgetGroup } from '@store/state/types';
import { Transaction } from '@store/state/transaction-types';
import { useMonthNames } from '@composables/useMonthNames.ts';
import { useSettingsStore } from '@store/settings';
import { sum } from '@utils/array/array.ts';
import { uuid } from '@utils/uuid.ts';
import { computed, ref, reactive } from 'vue';
import { useI18n } from 'vue-i18n';

const { state } = useDataStore();
const { state: settings } = useSettingsStore();
const { t } = useI18n();
const router = useRouter();
const months = useMonthNames('long', () => settings.general.monthOffset);

const totalExpenses = computed(() => {
  return state.expenses.reduce((total, account) => 
    total + getAccountTotal(account), 0
  );
});

const activeAccountsCount = computed(() => {
  return state.expenses.filter(account => 
    getAccountTotal(account) > 0
  ).length;
});

const averageMonthlyExpense = computed(() => {
  const monthlyTotals = new Array(12).fill(0);
  
  state.expenses.forEach(account => {
    account.budgets.forEach(budget => {
      budget.values.forEach((value, index) => {
        monthlyTotals[index] += value;
      });
    });
  });
  
  const nonZeroMonths = monthlyTotals.filter(total => total > 0);
  return nonZeroMonths.length > 0 ? sum(monthlyTotals) / nonZeroMonths.length : 0;
});

const sortedAccounts = computed(() => {
  return [...state.expenses].sort((a, b) => getAccountTotal(b) - getAccountTotal(a));
});

const monthlyTrendChart = computed(() => {
  const monthlyTotals = new Array(12).fill(0);
  
  state.expenses.forEach(account => {
    account.budgets.forEach(budget => {
      budget.values.forEach((value, index) => {
        monthlyTotals[index] += value;
      });
    });
  });

  return {
    xAxis: {
      type: 'category',
      data: months.value
    },
    yAxis: {
      type: 'value'
    },
    series: [{
      data: monthlyTotals,
      type: 'line',
      smooth: true,
      itemStyle: {
        color: '#6bb1ff'
      }
    }],
    tooltip: {
      trigger: 'axis'
    }
  };
});

const categoryBreakdownChart = computed(() => {
  const categoryTotals: { name: string; value: number }[] = [];
  
  state.expenses.forEach(account => {
    account.budgets.forEach(budget => {
      const total = sum(budget.values);
      if (total > 0) {
        categoryTotals.push({
          name: `${account.name} - ${budget.name}`,
          value: total
        });
      }
    });
  });

  categoryTotals.sort((a, b) => b.value - a.value);
  const topCategories = categoryTotals.slice(0, 10);

  return {
    series: [{
      type: 'pie',
      data: topCategories,
      radius: ['40%', '70%']
    }],
    tooltip: {
      trigger: 'item'
    }
  };
});

const getAccountTotal = (account: BudgetGroup) => {
  return account.budgets.reduce((total, budget) => total + sum(budget.values), 0);
};

const getMaxCategoryValue = (category: Budget) => {
  return Math.max(...category.values);
};

const getBarHeight = (value: number, maxValue: number) => {
  if (maxValue === 0) return '0px';
  return `${(value / maxValue) * 30}px`;
};

const getMonthName = (index: number) => {
  return months.value[index];
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: state.currency
  }).format(value);
};

const getHighestExpenseMonth = () => {
  const monthlyTotals = new Array(12).fill(0);
  
  state.expenses.forEach(account => {
    account.budgets.forEach(budget => {
      budget.values.forEach((value, index) => {
        monthlyTotals[index] += value;
      });
    });
  });

  const maxIndex = monthlyTotals.indexOf(Math.max(...monthlyTotals));
  const maxValue = monthlyTotals[maxIndex];
  return maxValue > 0 ? `${months.value[maxIndex]} (${formatCurrency(maxValue)})` : t('expenseDetails.noData');
};

const getLowestExpenseMonth = () => {
  const monthlyTotals = new Array(12).fill(0);
  
  state.expenses.forEach(account => {
    account.budgets.forEach(budget => {
      budget.values.forEach((value, index) => {
        monthlyTotals[index] += value;
      });
    });
  });

  const nonZeroTotals = monthlyTotals.filter(total => total > 0);
  if (nonZeroTotals.length === 0) return t('expenseDetails.noData');
  
  const minValue = Math.min(...nonZeroTotals);
  const minIndex = monthlyTotals.indexOf(minValue);
  return `${months.value[minIndex]} (${formatCurrency(minValue)})`;
};

const getLargestCategory = () => {
  let maxCategory = { name: '', accountName: '', total: 0 };
  
  state.expenses.forEach(account => {
    account.budgets.forEach(budget => {
      const total = sum(budget.values);
      if (total > maxCategory.total) {
        maxCategory = {
          name: budget.name,
          accountName: account.name,
          total
        };
      }
    });
  });

  return maxCategory.total > 0 
    ? `${maxCategory.accountName} - ${maxCategory.name} (${formatCurrency(maxCategory.total)})`
    : t('expenseDetails.noData');
};

const goToExpenses = () => {
  router.push('/expenses');
};
</script>

<style lang="scss" module>
.expenseDetails {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.header {
  padding: 20px;
  border-bottom: 1px solid var(--app-border);
  background: var(--app-background-secondary);
}

.titleSection {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.pageTitle {
  display: flex;
  align-items: center;
  gap: 12px;

  h1 {
    margin: 0;
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-l);
  }
}

.titleIcon {
  font-size: 32px;
  color: var(--c-primary);
}

.summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.summaryCard {
  background: var(--app-background);
  border: 1px solid var(--app-border);
  border-radius: var(--border-radius-m);
  padding: 16px;
  text-align: center;
}

.summaryLabel {
  display: block;
  font-size: var(--font-size-xs);
  color: var(--c-text-dimmed);
  margin-bottom: 8px;
}

.summaryValue {
  font-size: var(--font-size-l);
  font-weight: var(--font-weight-l);
  color: var(--c-primary);
}

.content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 20px;
}

.chartsSection {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.chartCard {
  background: var(--app-background);
  border: 1px solid var(--app-border);
  border-radius: var(--border-radius-m);
  padding: 20px;

  h3 {
    margin: 0 0 16px 0;
    font-size: var(--font-size-m);
    font-weight: var(--font-weight-m);
  }
}

.chart {
  width: 100%;
  height: 300px;
}

.detailsSection {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.accountsList {
  h3 {
    margin: 0 0 16px 0;
    font-size: var(--font-size-m);
    font-weight: var(--font-weight-m);
  }
}

.emptyState {
  text-align: center;
  padding: 40px 20px;
  color: var(--c-text-dimmed);
}

.emptyIcon {
  font-size: 48px;
  margin-bottom: 16px;
  color: var(--c-text-dimmed);
}

.accountCards {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.accountCard {
  background: var(--app-background);
  border: 1px solid var(--app-border);
  border-radius: var(--border-radius-m);
  padding: 16px;
}

.accountHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.accountInfo {
  display: flex;
  align-items: center;
  gap: 10px;
}

.accountIcon {
  font-size: 20px;
  color: var(--c-primary);
}

.accountName {
  margin: 0;
  font-size: var(--font-size-s);
  font-weight: var(--font-weight-m);
}

.accountMeta {
  font-size: var(--font-size-xs);
  color: var(--c-text-dimmed);
}

.accountTotal {
  font-weight: var(--font-weight-l);
  color: var(--c-primary);
}

.categoriesList {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.categoryItem {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  background: var(--app-background-secondary);
  border-radius: var(--border-radius-s);
}

.categoryInfo {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.categoryName {
  font-size: var(--font-size-xs);
  min-width: 80px;
}

.categoryChart {
  display: flex;
  gap: 2px;
  height: 30px;
  align-items: end;
}

.monthBar {
  width: 6px;
  background: var(--c-primary);
  border-radius: 2px;
  opacity: 0.7;
  transition: opacity 0.2s;

  &:hover {
    opacity: 1;
  }
}

.categoryTotal {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-m);
}

.insights {
  h3 {
    margin: 0 0 16px 0;
    font-size: var(--font-size-m);
    font-weight: var(--font-weight-m);
  }
}

.insightsList {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.insightItem {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  background: var(--app-background);
  border: 1px solid var(--app-border);
  border-radius: var(--border-radius-s);
}

.insightIcon {
  font-size: 20px;
  color: var(--c-primary);
  margin-top: 2px;
}

.insightItem {
  strong {
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-m);
  }

  p {
    margin: 4px 0 0 0;
    font-size: var(--font-size-xs);
    color: var(--c-text-dimmed);
  }
}

@media (max-width: 768px) {
  .content {
    grid-template-columns: 1fr;
  }
  
  .summary {
    grid-template-columns: 1fr;
  }
}
</style>
