<template>
  <input
    ref="input"
    :class="[$style.currencyCell, { [$style.invalid]: invalid }]"
    type="text"
    :value="value"
    :data-testid="testId"
    @blur="focused = false"
    @focus="focus"
    @input="change"
    @keydown="keydown"
    @keydown.enter="input?.blur()"
  />
</template>

<script lang="ts" setup>
import { useDataStore } from '@store/state';
import { evalMathExpression } from '@utils/eval-math-expression/evalMathExpression.ts';
import { computed, nextTick, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const modelValue = defineModel<number>();

const props = withDefaults(
  defineProps<{
    max?: number;
    testId?: string;
  }>(),
  {
    max: Number.MAX_SAFE_INTEGER
  }
);

const input = ref<HTMLInputElement>();
const focused = ref(false);
const innerValue = ref<string>();
const invalid = ref(false);
const { state } = useDataStore();
const { locale, n } = useI18n();

const value = computed(() => {
  if (invalid.value) {
    return innerValue.value;
  }

  if (focused.value) {
    return modelValue.value || '';
  }

  // Always format as currency when not focused, including negative values
  if (modelValue.value !== undefined && modelValue.value !== null) {
    return n(modelValue.value, { key: 'currency', currency: state.currency });
  }

  return '';
});

const keydown = (e: KeyboardEvent) => {
  // Allow negative numbers by not preventing minus key
  // Only prevent minus if it's not at the beginning
  if (e.key === '-') {
    const input = e.target as HTMLInputElement;
    const cursorPosition = input.selectionStart || 0;
    const currentValue = input.value;

    // Prevent minus if:
    // 1. It's not at the beginning of the input
    // 2. There's already a minus sign in the value
    if (cursorPosition > 0 || currentValue.includes('-')) {
      e.preventDefault();
    }
  }
};

const focus = () => {
  focused.value = true;
  nextTick(() => (input.value as HTMLInputElement).select());
};

const change = (e: Event) => {
  innerValue.value = (e.target as HTMLInputElement).value || undefined;
};

watch(modelValue, (value, oldValue) => {
  if ((value ?? 0) > props.max && oldValue !== undefined) {
    modelValue.value = oldValue;
  }
});

watch(focused, (value) => {
  if (value) {
    innerValue.value ??= modelValue.value ? String(modelValue.value) : undefined;
    return;
  }

  const trimmed = innerValue.value?.trim();
  if (!trimmed) {
    modelValue.value = 0;
    invalid.value = false;

    if (input.value) {
      input.value.value = '';
    }

    return;
  }

  try {
    if (innerValue.value) {
      // Handle simple negative numbers first
      const numericValue = parseFloat(innerValue.value);
      if (!isNaN(numericValue)) {
        modelValue.value = numericValue;
        invalid.value = false;
      } else {
        // Fall back to math expression evaluation for complex expressions
        modelValue.value = evalMathExpression(innerValue.value, locale.value);
        invalid.value = false;
      }
    } else {
      modelValue.value = 0;
      invalid.value = false;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_) {
    invalid.value = true;
  }
});
</script>

<style lang="scss" module>
.currencyCell {
  all: unset;
  display: inline-flex;
  align-items: center;
  height: 100%;
  width: 100%;
  font-size: var(--input-field-font-size);
  max-height: 100%;
  padding: 0 4px;
  caret-color: var(--input-field-caret-color);

  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  &:not(:focus).invalid {
    color: var(--c-danger-pure);
    text-decoration: underline dashed;
  }
}
</style>
