<script setup>
import styles from '../styles/page.module.css';

defineProps({
  text: { type: String, required: true },
});
</script>

<template>
  <span :class="styles.underlineText">{{ text }}</span>
</template>
