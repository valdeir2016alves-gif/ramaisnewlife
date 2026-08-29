<script setup>
import { computed } from 'vue';
import styles from '../styles/page.module.css';

const props = defineProps({
  className: { type: String, default: '' },
  borderRadius: { type: Number, default: 12 },
  style: { type: Object, default: () => ({}) },
});

const wrapperStyle = computed(() => ({
  ...props.style,
  '--neon-radius': `${props.borderRadius}px`,
}));
</script>

<template>
  <div :class="[styles.neonBorderCard, className]" :style="wrapperStyle">
    <div :class="styles.neonBorderGlow" />
    <div :class="styles.neonBorderInner">
      <slot />
    </div>
  </div>
</template>
