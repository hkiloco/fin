<template>
  <div :class="$style.frame">
    <div ref="menu" :class="$style.buttons">
      <template v-if="media !== 'mobile'">
        <ThemeButton :class="$style.btn" />
        <div :class="$style.divider" />
      </template>

      <Link
        v-for="button of buttons"
        :key="button.name"
        :tooltip="button.tooltip"
        tooltipPosition="right"
        testId="navigation"
        :class="$style.btn"
        :color="(currentRoute) => (currentRoute ? 'primary' : 'dimmed')"
        :icon="button.icon"
        :name="button.name"
      />

      <!-- Bank Accounts Section -->
      <div v-if="media !== 'mobile'" :class="$style.divider" />

      <!-- Add Bank Account Button -->
      <Button
        :icon="RiAddLine"
        :tooltip="t('bankAccounts.addBankAccount')"
        tooltipPosition="right"
        :class="[$style.btn, { [$style.clicked]: showAddBankAccount }]"
        color="success"
        textual
        @click="openAddBankAccountDialog"
      />

      <!-- Debug text -->
      <div v-if="showAddBankAccount" style="color: red; font-size: 12px;">Dialog should be open</div>

      <!-- Bank Account List -->
      <Link
        v-for="account in bankAccountStore.accounts.value"
        :key="account.id"
        :tooltip="account.name"
        tooltipPosition="right"
        testId="bank-account"
        :class="[$style.btn, $style.bankAccountBtn]"
        :color="(currentRoute) => (currentRoute && $route.query.accountId === account.id ? 'primary' : 'dimmed')"
        :icon="RiBankLine"
        name="expense-details"
        :query="{ accountId: account.id }"
      />

      <div v-if="media !== 'mobile'" style="flex-grow: 1" />

      <ToolsButton :class="$style.btn" />
      <AdminButton v-if="user?.admin" :class="$style.btn" />
      <ChangeYearButton :class="$style.btn" />

      <template v-if="media !== 'mobile'">
        <SettingsButton :class="$style.btn" />
        <InfoButton :class="$style.btn" />
      </template>

      <div :class="$style.divider" />
      <UpdateAppButton v-if="media !== 'mobile'" :class="$style.btn" />
      <CloudButton :class="$style.btn" />
    </div>

    <div ref="panes" :class="$style.panes">
      <StatusBar />

      <!-- eslint-disable vue/no-template-shadow -->
      <RouterView v-slot="{ Component }">
        <ComponentTransition :is="Component" v-if="Component" />
      </RouterView>
    </div>

    <!-- Add Bank Account Dialog -->
    <Dialog v-if="showAddBankAccount" @close="closeAddBankAccountDialog">
      <template #title>Add Bank Account</template>
      <template #content>
        <div :class="$style.bankAccountForm">
          <p>Dialog is working! Debug value: {{ showAddBankAccount }}</p>
          <div>
            <label>Account Name:</label>
            <input
              v-model="bankAccountForm.name"
              type="text"
              placeholder="Enter account name"
            />
          </div>
          <div>
            <label>Bank Name:</label>
            <input
              v-model="bankAccountForm.bankName"
              type="text"
              placeholder="Enter bank name"
            />
          </div>
          <div :class="$style.formActions">
            <button @click="closeAddBankAccountDialog">Cancel</button>
            <button @click="addBankAccount">Add Account</button>
          </div>
        </div>
      </template>
    </Dialog>
  </div>
</template>

<script lang="ts" setup>
import AdminButton from './navigation/admin/AdminButton.vue';
import CloudButton from './navigation/auth/CloudButton.vue';
import InfoButton from './navigation/info/InfoButton.vue';
import SettingsButton from './navigation/settings/SettingsButton.vue';
import ThemeButton from './navigation/theme/ThemeButton.vue';
import ToolsButton from './navigation/tools/ToolsButton.vue';
import ChangeYearButton from './navigation/year/ChangeYearButton.vue';
import StatusBar from './status-bar/StatusBar.vue';
import UpdateAppButton from '@app/pages/navigation/update/UpdateAppButton.vue';
import Link from '@components/base/link/Link.vue';
import Button from '@components/base/button/Button.vue';
import Dialog from '@components/base/dialog/Dialog.vue';
import TextField from '@components/base/text-field/TextField.vue';
import Select from '@components/base/select/Select.vue';
import ComponentTransition from '@components/misc/component-transition/ComponentTransition.vue';
import { useMediaQuery } from '@composables/useMediaQuery.ts';
import { RiDonutChartLine, RiHandCoinLine, RiShoppingBagLine, RiBarChartBoxLine, RiAddLine, RiBankLine } from '@remixicon/vue';
import { useStorage } from '@storage/index';
import { useBankAccountStore } from '@store/bank-accounts';
import { computed, ref, reactive } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import type { Component } from 'vue';

const menu = ref<HTMLDivElement>();
const media = useMediaQuery();
const { user } = useStorage();
const { t } = useI18n();
const $route = useRoute();
const bankAccountStore = useBankAccountStore();

// Bank account management state
const showAddBankAccount = ref(false);
const bankAccountForm = reactive({
  name: '',
  bankName: '',
  accountType: 'checking' as 'checking' | 'savings' | 'credit' | 'investment',
  balance: 0
});

interface FrameButton {
  icon: Component;
  name: string;
  tooltip: string;
}

const buttons = computed((): FrameButton[] => [
  { icon: RiDonutChartLine, name: 'dashboard', tooltip: t('page.dashboard.title') },
  { icon: RiHandCoinLine, name: 'income', tooltip: t('page.income.title') },
  { icon: RiShoppingBagLine, name: 'expenses', tooltip: t('page.expenses.title') },
  { icon: RiBarChartBoxLine, name: 'expense-details', tooltip: t('expenses.expenseTrackingDetails') }
]);

const accountTypeOptions = computed(() => [
  { value: 'checking', label: t('bankAccounts.checking') },
  { value: 'savings', label: t('bankAccounts.savings') },
  { value: 'credit', label: t('bankAccounts.credit') },
  { value: 'investment', label: t('bankAccounts.investment') }
]);

const resetBankAccountForm = () => {
  bankAccountForm.name = '';
  bankAccountForm.bankName = '';
  bankAccountForm.accountType = 'checking';
  bankAccountForm.balance = 0;
};

const openAddBankAccountDialog = () => {
  console.log('Opening add bank account dialog');
  showAddBankAccount.value = true;
};

const closeAddBankAccountDialog = () => {
  console.log('Closing add bank account dialog');
  showAddBankAccount.value = false;
  resetBankAccountForm();
};

const addBankAccount = () => {
  console.log('Add bank account called', bankAccountForm);

  if (bankAccountForm.name.trim() && bankAccountForm.bankName.trim()) {
    console.log('Adding bank account:', {
      name: bankAccountForm.name.trim(),
      bankName: bankAccountForm.bankName.trim(),
      accountType: bankAccountForm.accountType,
      balance: bankAccountForm.balance
    });

    bankAccountStore.addBankAccount({
      name: bankAccountForm.name.trim(),
      bankName: bankAccountForm.bankName.trim(),
      accountType: bankAccountForm.accountType,
      balance: bankAccountForm.balance
    });

    console.log('Bank accounts after adding:', bankAccountStore.accounts.value);
    closeAddBankAccountDialog();
  } else {
    console.log('Form validation failed:', {
      name: bankAccountForm.name,
      bankName: bankAccountForm.bankName
    });
  }
};
</script>

<style lang="scss" module>
@use '@styles/globals.scss';
@use 'sass:math';

.frame {
  display: flex;
  height: 100%;
  width: 100%;
}

.panes {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  height: 100%;
  width: 100%;
}

.buttons {
  display: flex;
  height: 100%;
  flex-direction: column;
  border-right: 1px solid var(--app-border);
  padding: 15px 10px;
  gap: 15px;

  .top {
    margin-top: auto;
  }

  .divider {
    width: 100%;
    height: 1px;
    background: var(--app-border);
  }

  .mobileDivider {
    display: none;
    width: 1px;
    background: var(--app-border);
    height: 100%;
    margin: 0 -15px;
  }

  .btn {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .bankAccountBtn {
    position: relative;

    &::after {
      content: '';
      position: absolute;
      right: 2px;
      top: 2px;
      width: 8px;
      height: 8px;
      background: var(--c-success);
      border-radius: 50%;
      border: 2px solid var(--app-background);
    }
  }
}

@include globals.onMobileDevices {
  .frame {
    flex-direction: column-reverse;
  }

  .panes {
    height: auto;
    flex-grow: 1;
  }

  .buttons {
    border: none;
    border-top: 1px solid var(--app-border);
    align-items: center;
    margin-top: 0;
    justify-content: space-evenly;
    flex-direction: row-reverse;
    height: auto;
    padding: 14px 4px;

    .divider {
      display: none;
    }
  }
}

.bankAccountForm {
  min-width: 400px;
  padding: 20px;

  > div {
    margin-bottom: 12px;
  }

  label {
    display: block;
    margin-bottom: 4px;
    font-weight: bold;
  }

  input {
    width: 100%;
    padding: 8px;
    border: 1px solid #ccc;
    border-radius: 4px;
  }

  p {
    color: green;
    font-weight: bold;
  }
}

.formActions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;

  button {
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    cursor: pointer;

    &:first-child {
      background: #ccc;
    }

    &:last-child {
      background: #007bff;
      color: white;
    }
  }
}
</style>
