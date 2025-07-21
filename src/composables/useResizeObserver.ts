import { ref, Ref, watch } from 'vue';

export const useResizeObserver = (el: Ref<HTMLElement | undefined>): Ref<DOMRect> => {
  const rect = ref<DOMRect>(new DOMRect());
  let timeoutId: number | undefined;

  const observer = new ResizeObserver((entries) => {
    // Clear any pending timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    // Debounce the rect update to prevent ResizeObserver loops
    timeoutId = window.setTimeout(() => {
      if (entries[0]?.target) {
        rect.value = entries[0].target.getBoundingClientRect();
      }
    }, 0);
  });

  watch(el, (value) => {
    observer.disconnect();

    // Clear any pending timeout when element changes
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = undefined;
    }

    if (value) {
      observer.observe(value);
    }
  });

  return rect;
};
