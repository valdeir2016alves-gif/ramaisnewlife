<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import styles from '../styles/page.module.css';

defineProps({
  text: { type: String, required: true },
});

const svgRef = ref(null);
const cursor = ref({ x: 0, y: 0 });
const hovered = ref(false);

function updateCursor(e) {
  const rect = svgRef.value.getBoundingClientRect();
  cursor.value = { x: e.clientX - rect.left, y: e.clientY - rect.top };
}
function onEnter() {
  hovered.value = true;
}
function onLeave() {
  hovered.value = false;
}

onMounted(() => {
  const svg = svgRef.value;
  if (!svg) return;
  svg.addEventListener('mousemove', updateCursor);
  svg.addEventListener('mouseenter', onEnter);
  svg.addEventListener('mouseleave', onLeave);
});

onUnmounted(() => {
  const svg = svgRef.value;
  if (!svg) return;
  svg.removeEventListener('mousemove', updateCursor);
  svg.removeEventListener('mouseenter', onEnter);
  svg.removeEventListener('mouseleave', onLeave);
});
</script>

<template>
  <svg
    ref="svgRef"
    width="100%"
    height="100%"
    viewBox="0 0 600 40"
    xmlns="http://www.w3.org/2000/svg"
    :class="styles.textHoverSvg"
  >
    <defs>
      <radialGradient
        id="textHoverGradient"
        :cx="cursor.x"
        :cy="cursor.y"
        r="100"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0%" stop-color="var(--primary-color)" />
        <stop offset="100%" stop-color="transparent" />
      </radialGradient>
    </defs>

    <text
      x="50%"
      y="50%"
      text-anchor="middle"
      dominant-baseline="middle"
      stroke-width="1.5"
      :class="styles.textHoverStroke"
    >{{ text }}</text>

    <text
      x="50%"
      y="50%"
      text-anchor="middle"
      dominant-baseline="middle"
      stroke-width="2"
      :class="styles.textHoverStrokeGlow"
      :style="{ opacity: hovered ? 1 : 0 }"
    >{{ text }}</text>

    <text
      x="50%"
      y="50%"
      text-anchor="middle"
      dominant-baseline="middle"
      stroke="none"
      fill="url(#textHoverGradient)"
      :class="styles.textHoverFill"
    >{{ text }}</text>
  </svg>
</template>
