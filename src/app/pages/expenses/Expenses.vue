<template>
  <div :class="$style.expensesPage">
    <div :class="$style.header">
      <div :class="$style.titleSection">
        <YearToggle keyPath="page.expenses.expensesFor" />
        <div :class="$style.accountActions">
          <Button
            :icon="RiAddLine"
            :text="t('expenses.addAccount')"
            color="primary"
            size="s"
            @click="addNewAccount"
          />
          <Button
            :icon="RiSettings3Line"
            :text="t('expenses.manageAccounts')"
            color="secondary"
            size="s"
            @click="toggleAccountManager"
          />
        </div>
      </div>
    </div>

    <BudgetPane type="expenses">
      <template #title>
        <div :class="$style.paneTitle">
          <span>{{ t('page.expenses.title') }}</span>
          <span :class="$style.accountCount">({{ state.expenses.length }} {{ t('expenses.accounts') }})</span>
        </div>
      </template>
    </BudgetPane>

    <!-- Account Manager Modal -->
    <Dialog v-if="showAccountManager" @close="showAccountManager = false">
      <template #title>{{ t('expenses.accountManager') }}</template>
      <template #content>
        <div :class="$style.accountManager">
          <div v-if="state.expenses.length === 0" :class="$style.emptyState">
            <RiAccountBoxLine :class="$style.emptyIcon" />
            <p>{{ t('expenses.noAccounts') }}</p>
            <Button
              :icon="RiAddLine"
              :text="t('expenses.createFirstAccount')"
              color="primary"
              @click="addNewAccount"
            />
          </div>
          <div v-else :class="$style.accountList">
            <div
              v-for="(account, index) in state.expenses"
              :key="account.id"
              :class="$style.accountItem"
            >
              <div :class="$style.accountInfo">
                <RiAccountBoxLine :class="$style.accountIcon" />
                <div :class="$style.accountDetails">
                  <span :class="$style.accountName">{{ account.name }}</span>
                  <span :class="$style.accountStats">
                    {{ account.budgets.length }} {{ t('expenses.categories') }} •
                    <Currency :value="getAccountTotal(account)" />
                  </span>
                </div>
              </div>
              <div :class="$style.accountActions">
                <Button
                  :icon="RiEditLine"
                  color="secondary"
                  size="s"
                  textual
                  @click="editAccount(account)"
                />
                <Button
                  :icon="RiDeleteBinLine"
                  color="danger"
                  size="s"
                  textual
                  @click="confirmDeleteAccount(account)"
                />
              </div>
            </div>
          </div>
        </div>
      </template>
    </Dialog>
  </div>
</template>

<script lang="ts" setup>
import BudgetPane from '@components/feature/BudgetPane.vue';
import YearToggle from '@components/feature/YearToggle.vue';
import Button from '@components/base/button/Button.vue';
import Dialog from '@components/base/dialog/Dialog.vue';
import Currency from '@components/base/currency/Currency.vue';
import { RiAddLine, RiSettings3Line, RiAccountBoxLine, RiEditLine, RiDeleteBinLine } from '@remixicon/vue';
import { useDataStore } from '@store/state';
import { BudgetGroup } from '@store/state/types';
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { sum } from '@utils/array/array.ts';

const { state, addBudgetGroup, removeBudgetGroup, setBudgetGroupName } = useDataStore();
const { t } = useI18n();

const showAccountManager = ref(false);

const addNewAccount = () => {
  addBudgetGroup('expenses');
  showAccountManager.value = false;
};

const toggleAccountManager = () => {
  showAccountManager.value = !showAccountManager.value;
};

const getAccountTotal = (account: BudgetGroup) => {
  return account.budgets.reduce((total, budget) => total + sum(budget.values), 0);
};

const editAccount = (account: BudgetGroup) => {
  const newName = prompt(t('expenses.enterAccountName'), account.name);
  if (newName && newName.trim()) {
    setBudgetGroupName(account.id, newName.trim());
  }
};

const confirmDeleteAccount = (account: BudgetGroup) => {
  if (confirm(t('expenses.confirmDeleteAccount', { name: account.name }))) {
    removeBudgetGroup(account.id);
  }
};
</script>

<style lang="scss" module>
.expensesPage {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.header {
  padding: 20px 20px 10px;
  border-bottom: 1px solid var(--app-border);
}

.titleSection {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
}

.accountActions {
  display: flex;
  gap: 10px;
}

.paneTitle {
  display: flex;
  align-items: center;
  gap: 8px;
}

.accountCount {
  font-size: var(--font-size-xs);
  color: var(--c-text-dimmed);
  font-weight: var(--font-weight-m);
}

.accountManager {
  min-width: 500px;
  max-height: 400px;
  overflow-y: auto;
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

.accountList {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.accountItem {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border: 1px solid var(--app-border);
  border-radius: var(--border-radius-m);
  background: var(--app-background-secondary);
}

.accountInfo {
  display: flex;
  align-items: center;
  gap: 12px;
}

.accountIcon {
  font-size: 24px;
  color: var(--c-primary);
}

.accountDetails {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.accountName {
  font-weight: var(--font-weight-m);
  font-size: var(--font-size-m);
}

.accountStats {
  font-size: var(--font-size-xs);
  color: var(--c-text-dimmed);
}

.accountActions {
  display: flex;
  gap: 8px;
}
</style>
