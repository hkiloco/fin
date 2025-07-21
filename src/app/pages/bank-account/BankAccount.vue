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
import Button from '@components/base/button/Button.vue';
import Currency from '@components/base/currency/Currency.vue';
import CurrencyCell from '@components/base/currency-cell/CurrencyCell.vue';
import TextCell from '@components/base/text-cell/TextCell.vue';
import {
  RiAddLine,
  RiDeleteBinLine
} from '@remixicon/vue';
import { useBankAccountStore } from '@store/bank-accounts';
import { uuid } from '@utils/uuid.ts';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';

// Transaction interface
interface Transaction {
  id: string;
  date: string;
  payee: string;
  category: string;
  notes?: string;
  amount: number;
}

const { t } = useI18n();
const route = useRoute();
const bankAccountStore = useBankAccountStore();

// Get selected bank account
const selectedBankAccountId = computed(() => route.query.accountId as string || '');
const selectedBankAccount = computed(() => {
  if (!selectedBankAccountId.value) return null;
  return bankAccountStore.getBankAccount(selectedBankAccountId.value);
});

// Transactions storage
const transactions = ref<Transaction[]>([
  {
    id: uuid(),
    date: '2024-01-15',
    payee: 'Grocery Store',
    category: 'Groceries',
    notes: 'Weekly shopping',
    amount: -125.50
  },
  {
    id: uuid(),
    date: '2024-01-14',
    payee: 'Gas Station',
    category: 'Transportation',
    notes: '',
    amount: -45.00
  },
  {
    id: uuid(),
    date: '2024-01-13',
    payee: 'Salary Deposit',
    category: 'Income',
    notes: 'Monthly salary',
    amount: 3500.00
  }
]);

// Computed values
const accountBalance = computed(() => {
  const initialBalance = selectedBankAccount.value?.balance || 0;
  const transactionTotal = transactions.value.reduce((sum, t) => sum + t.amount, 0);
  return initialBalance + transactionTotal;
});

// Methods for transaction management
const getAccountTypeLabel = (type?: string) => {
  if (!type) return '';
  return t(`bankAccounts.${type}`);
};

const addNewTransaction = () => {
  const newTransaction: Transaction = {
    id: uuid(),
    date: new Date().toISOString().split('T')[0],
    payee: '',
    category: '',
    notes: '',
    amount: 0
  };
  transactions.value.unshift(newTransaction);
};

const updateTransaction = (id: string, field: keyof Transaction, value: string | number) => {
  const transaction = transactions.value.find(t => t.id === id);
  if (transaction) {
    if (field === 'amount') {
      transaction[field] = typeof value === 'string' ? parseFloat(value) || 0 : value;
    } else {
      (transaction as any)[field] = value;
    }
  }
};

const deleteTransaction = (id: string) => {
  if (confirm(t('bankAccount.confirmDeleteTransaction'))) {
    const index = transactions.value.findIndex(t => t.id === id);
    if (index !== -1) {
      transactions.value.splice(index, 1);
    }
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

.bankName {
  margin: 0 0 12px 0;
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
}

.balance {
  font-weight: var(--font-weight-m);
}

.transactionContainer {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.tableActions {
  padding: 16px 20px;
  border-bottom: 1px solid var(--app-border);
  background: var(--app-background-secondary);
}

.transactionTable {
  flex: 1;
  overflow-y: auto;
}

.tableHeader {
  display: grid;
  grid-template-columns: 120px 1fr 150px 200px 120px 60px;
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
  grid-template-columns: 120px 1fr 150px 200px 120px 60px;
  gap: 12px;
  padding: 8px 20px;
  border-bottom: 1px solid var(--app-border);
  font-size: var(--font-size-s);
  transition: background-color 0.2s;
  align-items: center;

  &:hover {
    background: var(--app-background-secondary);
  }

  &.even {
    background: rgba(0, 0, 0, 0.02);

    &:hover {
      background: var(--app-background-secondary);
    }
  }
}

.colDate {
  font-size: var(--font-size-xs);
}

.colPayee {
  font-weight: var(--font-weight-m);
}

.colCategory {
  font-size: var(--font-size-xs);
}

.colNotes {
  font-size: var(--font-size-xs);
  color: var(--c-text-dimmed);
}

.colAmount {
  text-align: right;
}

.colActions {
  display: flex;
  justify-content: center;
}

.emptyState {
  text-align: center;
  padding: 80px 20px;
  color: var(--c-text-dimmed);

  p {
    margin-bottom: 16px;
  }
}

@media (max-width: 768px) {
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
      margin-bottom: 8px;

      &:before {
        content: attr(data-label) ': ';
        font-weight: var(--font-weight-m);
        color: var(--c-text-dimmed);
        font-size: var(--font-size-xs);
      }
    }
  }
}
</style>
