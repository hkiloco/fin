<template>
  <div :class="$style.expenseDetails">
    <div :class="$style.header">
      <div :class="$style.titleSection">
        <div :class="$style.pageTitle">
          <RiBarChartBoxLine :class="$style.titleIcon" />
          <h1>{{ t('expenses.expenseTrackingDetails') }}</h1>
        </div>
        <YearToggle keyPath="expenses.expenseTrackingDetails" />
      </div>
      
      <div :class="$style.summary">
        <div :class="$style.summaryCard">
          <span :class="$style.summaryLabel">{{ t('expenseDetails.totalExpenses') }}</span>
          <Currency :value="totalExpenses" :class="$style.summaryValue" />
        </div>
        <div :class="$style.summaryCard">
          <span :class="$style.summaryLabel">{{ t('expenseDetails.activeAccounts') }}</span>
          <span :class="$style.summaryValue">{{ activeAccountsCount }}</span>
        </div>
        <div :class="$style.summaryCard">
          <span :class="$style.summaryLabel">{{ t('expenseDetails.avgMonthlyExpense') }}</span>
          <Currency :value="averageMonthlyExpense" :class="$style.summaryValue" />
        </div>
      </div>
    </div>

    <div :class="$style.content">
      <div :class="$style.chartsSection">
        <div :class="$style.chartCard">
          <h3>{{ t('expenseDetails.monthlyTrend') }}</h3>
          <EChart :option="monthlyTrendChart" :class="$style.chart" />
        </div>
        
        <div :class="$style.chartCard">
          <h3>{{ t('expenseDetails.categoryBreakdown') }}</h3>
          <EChart :option="categoryBreakdownChart" :class="$style.chart" />
        </div>
      </div>

      <div :class="$style.detailsSection">
        <div :class="$style.accountsList">
          <h3>{{ t('expenseDetails.accountsOverview') }}</h3>
          
          <div v-if="state.expenses.length === 0" :class="$style.emptyState">
            <RiInformationLine :class="$style.emptyIcon" />
            <p>{{ t('expenseDetails.noExpenseData') }}</p>
            <Button
              :icon="RiArrowLeftLine"
              :text="t('expenseDetails.goToExpenses')"
              color="primary"
              @click="goToExpenses"
            />
          </div>

          <div v-else :class="$style.accountCards">
            <div
              v-for="account in sortedAccounts"
              :key="account.id"
              :class="$style.accountCard"
            >
              <div :class="$style.accountHeader">
                <div :class="$style.accountInfo">
                  <RiAccountBoxLine :class="$style.accountIcon" />
                  <div>
                    <h4 :class="$style.accountName">{{ account.name }}</h4>
                    <span :class="$style.accountMeta">
                      {{ account.budgets.length }} {{ t('expenseDetails.categories') }}
                    </span>
                  </div>
                </div>
                <div :class="$style.accountTotal">
                  <Currency :value="getAccountTotal(account)" />
                </div>
              </div>

              <div :class="$style.categoriesList">
                <div
                  v-for="category in account.budgets"
                  :key="category.id"
                  :class="$style.categoryItem"
                >
                  <div :class="$style.categoryInfo">
                    <span :class="$style.categoryName">{{ category.name }}</span>
                    <div :class="$style.categoryChart">
                      <div
                        v-for="(value, index) in category.values"
                        :key="index"
                        :class="$style.monthBar"
                        :style="{ height: getBarHeight(value, getMaxCategoryValue(category)) }"
                        :title="`${getMonthName(index)}: ${formatCurrency(value)}`"
                      />
                    </div>
                  </div>
                  <div :class="$style.categoryTotal">
                    <Currency :value="sum(category.values)" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div :class="$style.insights">
          <h3>{{ t('expenseDetails.insights') }}</h3>
          <div :class="$style.insightsList">
            <div :class="$style.insightItem">
              <RiTrendingUpLine :class="$style.insightIcon" />
              <div>
                <strong>{{ t('expenseDetails.highestMonth') }}</strong>
                <p>{{ getHighestExpenseMonth() }}</p>
              </div>
            </div>
            <div :class="$style.insightItem">
              <RiTrendingDownLine :class="$style.insightIcon" />
              <div>
                <strong>{{ t('expenseDetails.lowestMonth') }}</strong>
                <p>{{ getLowestExpenseMonth() }}</p>
              </div>
            </div>
            <div :class="$style.insightItem">
              <RiPieChartLine :class="$style.insightIcon" />
              <div>
                <strong>{{ t('expenseDetails.largestCategory') }}</strong>
                <p>{{ getLargestCategory() }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import YearToggle from '@components/feature/YearToggle.vue';
import Button from '@components/base/button/Button.vue';
import Currency from '@components/base/currency/Currency.vue';
import EChart from '@components/charts/echart/EChart.vue';
import {
  RiBarChartBoxLine,
  RiAccountBoxLine,
  RiInformationLine,
  RiArrowLeftLine,
  RiArrowUpDoubleLine,
  RiArrowDownDoubleLine,
  RiPieChartLine
} from '@remixicon/vue';
import { useDataStore } from '@store/state';
import { BudgetGroup, Budget } from '@store/state/types';
import { useMonthNames } from '@composables/useMonthNames.ts';
import { useSettingsStore } from '@store/settings';
import { sum } from '@utils/array/array.ts';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

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
