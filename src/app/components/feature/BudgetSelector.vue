<template>
  <div :class="$style.budgetSelector">
    <!-- Group Selector -->
    <div :class="$style.field">
      <InlineSelect
        v-model="selectedGroup"
        :options="groupOptions"
        placeholder="Select group..."
        @update:model-value="onGroupChange"
      />
    </div>

    <!-- Category Selector -->
    <div :class="$style.field">
      <InlineSelect
        v-model="selectedCategory"
        :options="categoryOptions"
        :disabled="!selectedGroup"
        placeholder="Select category..."
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import InlineSelect from '@components/base/inline-select/InlineSelect.vue';
import { useDataStore } from '@store/state';
import { useTransactionStore } from '@store/transactions';
import { computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
  group?: string;
  category?: string;
  type: 'income' | 'expense';
}>();

const emit = defineEmits<{
  'update:group': [value: string];
  'update:category': [value: string];
}>();

const { t } = useI18n();
const { state: dataState } = useDataStore();
const transactionStore = useTransactionStore();

const selectedGroup = computed({
  get: () => props.group || '',
  set: (value) => emit('update:group', value)
});

const selectedCategory = computed({
  get: () => props.category || '',
  set: (value) => emit('update:category', value)
});

// Get budget groups from the current year's data
const currentYear = new Date().getFullYear();
const currentYearData = computed(() => {
  return dataState.years.find(y => y.year === currentYear);
});

// Build group options from budget data + existing transaction groups
const groupOptions = computed(() => {
  const budgetGroups = currentYearData.value 
    ? currentYearData.value[props.type === 'expense' ? 'expenses' : 'income']
    : [];
  
  const existingGroups = transactionStore.getAvailableGroups.value;
  
  const allGroups = new Set([
    ...budgetGroups.map(g => g.name),
    ...existingGroups
  ]);

  return Array.from(allGroups).sort().map(name => ({
    id: name,
    label: name
  }));
});

// Build category options based on selected group
const categoryOptions = computed(() => {
  if (!selectedGroup.value) return [];
  
  const budgetGroups = currentYearData.value 
    ? currentYearData.value[props.type === 'expense' ? 'expenses' : 'income']
    : [];
  
  // Find matching budget group
  const budgetGroup = budgetGroups.find(g => g.name === selectedGroup.value);
  const budgetCategories = budgetGroup ? budgetGroup.budgets.map(b => b.name) : [];
  
  // Get existing transaction categories for this group
  const existingCategories = transactionStore.getAvailableCategoriesForGroup(selectedGroup.value).value;
  
  const allCategories = new Set([
    ...budgetCategories,
    ...existingCategories
  ]);

  return Array.from(allCategories).sort().map(name => ({
    id: name,
    label: name
  }));
});

// Reset category when group changes
const onGroupChange = (newGroup: string) => {
  selectedGroup.value = newGroup;
  selectedCategory.value = '';
};

// Watch for external changes and update local state
watch([() => props.group, () => props.category], ([newGroup, newCategory]) => {
  if (newGroup !== selectedGroup.value) {
    selectedGroup.value = newGroup || '';
  }
  if (newCategory !== selectedCategory.value) {
    selectedCategory.value = newCategory || '';
  }
});
</script>

<style lang="scss" module>
.budgetSelector {
  display: flex;
  gap: 12px;
  width: 100%;
}

.field {
  flex: 1;
  min-width: 0;
}
</style>
