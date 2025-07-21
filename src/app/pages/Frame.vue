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
        :class="$style.btn"
        color="success"
        textual
        @click="openAddBankAccountDialog"
      />

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
      <template #title>{{ t('bankAccounts.addBankAccount') }}</template>
      <template #content>
        <div :class="$style.bankAccountForm">
          <TextField
            :value="bankAccountForm.name"
            :label="t('bankAccounts.accountName')"
            required
            @update:value="bankAccountForm.name = $event"
          />
          <TextField
            :value="bankAccountForm.bankName"
            :label="t('bankAccounts.bankName')"
            required
            @update:value="bankAccountForm.bankName = $event"
          />
          <Select
            :value="bankAccountForm.accountType"
            :options="accountTypeOptions"
            :label="t('bankAccounts.accountType')"
            required
            @update:value="bankAccountForm.accountType = $event"
          />
          <TextField
            :value="bankAccountForm.balance"
            :label="t('bankAccounts.initialBalance')"
            type="number"
            step="0.01"
            @update:value="bankAccountForm.balance = parseFloat($event) || 0"
          />
          <div :class="$style.formActions">
            <Button
              :text="t('shared.cancel')"
              color="secondary"
              @click="closeAddBankAccountDialog"
            />
            <Button
              :text="t('shared.add')"
              color="primary"
              @click="addBankAccount"
            />
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

const closeAddBankAccountDialog = () => {
  showAddBankAccount.value = false;
  resetBankAccountForm();
};

const addBankAccount = () => {
  if (bankAccountForm.name.trim() && bankAccountForm.bankName.trim()) {
    bankAccountStore.addBankAccount({
      name: bankAccountForm.name.trim(),
      bankName: bankAccountForm.bankName.trim(),
      accountType: bankAccountForm.accountType,
      balance: bankAccountForm.balance
    });
    closeAddBankAccountDialog();
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
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.formActions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 8px;
}
</style>
