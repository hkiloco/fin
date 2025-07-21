<template>
  <div :class="$style.bankAccount">
    <!-- Header -->
    <div :class="$style.header">
      <h1 :class="$style.bankName">{{ selectedBankAccount?.bankName || t('bankAccount.bankAccount') }}</h1>
      <div :class="$style.accountInfo">
        <span :class="$style.accountName">{{ selectedBankAccount?.name }}</span>
        <span :class="$style.accountType">{{ getAccountTypeLabel(selectedBankAccount?.accountType) }}</span>
        <span :class="$style.balance">
          {{ t('bankAccount.balance') }}: <Currency :value="accountBalance" />
        </span>
      </div>
    </div>

    <!-- Transaction Table -->
    <div :class="$style.transactionContainer">
      <div :class="$style.tableActions">
        <Button
          :icon="RiAddLine"
          :text="t('bankAccount.addTransaction')"
          color="primary"
          size="s"
          @click="addNewTransaction"
        />
      </div>

      <div :class="$style.transactionTable">
        <!-- Table Header -->
        <div :class="$style.tableHeader">
          <span :class="$style.colDate">{{ t('bankAccount.date') }}</span>
          <span :class="$style.colPayee">{{ t('bankAccount.payee') }}</span>
          <span :class="$style.colCategory">{{ t('bankAccount.category') }}</span>
          <span :class="$style.colNotes">{{ t('bankAccount.notes') }}</span>
          <span :class="$style.colAmount">{{ t('bankAccount.amount') }}</span>
          <span :class="$style.colActions"></span>
        </div>

        <!-- Transaction Rows -->
        <div
          v-for="(transaction, index) in transactions"
          :key="transaction.id"
          :class="[$style.tableRow, { [$style.even]: index % 2 === 1 }]"
        >
          <span :class="$style.colDate">
            <TextCell
              :modelValue="transaction.date"
              @update:model-value="updateTransaction(transaction.id, 'date', $event)"
            />
          </span>
          <span :class="$style.colPayee">
            <TextCell
              :modelValue="transaction.payee"
              @update:model-value="updateTransaction(transaction.id, 'payee', $event)"
            />
          </span>
          <span :class="$style.colCategory">
            <TextCell
              :modelValue="transaction.category"
              @update:model-value="updateTransaction(transaction.id, 'category', $event)"
            />
          </span>
          <span :class="$style.colNotes">
            <TextCell
              :modelValue="transaction.notes || ''"
              @update:model-value="updateTransaction(transaction.id, 'notes', $event)"
            />
          </span>
          <span :class="$style.colAmount">
            <CurrencyCell
              :modelValue="transaction.amount"
              @update:model-value="updateTransaction(transaction.id, 'amount', $event)"
            />
          </span>
          <span :class="$style.colActions">
            <Button
              :icon="RiDeleteBinLine"
              color="danger"
              size="s"
              textual
              @click="deleteTransaction(transaction.id)"
            />
          </span>
        </div>

        <!-- Empty state -->
        <div v-if="transactions.length === 0" :class="$style.emptyState">
          <p>{{ t('bankAccount.noTransactions') }}</p>
          <Button
            :icon="RiAddLine"
            :text="t('bankAccount.addFirstTransaction')"
            color="primary"
            @click="addNewTransaction"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import Pane from '@components/feature/Pane.vue';
import YearToggle from '@components/feature/YearToggle.vue';
import Button from '@components/base/button/Button.vue';
import Currency from '@components/base/currency/Currency.vue';
import CurrencyCell from '@components/base/currency-cell/CurrencyCell.vue';
import TextCell from '@components/base/text-cell/TextCell.vue';
import Draggable from '@components/base/draggable/Draggable.vue';
import CellMenu from '@components/base/cell-menu/CellMenu.vue';
import { CellMenuActionId } from '@components/base/cell-menu/CellMenu.types';
import {
  RiAddCircleLine,
  RiCloseCircleLine,
  RiLockLine,
  RiLockUnlockLine
} from '@remixicon/vue';
import { useBankAccountStore } from '@store/bank-accounts';
import { useDataStore } from '@store/state';
import { useMonthNames } from '@composables/useMonthNames.ts';
import { useSettingsStore } from '@store/settings';
import { useStateUtils } from '@composables/useStateUtils.ts';
import { uuid } from '@utils/uuid.ts';
import { sum, average } from '@utils/array/array.ts';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';

const { state } = useDataStore();
const { state: settings } = useSettingsStore();
const { t } = useI18n();
const route = useRoute();
const bankAccountStore = useBankAccountStore();
const months = useMonthNames('long', () => settings.general.monthOffset);
const { isCurrentMonth } = useStateUtils();

// Get selected bank account
const selectedBankAccountId = computed(() => route.query.accountId as string || '');
const selectedBankAccount = computed(() => {
  if (!selectedBankAccountId.value) return null;
  return bankAccountStore.getBankAccount(selectedBankAccountId.value);
});

const pageTitle = computed(() => {
  return selectedBankAccount.value ? `${selectedBankAccount.value.name} - ${selectedBankAccount.value.bankName}` : 'Bank Account';
});

// Transaction categories storage (similar to budget groups but for bank transactions)
const transactionCategories = ref([
  { id: uuid(), name: 'Groceries', values: new Array(12).fill(0) },
  { id: uuid(), name: 'Gas & Transportation', values: new Array(12).fill(0) },
  { id: uuid(), name: 'Restaurants', values: new Array(12).fill(0) },
  { id: uuid(), name: 'Shopping', values: new Array(12).fill(0) },
  { id: uuid(), name: 'Bills & Utilities', values: new Array(12).fill(0) }
]);

// UI state
const allowDelete = ref(false);

// Computed values for grid
const monthlyTotals = computed(() => {
  const totals = new Array(12).fill(0);
  transactionCategories.value.forEach(category => {
    category.values.forEach((value, index) => {
      totals[index] += value;
    });
  });
  return totals;
});

const totalBalance = computed(() => {
  return transactionCategories.value.reduce((total, category) =>
    total + sum(category.values), 0
  );
});

const averageBalance = computed(() => {
  const total = totalBalance.value;
  return total / 12;
});

// Methods for grid management
const addCategory = () => {
  transactionCategories.value.push({
    id: uuid(),
    name: 'New Category',
    values: new Array(12).fill(0)
  });
};

const removeCategory = (id: string) => {
  const index = transactionCategories.value.findIndex(cat => cat.id === id);
  if (index !== -1) {
    transactionCategories.value.splice(index, 1);
  }
};

const updateCategoryName = (id: string, name: string) => {
  const category = transactionCategories.value.find(cat => cat.id === id);
  if (category) {
    category.name = name;
  }
};

const updateCategoryValue = (id: string, monthIndex: number, amount: number) => {
  const category = transactionCategories.value.find(cat => cat.id === id);
  if (category) {
    category.values[monthIndex] = amount;
  }
};

const performAction = (action: CellMenuActionId, categoryId: string, monthIndex: number, value: number) => {
  const category = transactionCategories.value.find(cat => cat.id === categoryId);
  if (!category) return;

  switch (action) {
    case 'fill':
      category.values.fill(value);
      break;
    case 'fill-to-right':
      category.values.fill(value, monthIndex);
      break;
  }
};
</script>

<style lang="scss" module>
.titleSection {
  display: flex;
  align-items: center;
  gap: 12px;
}

.bankMeta {
  font-size: var(--font-size-xs);
  color: var(--c-text-dimmed);
  font-weight: var(--font-weight-m);
}

.transactionGrid {
  display: grid;
  grid-template: auto / max-content max-content max-content repeat(12, 1fr) max-content max-content;
  align-items: center;
  padding-bottom: 20px;
}

.sum {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-l);
  padding-right: 10px;

  &.totals {
    margin-left: 5px;
  }
}

.month {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-m);
  padding-right: 20px;
  padding-bottom: 5px;

  position: sticky;
  position: -webkit-sticky;
  top: 0;
  background: var(--app-background);
  border: 2px var(--app-background);

  &.current > span {
    color: var(--c-text-light);
    display: inline-block;
    position: relative;
    z-index: 0;

    &::before {
      content: '';
      position: absolute;
      inset: -3px -8px;
      border-radius: 100px;
      background: var(--c-primary);
      z-index: -1;
    }
  }

  > span {
    display: inline-block;
  }

  &.start {
    border-bottom-left-radius: var(--border-radius-l);
    padding-left: 8px;
  }

  &.end {
    border-bottom-right-radius: var(--border-radius-l);
    padding-right: 8px;
  }
}

.categoryHeader {
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

.currencyCell {
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

  &.firstColumn {
    border-left: 1px solid var(--grid-border-color);
  }

  &.currentMonth {
    background: var(--grid-background-odd-active);
  }

  &:focus-within {
    box-shadow: 0 0 0 2px var(--c-primary) inset;
    border-radius: 1px;
  }

  &.even {
    background: var(--grid-background-even);

    &.currentMonth {
      background: var(--grid-background-even-active);
    }
  }
}
</style>
