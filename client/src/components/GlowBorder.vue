<template>
  <div :class="$style.glowBorderWrapper" :style="wrapperStyles">
    <div :class="$style.glowBorderBg"></div>
    <div :class="$style.glowBorderContent" :style="contentStyles">
      <slot></slot>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  duration: { type: Number, default: 10 },
  color: { type: [String, Array], default: '#FFF' },
  borderRadius: { type: Number, default: 10 },
  borderWidth: { type: Number, default: 2 }
});

const colorsString = computed(() => {
  if (Array.isArray(props.color)) {
    return props.color.join(', ');
  }
  return `${props.color}, transparent, ${props.color}`; 
});

const wrapperStyles = computed(() => ({
  '--duration': `${props.duration}s`,
  '--border-width': `${props.borderWidth}px`,
  '--border-radius': `${props.borderRadius}px`,
  '--glow-colors': colorsString.value
}));

const contentStyles = computed(() => ({
  'border-radius': `calc(var(--border-radius) - var(--border-width))`
}));
</script>

<style module>
.glowBorderWrapper {
  position: relative;
  display: inline-flex;
  padding: var(--border-width);
  border-radius: var(--border-radius);
  overflow: hidden;
  z-index: 1;
}

.glowBorderBg {
  position: absolute;
  inset: -50%;
  z-index: -1;
  background-image: linear-gradient(135deg, var(--glow-colors));
  background-size: 300% 300%;
  animation: glow var(--duration) infinite linear;
}

.glowBorderContent {
  background: var(--bg-color); /* Use theme background solid to hide gradient in the center */
  width: 100%;
  height: 100%;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
}

@keyframes glow {
  0% {
    background-position: 0% 0%;
  }
  50% {
    background-position: 100% 100%;
  }
  100% {
    background-position: 0% 0%;
  }
}
</style>
