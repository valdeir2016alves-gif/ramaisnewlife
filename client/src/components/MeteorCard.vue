<script setup>
import styles from '../styles/page.module.css';
import Meteors from './Meteors.vue';

defineProps({
  className: { type: String, default: '' },
  style: { type: Object, default: () => ({}) },
});
</script>

<template>
  <div :class="className" :style="{ position: 'relative', width: '100%', height: '100%', ...style }">
    <div :class="styles.meteorCardGlow" />
    <div :class="styles.meteorCardInner">
      <div style="position: relative; z-index: 10; display: flex; flex-direction: column; height: 100%">
        <slot />
      </div>
      <Meteors :number="15" />
    </div>
  </div>
</template>
