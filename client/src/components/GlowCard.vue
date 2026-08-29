<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import styles from '../styles/page.module.css';

defineProps({
  className: { type: String, default: '' },
  innerClassName: { type: String, default: '' },
  style: { type: Object, default: () => ({}) },
});

const emit = defineEmits(['click']);

const el = ref(null);

function handleMouseMove(e) {
  if (!el.value) return;
  const rect = el.value.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  el.value.style.setProperty('--x', `${x}px`);
  el.value.style.setProperty('--y', `${y}px`);
}

onMounted(() => {
  window.addEventListener('mousemove', handleMouseMove);
});

onUnmounted(() => {
  window.removeEventListener('mousemove', handleMouseMove);
});
</script>

<template>
  <div ref="el" :class="[styles.glowCard, className]" :style="style" @click="emit('click')">
    <div :class="innerClassName || styles.glowCardInner">
      <slot />
    </div>
  </div>
</template>
