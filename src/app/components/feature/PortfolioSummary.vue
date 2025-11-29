<template>
  <div :class="$style.portfolioSummary">
    <h3 :class="$style.title">{{ t('dashboard.portfolioSummary') }}</h3>
    
    <div :class="$style.summaryGrid">
      <div :class="$style.summaryCard">
        <span :class="$style.label">{{ t('dashboard.totalBalance') }}</span>
        <span :class="[$style.value, $style.balance]">
          <Currency :value="portfolioSummary.totalBalance" />
        </span>
      </div>
      
      <div :class="$style.summaryCard">
        <span :class="$style.label">{{ t('dashboard.totalIncome') }}</span>
        <span :class="[$style.value, $style.income]">
          <Currency :value="portfolioSummary.totalIncome" />
        </span>
      </div>
      
      <div :class="$style.summaryCard">
        <span :class="$style.label">{{ t('dashboard.totalExpenses') }}</span>
        <span :class="[$style.value, $style.expense]">
          <Currency :value="portfolioSummary.totalExpenses" />
        </span>
      </div>
      
      <div :class="$style.summaryCard">
        <span :class="$style.label">{{ t('dashboard.netChange') }}</span>
        <span :class="[$style.value, portfolioSummary.netChange >= 0 ? $style.income : $style.expense]">
          <Currency :value="portfolioSummary.netChange" />
        </span>
      </div>
    </div>
    
    <!-- Account List -->
    <div v-if="portfolioSummary.accounts.length > 0" :class="$style.accountsList">
      <h4 :class="$style.accountsTitle">{{ t('dashboard.accounts') }}</h4>
      <div 
        v-for="account in portfolioSummary.accounts" 
        :key="account.id"
        :class="$style.accountItem"
      >
        <div :class="$style.accountInfo">
          <span :class="$style.accountName">{{ account.name }}</span>
          <span :class="$style.bankName">{{ account.bankName }}</span>
        </div>
        <div :class="$style.accountBalance">
          <Currency :value="account.currentBalance" />
          <span :class="$style.transactionCount">
            {{ account.transactionCount }} {{ t('dashboard.transactions') }}
          </span>
        </div>
      </div>
    </div>
    
    <div v-else :class="$style.emptyState">
      <p>{{ t('dashboard.noAccountsYet') }}</p>
      <Button 
        :text="t('bankAccounts.addBankAccount')" 
        color="primary" 
        @click="$emit('addAccount')"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import Button from '@components/base/button/Button.vue';
import Currency from '@components/base/currency/Currency.vue';
import { useBankAccountStore } from '@store/bank-accounts';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

defineEmits<{
  addAccount: [];
}>();

const { t } = useI18n();
const bankAccountStore = useBankAccountStore();

const portfolioSummary = computed(() => bankAccountStore.getPortfolioSummary.value);
</script>

<style lang="scss" module>
.portfolioSummary {
  background: var(--app-background);
  border-radius: var(--border-radius-l);
  padding: 24px;
  border: 1px solid var(--app-border);
}

.title {
  margin: 0 0 20px 0;
  font-size: var(--font-size-l);
  font-weight: var(--font-weight-l);
  color: var(--theme-text);
}

.summaryGrid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.summaryCard {
  background: var(--app-background-secondary);
  border-radius: var(--border-radius-m);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  border: 1px solid var(--app-border);
}

.label {
  color: var(--c-dimmed);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-l);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.value {
  font-size: var(--font-size-l);
  font-weight: var(--font-weight-xl);
  
  &.balance {
    color: var(--theme-text);
  }
  
  &.income {
    color: var(--c-success);
  }
  
  &.expense {
    color: var(--c-danger);
  }
}

.accountsList {
  border-top: 1px solid var(--app-border);
  padding-top: 20px;
}

.accountsTitle {
  margin: 0 0 16px 0;
  font-size: var(--font-size-m);
  font-weight: var(--font-weight-l);
  color: var(--theme-text);
}

.accountItem {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid var(--app-border-light);
  
  &:last-child {
    border-bottom: none;
  }
}

.accountInfo {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.accountName {
  font-weight: var(--font-weight-m);
  color: var(--theme-text);
}

.bankName {
  font-size: var(--font-size-xs);
  color: var(--c-dimmed);
}

.accountBalance {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.transactionCount {
  font-size: var(--font-size-xs);
  color: var(--c-dimmed);
}

.emptyState {
  text-align: center;
  padding: 40px 20px;
  color: var(--c-dimmed);
  
  p {
    margin-bottom: 16px;
  }
}
</style>
