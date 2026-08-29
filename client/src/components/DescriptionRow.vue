<script setup>
import { ref } from 'vue';
import styles from '../styles/admin.module.css';

const props = defineProps({
  department: { type: String, required: true },
  initialDescription: { type: String, default: '' },
});

const emit = defineEmits(['save']);

const isEditing = ref(false);
const desc = ref(props.initialDescription);
const loading = ref(false);

async function handleSave() {
  loading.value = true;
  await new Promise((resolve) => emit('save', props.department, desc.value, resolve));
  isEditing.value = false;
  loading.value = false;
}
</script>

<template>
  <tr v-if="isEditing">
    <td style="font-weight: bold">{{ department }}</td>
    <td>
      <textarea :class="styles.input" v-model="desc" rows="3" style="width: 100%; resize: vertical"></textarea>
    </td>
    <td>
      <div :class="styles.tableActions">
        <button @click="handleSave" :class="styles.btnPrimary" :disabled="loading">Salvar</button>
        <button @click="() => { isEditing = false; desc = initialDescription; }" :class="styles.btnSecondary" :disabled="loading">Cancelar</button>
      </div>
    </td>
  </tr>
  <tr v-else>
    <td style="font-weight: bold">{{ department }}</td>
    <td style="white-space: pre-wrap" :style="{ color: desc ? 'inherit' : '#888' }">{{ desc || '(Sem descrição)' }}</td>
    <td>
      <button @click="isEditing = true" :class="styles.btnSecondary">Editar</button>
    </td>
  </tr>
</template>
