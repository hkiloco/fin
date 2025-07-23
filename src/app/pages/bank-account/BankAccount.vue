<template>
  <div v-if="!accountSlug || !selectedBankAccount" :class="$style.errorState">
    <h2>{{ t('bankAccount.noAccountFound') }}</h2>
    <p>{{ t('bankAccount.noAccountFoundMessage') }}</p>
    <Button :text="t('common.goBack')" @click="$router.push('/')" />
  </div>
  <div v-else :class="$style.bankAccount">
    <!-- Header -->
    <div :class="$style.header">
      <div :class="$style.headerTitle">
        <RiMoneyDollarCircleLine
          v-if="selectedBankAccount?.name?.toLowerCase() === 'cash'"
          :class="$style.headerIcon"
        />
        <RiBankLine
          v-else
          :class="$style.headerIcon"
        />
        <h1 :class="$style.bankName">{{ selectedBankAccount?.bankName || t('bankAccount.bankAccount') }}</h1>
        <span :class="$style.accountType">{{ getAccountTypeLabel(selectedBankAccount?.accountType) }}</span>
      </div>

      <!-- Transaction Summary -->
      <div v-if="accountSummary" :class="$style.summaryCards">
        <div :class="$style.summaryCard">
          <span :class="$style.summaryLabel">{{ t('bankAccount.totalIncome') }}</span>
          <span :class="[$style.summaryValue, $style.income]">
            <Currency :value="accountSummary.income" />
          </span>
        </div>
        <div :class="$style.summaryCard">
          <span :class="$style.summaryLabel">{{ t('bankAccount.totalExpenses') }}</span>
          <span :class="[$style.summaryValue, $style.expense]">
            <Currency :value="accountSummary.expenses" />
          </span>
        </div>
        <div :class="$style.summaryCard">
          <span :class="$style.summaryLabel">{{ t('bankAccount.balance') }}</span>
          <span :class="[$style.summaryValue, accountBalance >= 0 ? $style.income : $style.expense]">
            <Currency :value="accountBalance" />
          </span>
        </div>
        <div :class="$style.summaryCard">
          <span :class="$style.summaryLabel">{{ t('bankAccount.transactionCount') }}</span>
          <span :class="$style.summaryValue">{{ accountSummary.totalTransactions }}</span>
        </div>
      </div>
    </div>

    <!-- Transaction Pane -->
    <TransactionPane
      :title="t('bankAccount.transactions')"
      :accountId="selectedBankAccount?.id"
    />
  </div>
</template>

<script lang="ts" setup>
import Button from '@components/base/button/Button.vue';
import Currency from '@components/base/currency/Currency.vue';
import TransactionPane from '@components/feature/TransactionPane.vue';
import {
  RiAddLine,
  RiDeleteBinLine,
  RiMoneyDollarCircleLine,
  RiBankLine
} from '@remixicon/vue';
import { useBankAccountStore } from '@store/bank-accounts';
import { useDataStore } from '@store/state';
import { useTransactionStore, type Transaction } from '@store/transactions';
import { findAccountBySlug } from '@utils/bankAccountRoutes.ts';
import { uuid } from '@utils/uuid.ts';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';

const { t } = useI18n();
const route = useRoute();
const $router = useRouter();
const bankAccountStore = useBankAccountStore();
const transactionStore = useTransactionStore();
const { state: dataState } = useDataStore();



// Get selected bank account from route parameter
const accountSlug = computed(() => route.params.accountSlug as string || '');
const selectedBankAccount = computed(() => {
  if (!accountSlug.value) return null;
  return findAccountBySlug(bankAccountStore.accounts.value, accountSlug.value);
});

// Get transactions for current account
const transactions = computed(() => {
  if (!selectedBankAccount.value) return [];
  return transactionStore.getTransactionsByAccountId(selectedBankAccount.value.id).value;
});

// Computed values
const accountBalance = computed(() => {
  if (!selectedBankAccount.value) return 0;
  return transactionStore.getAccountBalance(selectedBankAccount.value.id, selectedBankAccount.value.balance || 0).value;
});

// Account summary statistics
const accountSummary = computed(() => {
  if (!selectedBankAccount.value) return null;
  return transactionStore.getAccountSummary(selectedBankAccount.value.id).value;
});

// Methods for account management
const getAccountTypeLabel = (type?: string) => {
  if (!type) return '';
  return t(`bankAccounts.${type}`);
};
</script>

<style lang="scss" module>
.bankAccount {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--app-background);
}

.header {
  background: linear-gradient(135deg, #1a365d 0%, #2c5282 100%);
  color: white;
  padding: 20px;
  border-bottom: 2px solid var(--app-border);
}

.headerTitle {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 12px;
}

.headerIcon {
  font-size: 32px;
  color: rgba(255, 255, 255, 0.9);
}

.bankName {
  margin: 0;
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-l);
  color: white;
}

.accountInfo {
  display: flex;
  gap: 20px;
  font-size: var(--font-size-s);
  color: rgba(255, 255, 255, 0.9);
}

.accountName {
  font-weight: var(--font-weight-m);
}

.accountType {
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-size: var(--font-size-xs);
  margin: 2px 0 0 2px;
}

.balance {
  font-weight: var(--font-weight-m);
}

.summaryCards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin: 20px 0;
  padding: 0 24px;
}

.summaryCard {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.summaryLabel {
  color: rgba(255, 255, 255, 0.8);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-l);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.summaryValue {
  color: white;
  font-size: var(--font-size-l);
  font-weight: var(--font-weight-xl);

  &.income {
    color: #10B981;
  }

  &.expense {
    color: #EF4444;
  }
}



.errorState {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 40px;
  text-align: center;
  color: var(--theme-text);

  h2 {
    margin-bottom: 16px;
    color: var(--c-danger);
  }

  p {
    margin-bottom: 24px;
    color: var(--c-dimmed);
  }
}
</style>
