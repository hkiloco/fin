<template>
  <span
    v-if="settingsState.appearance.mode === 'privacy'"
    :data-testid="testId"
    :class="[$style.container, props.class]"
  >
    {{ formatted }}
    <span :class="$style.overlay" />
  </span>
  <span v-else :data-testid="testId" :class="props.class">
    {{ formatted }}
  </span>
</template>

<script lang="ts" setup>
import { useSettingsStore } from '@store/settings';
import { useDataStore } from '@store/state';
import { ClassNames } from '@utils/types.ts';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
  value?: number;
  locale?: string;
  class?: ClassNames;
  testId?: string;
}>();

const { n } = useI18n();
const { state: dataState } = useDataStore();
const { state: settingsState } = useSettingsStore();

const formatted = computed(() => {
  try {
    const value = typeof props.value === 'number' ? props.value : 0;
    const currency = dataState.currency || 'USD';
    return n(value, { key: 'currency', currency });
  } catch (error) {
    console.warn('Currency formatting error:', error);
    return props.value?.toString() || '0';
  }
});
</script>

<style lang="scss" module>
.container {
  display: inline-block;
  position: relative;
  filter: blur(5px) opacity(0.85);
  transition: all var(--transition-m);

  &:hover {
    filter: none;
  }
}
</style>
