<script setup>
import styles from '../styles/page.module.css';

defineProps({
  className: { type: String, default: '' },
  style: { type: Object, default: () => ({}) },
});
</script>

<template>
  <div :class="[styles.flipCard, className]" :style="style">
    <div :class="styles.flipCardInner">
      <div :class="styles.flipCardFront">
        <slot name="front" />
      </div>
      <div :class="styles.flipCardBack">
        <slot name="back" />
      </div>
    </div>
  </div>
</template>
