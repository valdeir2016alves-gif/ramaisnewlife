<script setup>
import { ref, onMounted, watch } from 'vue';
import styles from '../styles/page.module.css';

const props = defineProps({
  number: { type: Number, default: 20 },
});

const meteors = ref([]);

function generate() {
  meteors.value = new Array(props.number).fill(true).map(() => ({
    top: Math.floor(Math.random() * 100) + '%',
    left: Math.floor(Math.random() * 100) + '%',
    animationDelay: Math.random() * (0.8 - 0.2) + 0.2 + 's',
    animationDuration: Math.floor(Math.random() * (10 - 2) + 2) + 's',
  }));
}

onMounted(generate);
watch(() => props.number, generate);
</script>

<template>
  <span
    v-for="(m, idx) in meteors"
    :key="'meteor' + idx"
    :class="styles.meteor"
    :style="{ top: m.top, left: m.left, animationDelay: m.animationDelay, animationDuration: m.animationDuration }"
  ></span>
</template>
