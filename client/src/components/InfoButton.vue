<script setup>
import styles from '../styles/page.module.css';

defineProps({
  department: { type: String, required: true },
  text: { type: String, default: '' },
});

const emit = defineEmits(['open']);
</script>

<template>
  <button
    v-if="text"
    type="button"
    :class="styles.infoButton"
    :aria-label="`Informações sobre ${department}`"
    @click.stop="emit('open')"
  >
    !
  </button>
</template>
