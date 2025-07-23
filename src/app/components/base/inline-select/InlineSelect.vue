<template>
  <ContextMenu
    :options="options"
    position="bottom-start"
    @select="modelValue = $event.id"
  >
    <template #default="{ toggle }">
      <button 
        :class="$style.button" 
        type="button" 
        :disabled="disabled"
        @click="toggle"
      >
        {{ currentValue }}
      </button>
    </template>
  </ContextMenu>
</template>

<script lang="ts" setup>
import { ContextMenuOption, ContextMenuOptionId } from '@components/base/context-menu/ContextMenu.types.ts';
import ContextMenu from '@components/base/context-menu/ContextMenu.vue';
import { computed } from 'vue';

const modelValue = defineModel<ContextMenuOptionId>();

const props = withDefaults(
  defineProps<{
    options?: ContextMenuOption[];
    placeholder?: string;
    disabled?: boolean;
  }>(),
  {
    placeholder: 'Select...',
    disabled: false
  }
);

const currentValue = computed(() => {
  if (!modelValue.value) return props.placeholder;
  return props.options?.find((option) => option.id === modelValue.value)?.label ?? props.placeholder;
});
</script>

<style lang="scss" module>
.button {
  all: unset;
  appearance: none;
  width: 100%;
  cursor: pointer;
  color: var(--theme-text);
  font-size: inherit;
  padding: 0;
  text-align: left;
  background: transparent;
  border: none;
  outline: none;
  
  &:hover:not(:disabled) {
    color: var(--c-primary);
  }
  
  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
  
  &:focus-visible {
    outline: 1px solid var(--c-primary);
    outline-offset: 1px;
  }
}
</style>
