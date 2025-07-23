<template>
  <div :class="$style.datePicker">
    <input
      :value="displayValue"
      type="text"
      readonly
      :class="$style.input"
      @click="togglePicker"
      @keydown.enter="togglePicker"
      @keydown.escape="closePicker"
    />
    
    <Teleport to="body">
      <div
        v-if="showPicker"
        :class="$style.overlay"
        @click="closePicker"
      >
        <div
          :class="$style.picker"
          @click.stop
          :style="{ top: `${pickerPosition.top}px`, left: `${pickerPosition.left}px` }"
        >
          <div :class="$style.header">
            <button type="button" :class="$style.navButton" @click="previousMonth">
              <RiArrowLeftSLine />
            </button>
            <span :class="$style.monthYear">
              {{ currentMonthYear }}
            </span>
            <button type="button" :class="$style.navButton" @click="nextMonth">
              <RiArrowRightSLine />
            </button>
          </div>
          
          <div :class="$style.calendar">
            <div :class="$style.weekDays">
              <span v-for="day in weekDays" :key="day" :class="$style.weekDay">
                {{ day }}
              </span>
            </div>
            
            <div :class="$style.days">
              <button
                v-for="day in calendarDays"
                :key="`${day.date}-${day.isCurrentMonth}`"
                type="button"
                :class="[
                  $style.day,
                  {
                    [$style.otherMonth]: !day.isCurrentMonth,
                    [$style.today]: day.isToday,
                    [$style.selected]: day.isSelected
                  }
                ]"
                @click="selectDate(day.date)"
              >
                {{ day.dayNumber }}
              </button>
            </div>
          </div>
          
          <div :class="$style.footer">
            <Button
              :text="t('common.cancel')"
              color="dimmed"
              size="s"
              @click="closePicker"
            />
            <Button
              :text="t('datePicker.today')"
              color="primary"
              size="s"
              @click="selectToday"
            />
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script lang="ts" setup>
import Button from '@components/base/button/Button.vue';
import { RiArrowLeftSLine, RiArrowRightSLine } from '@remixicon/vue';
import { computed, nextTick, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
  modelValue: string; // ISO date string (YYYY-MM-DD)
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const { t } = useI18n();

const showPicker = ref(false);
const pickerPosition = ref({ top: 0, left: 0 });
const viewDate = ref(new Date());

// Parse the current value or use today
const currentDate = computed(() => {
  return props.modelValue ? new Date(props.modelValue) : new Date();
});

const displayValue = computed(() => {
  if (!props.modelValue) return '';
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(new Date(props.modelValue));
});

const currentMonthYear = computed(() => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long'
  }).format(viewDate.value);
});

const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const calendarDays = computed(() => {
  const year = viewDate.value.getFullYear();
  const month = viewDate.value.getMonth();
  
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay());
  
  const days = [];
  const today = new Date();
  const selectedDate = props.modelValue ? new Date(props.modelValue) : null;
  
  for (let i = 0; i < 42; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    
    const isCurrentMonth = date.getMonth() === month;
    const isToday = date.toDateString() === today.toDateString();
    const isSelected = selectedDate ? date.toDateString() === selectedDate.toDateString() : false;
    
    days.push({
      date: date.toISOString().split('T')[0],
      dayNumber: date.getDate(),
      isCurrentMonth,
      isToday,
      isSelected
    });
  }
  
  return days;
});

const togglePicker = async (event: Event) => {
  if (showPicker.value) {
    closePicker();
    return;
  }
  
  const target = event.target as HTMLElement;
  const rect = target.getBoundingClientRect();
  
  pickerPosition.value = {
    top: rect.bottom + window.scrollY + 5,
    left: rect.left + window.scrollX
  };
  
  showPicker.value = true;
  
  // Set view date to current value or today
  viewDate.value = props.modelValue ? new Date(props.modelValue) : new Date();
};

const closePicker = () => {
  showPicker.value = false;
};

const selectDate = (dateString: string) => {
  emit('update:modelValue', dateString);
  closePicker();
};

const selectToday = () => {
  const today = new Date().toISOString().split('T')[0];
  selectDate(today);
};

const previousMonth = () => {
  viewDate.value = new Date(viewDate.value.getFullYear(), viewDate.value.getMonth() - 1, 1);
};

const nextMonth = () => {
  viewDate.value = new Date(viewDate.value.getFullYear(), viewDate.value.getMonth() + 1, 1);
};

// Close picker when clicking outside
watch(showPicker, (isOpen) => {
  if (isOpen) {
    nextTick(() => {
      document.addEventListener('keydown', handleEscape);
    });
  } else {
    document.removeEventListener('keydown', handleEscape);
  }
});

const handleEscape = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    closePicker();
  }
};
</script>

<style lang="scss" module>
.datePicker {
  position: relative;
}

.input {
  all: unset;
  appearance: none;
  width: 100%;
  cursor: pointer;
  color: var(--theme-text);
  
  &:hover {
    color: var(--c-primary);
  }
}

.overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  background: transparent;
}

.picker {
  position: absolute;
  background: var(--dialog-background);
  border-radius: var(--border-radius-l);
  box-shadow: var(--dialog-box-shadow);
  border: 1px solid var(--app-border);
  min-width: 280px;
  z-index: 1001;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid var(--app-border);
}

.navButton {
  all: unset;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: var(--border-radius-m);
  cursor: pointer;
  color: var(--c-dimmed);
  transition: all var(--transition-m);
  
  &:hover {
    background: var(--app-background-secondary);
    color: var(--theme-text);
  }
}

.monthYear {
  font-weight: var(--font-weight-l);
  color: var(--theme-text);
  font-size: var(--font-size-m);
}

.calendar {
  padding: 16px;
}

.weekDays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
  margin-bottom: 8px;
}

.weekDay {
  text-align: center;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-l);
  color: var(--c-dimmed);
  padding: 8px 4px;
}

.days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}

.day {
  all: unset;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: var(--border-radius-m);
  cursor: pointer;
  font-size: var(--font-size-s);
  color: var(--theme-text);
  transition: all var(--transition-m);
  
  &:hover {
    background: var(--app-background-secondary);
  }
  
  &.otherMonth {
    color: var(--c-dimmed);
  }
  
  &.today {
    background: var(--c-primary);
    color: white;
    
    &:hover {
      background: var(--c-primary-hover);
    }
  }
  
  &.selected {
    background: var(--c-success);
    color: white;
    
    &:hover {
      background: var(--c-success-hover);
    }
  }
}

.footer {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  padding: 16px;
  border-top: 1px solid var(--app-border);
}
</style>
