<template>
  <Pane :amount="totalBalance" :title="pageTitle">
    <template #title>
      <div :class="$style.titleSection">
        <span>{{ selectedBankAccount?.name || t('bankAccount.bankAccount') }}</span>
        <span :class="$style.bankMeta">{{ selectedBankAccount?.bankName }}</span>
      </div>
    </template>
    <template #header>
      <YearToggle keyPath="bankAccount.transactionsFor" />
    </template>

    <div :class="$style.transactionGrid">
      <!-- Header -->
      <span />
      <span />
      <span />

      <!-- Months -->
      <span
        v-for="(month, index) of months"
        :key="month"
        :class="[
          $style.month,
          {
            [$style.current]: isCurrentMonth(index),
            [$style.start]: index === 0,
            [$style.end]: index === 11
          }
        ]"
      >
        <span>{{ month }}</span>
      </span>
      <span />
      <span />

      <!-- Totals Row -->
      <span />
      <Button
        :color="allowDelete ? 'danger' : 'success'"
        :icon="allowDelete ? RiLockUnlockLine : RiLockLine"
        textual
        @click="allowDelete = !allowDelete"
      />
      <span :class="[$style.sum, $style.totals]">{{ t('shared.totals') }}</span>
      <Currency
        v-for="(total, index) of monthlyTotals"
        :key="index"
        :value="total"
        :class="$style.sum"
      />
      <span />
      <span />

      <!-- Transaction Categories -->
      <template v-for="(category, categoryIndex) of transactionCategories" :key="category.id">
        <Draggable
          :id="category.id"
          name="transaction-categories"
        />

        <Button
          color="dimmed"
          :disabled="!allowDelete"
          :icon="RiCloseCircleLine"
          textual
          @click="removeCategory(category.id)"
        />

        <span :class="$style.categoryHeader">
          <TextCell
            :modelValue="category.name"
            @update:model-value="updateCategoryName(category.id, $event)"
          />
        </span>

        <span
          v-for="(_, monthIndex) of category.values"
          :key="category.id + monthIndex"
          :class="[
            $style.currencyCell,
            {
              [$style.even]: categoryIndex % 2,
              [$style.firstRow]: categoryIndex === 0,
              [$style.firstColumn]: monthIndex === 0,
              [$style.currentMonth]: isCurrentMonth(monthIndex),
            }
          ]"
        >
          <CellMenu
            :actions="[
              { id: 'fill', label: t('shared.fillRow') },
              { id: 'fill-to-right', label: t('shared.fillRowToRight') }
            ]"
            @action="performAction($event, category.id, monthIndex, category.values[monthIndex])"
          >
            <CurrencyCell
              :modelValue="category.values[monthIndex]"
              @update:model-value="updateCategoryValue(category.id, monthIndex, $event)"
            />
          </CellMenu>
        </span>

        <Currency :class="$style.meta" :value="sum(category.values)" />
        <Currency :class="$style.meta" :value="average(category.values)" />
      </template>

      <!-- Add Category Row -->
      <span />
      <Button :icon="RiAddCircleLine" textual @click="addCategory" />
      <span style="grid-column: 3 / 16" />
      <Currency :class="[$style.meta, $style.bold]" :value="totalBalance" />
      <Currency :class="[$style.meta, $style.bold]" :value="averageBalance" />
    </div>
  </Pane>
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

.accountHeader {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
}

.accountInfo {
  flex: 1;
}

.accountTitle {
  margin: 0 0 12px 0;
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-l);
  color: white;
}

.accountMeta {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: var(--font-size-s);
  
  .bankName {
    color: rgba(255, 255, 255, 0.9);
    font-weight: var(--font-weight-m);
  }
  
  .accountType {
    color: rgba(255, 255, 255, 0.8);
    font-size: var(--font-size-xs);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  .balance, .uncleared {
    color: rgba(255, 255, 255, 0.9);
  }
  
  .balance {
    font-weight: var(--font-weight-m);
  }
}

.yearToggle {
  padding: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: var(--border-radius-m);
}

.actionBar {
  display: flex;
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 1px solid var(--app-border);
  background: var(--app-background-secondary);
}

.filtersSection {
  padding: 16px 20px;
  border-bottom: 1px solid var(--app-border);
  background: var(--app-background-secondary);
}

.filters {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 16px;
  align-items: end;
}

.transactionTable {
  flex: 1;
  overflow-y: auto;
  background: var(--app-background);
}

.tableHeader {
  display: grid;
  grid-template-columns: 100px 1fr 150px 150px 120px 80px;
  gap: 12px;
  padding: 12px 20px;
  background: var(--app-background-secondary);
  border-bottom: 2px solid var(--app-border);
  font-weight: var(--font-weight-m);
  font-size: var(--font-size-xs);
  color: var(--c-text-dimmed);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  position: sticky;
  top: 0;
  z-index: 1;
}

.tableRow {
  display: grid;
  grid-template-columns: 100px 1fr 150px 150px 120px 80px;
  gap: 12px;
  padding: 12px 20px;
  border-bottom: 1px solid var(--app-border);
  font-size: var(--font-size-s);
  transition: background-color 0.2s;
  
  &:hover {
    background: var(--app-background-secondary);
  }
  
  &:nth-child(even) {
    background: rgba(0, 0, 0, 0.02);
    
    &:hover {
      background: var(--app-background-secondary);
    }
  }
}

.colDate {
  font-size: var(--font-size-xs);
  color: var(--c-text-dimmed);
}

.colPayee {
  font-weight: var(--font-weight-m);
}

.colCategory {
  .categoryBadge {
    display: inline-block;
    padding: 4px 8px;
    background: var(--c-primary);
    color: white;
    border-radius: var(--border-radius-s);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-m);
  }
}

.colNotes {
  font-size: var(--font-size-xs);
  color: var(--c-text-dimmed);
}

.colAmount {
  text-align: right;
  
  .expenseAmount {
    font-weight: var(--font-weight-l);
    color: #e53e3e;
  }
  
  .incomeAmount {
    font-weight: var(--font-weight-l);
    color: #38a169;
  }
}

.colActions {
  display: flex;
  gap: 4px;
  justify-content: center;
}

.emptyState {
  text-align: center;
  padding: 80px 20px;
  color: var(--c-text-dimmed);
}

.emptyIcon {
  font-size: 64px;
  margin-bottom: 20px;
  color: var(--c-text-dimmed);
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  border-top: 1px solid var(--app-border);
  background: var(--app-background-secondary);
}

.pageInfo {
  font-size: var(--font-size-s);
  color: var(--c-text-dimmed);
}

.transactionForm {
  min-width: 500px;
}

.formRow {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
}

.formActions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}

@media (max-width: 1024px) {
  .tableHeader,
  .tableRow {
    grid-template-columns: 80px 1fr 120px 100px 100px 60px;
    gap: 8px;
    padding: 8px 12px;
  }
  
  .filters {
    grid-template-columns: 1fr;
  }
  
  .formRow {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .accountHeader {
    flex-direction: column;
    gap: 12px;
  }
  
  .accountMeta {
    gap: 4px;
  }
  
  .actionBar {
    flex-wrap: wrap;
  }
  
  .tableHeader,
  .tableRow {
    grid-template-columns: 1fr;
    gap: 4px;
  }
  
  .tableHeader {
    display: none;
  }
  
  .tableRow {
    display: block;
    padding: 16px;
    
    > span {
      display: block;
      margin-bottom: 4px;
    }
  }
}
</style>
