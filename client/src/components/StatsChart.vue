<script setup>
import { computed } from 'vue';
import { Bar } from 'vue-chartjs';
import {
  Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale,
} from 'chart.js';

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

const props = defineProps({
  stats: { type: Array, required: true },
});

function cssVar(name, fallback) {
  if (typeof window === 'undefined') return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

const chartData = computed(() => ({
  labels: props.stats.map(s => s.date.split('-').reverse().slice(0, 2).join('/')),
  datasets: [
    {
      label: 'Acessos',
      backgroundColor: cssVar('--primary-color', '#48cae4'),
      borderRadius: 4,
      barThickness: 40,
      data: props.stats.map(s => s.visits),
    },
  ],
}));

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: cssVar('--card-bg', '#0f274e'),
      borderColor: cssVar('--card-border', 'rgba(255,255,255,0.1)'),
      borderWidth: 1,
      titleColor: cssVar('--text-main', '#f1f5f9'),
      bodyColor: cssVar('--text-main', '#f1f5f9'),
    },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: cssVar('--text-muted', '#94a3b8'), font: { size: 12 } },
    },
    y: {
      grid: { color: 'rgba(255,255,255,0.1)' },
      ticks: { color: cssVar('--text-muted', '#94a3b8'), font: { size: 12 } },
    },
  },
}));
</script>

<template>
  <Bar :data="chartData" :options="chartOptions" />
</template>
