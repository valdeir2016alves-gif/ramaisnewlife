<script setup>
import { ref, computed } from 'vue';
import styles from '../styles/page.module.css';

const props = defineProps({
  className: { type: String, default: '' },
  style: { type: Object, default: () => ({}) },
});

const el = ref(null);
const position = ref({ x: 50, y: 50 });
const isHovered = ref(false);

function handleMouseMove(e) {
  if (!el.value) return;
  const rect = el.value.getBoundingClientRect();
  const x = ((e.clientX - rect.left) / rect.width) * 100;
  const y = ((e.clientY - rect.top) / rect.height) * 100;
  position.value = { x, y };
}

function handleMouseLeave() {
  isHovered.value = false;
  position.value = { x: 50, y: 50 };
}

const rotateX = computed(() => (isHovered.value ? (position.value.y - 50) / -3 : 0));
const rotateY = computed(() => (isHovered.value ? (position.value.x - 50) / 3 : 0));

const wrapperStyle = computed(() => ({
  ...props.style,
  transform: `perspective(1000px) rotateX(${rotateX.value}deg) rotateY(${rotateY.value}deg)`,
}));

const overlayStyle = computed(() => ({
  opacity: isHovered.value ? 1 : 0,
  background: `radial-gradient(circle at ${position.value.x}% ${position.value.y}%, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 60%)`,
}));
</script>

<template>
  <div
    ref="el"
    :class="[styles.glareCard, className]"
    :style="wrapperStyle"
    @mouseenter="isHovered = true"
    @mouseleave="handleMouseLeave"
    @mousemove="handleMouseMove"
  >
    <div :class="styles.glareOverlay" :style="overlayStyle" />
    <div :class="styles.glareContent">
      <slot />
    </div>
  </div>
</template>
