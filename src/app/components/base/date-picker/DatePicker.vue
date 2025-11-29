<template>
  <VueDatePicker
    v-model="dateValue"
    :format="dateFormat"
    :enable-time-picker="false"
    :auto-apply="true"
    :clearable="false"
    :inline="false"
    :placeholder="t('datePicker.selectDate')"
    :week-start="0"
    :dark="isDark"
    class="dp-custom"
  />
</template>

<script lang="ts" setup>
import VueDatePicker from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css';
import { computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
  modelValue: string; // ISO date string (YYYY-MM-DD)
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const { t } = useI18n();

// Check if dark mode is enabled
const isDark = computed(() => {
  return document.documentElement.classList.contains('dark') || 
         window.matchMedia('(prefers-color-scheme: dark)').matches;
});

// Convert string date to Date object for the picker
const dateValue = computed({
  get() {
    return props.modelValue ? new Date(props.modelValue) : null;
  },
  set(value: Date | null) {
    if (value) {
      // Convert to ISO date string (YYYY-MM-DD)
      const isoString = value.toISOString().split('T')[0];
      emit('update:modelValue', isoString);
    } else {
      emit('update:modelValue', '');
    }
  }
});

// Date format for display
const dateFormat = computed(() => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(new Date()).includes(',') ? 'MMM dd, yyyy' : 'MMM dd yyyy';
});
</script>

<style>
/* Override Vue Datepicker styles to match app theme */
.dp-custom {
  --dp-font-family: inherit;
  --dp-border-radius: var(--border-radius-s, 4px);
  --dp-cell-border-radius: var(--border-radius-s, 4px);
  --dp-button-height: 32px;
  --dp-month-year-row-height: 32px;
  --dp-cell-size: 32px;
  --dp-cell-padding: 5px;
  --dp-common-transition: all 0.1s ease-out;
  --dp-menu-min-width: 260px;
  --dp-animation-duration: 0.1s;
  --dp-menu-appear-transition-timing: cubic-bezier(.4, 0, 1, 1);
  --dp-transition-length: 0.1s;
}

/* Light theme colors */
.dp-custom {
  --dp-background-color: var(--dialog-background, #ffffff);
  --dp-text-color: var(--theme-text, #000000);
  --dp-hover-color: var(--app-background-secondary, #f5f5f5);
  --dp-hover-text-color: var(--theme-text, #000000);
  --dp-hover-icon-color: var(--theme-text, #000000);
  --dp-primary-color: var(--c-primary, #007bff);
  --dp-primary-text-color: #ffffff;
  --dp-secondary-color: var(--c-dimmed, #6c757d);
  --dp-border-color: var(--app-border, #e0e0e0);
  --dp-menu-border-color: var(--app-border, #e0e0e0);
  --dp-border-color-hover: var(--c-primary, #007bff);
  --dp-disabled-color: var(--c-dimmed, #6c757d);
  --dp-scroll-bar-background: var(--app-background-secondary, #f5f5f5);
  --dp-scroll-bar-color: var(--c-dimmed, #6c757d);
  --dp-success-color: var(--c-success, #28a745);
  --dp-success-color-disabled: var(--c-success, #28a745);
  --dp-icon-color: var(--c-dimmed, #6c757d);
  --dp-danger-color: var(--c-danger, #dc3545);
  --dp-highlight-color: rgba(0, 123, 255, 0.1);
}

/* Input styling to match app */
.dp-custom .dp__input_wrap .dp__input {
  border: none;
  background: transparent;
  color: var(--theme-text);
  font-size: inherit;
  font-weight: var(--font-weight-m);
  padding: 2px 4px;
  border-radius: var(--border-radius-s);
  transition: all var(--transition-m);
}

.dp-custom .dp__input_wrap .dp__input:hover {
  background: var(--app-background-secondary);
  color: var(--c-primary);
}

.dp-custom .dp__input_wrap .dp__input:focus {
  outline: 1px solid var(--c-primary);
  outline-offset: 1px;
  background: var(--app-background-secondary);
}

/* Menu positioning and shadow */
.dp-custom .dp__menu {
  box-shadow: var(--dialog-box-shadow);
  border: 1px solid var(--app-border);
}

/* Header buttons */
.dp-custom .dp__month_year_wrap .dp__month_year_select,
.dp-custom .dp__arrow_top {
  color: var(--theme-text);
}

.dp-custom .dp__arrow_top:hover {
  background: var(--app-background-secondary);
  color: var(--c-primary);
}

/* Calendar cells */
.dp-custom .dp__calendar_header_item {
  color: var(--c-dimmed);
  font-weight: var(--font-weight-l);
}

.dp-custom .dp__calendar_item .dp__cell_inner {
  color: var(--theme-text);
}

.dp-custom .dp__calendar_item:hover .dp__cell_inner {
  background: var(--app-background-secondary);
  color: var(--theme-text);
}

.dp-custom .dp__today {
  border: 1px solid var(--c-primary);
}

.dp-custom .dp__active_date .dp__cell_inner,
.dp-custom .dp__range_between .dp__cell_inner {
  background: var(--c-primary);
  color: white;
}

/* Remove the input icon */
.dp-custom .dp__input_wrap .dp__input_icon {
  display: none;
}

/* Make the input wrapper fill available space */
.dp-custom .dp__input_wrap {
  width: 100%;
}
</style>
