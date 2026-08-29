<script setup>
import { ref } from 'vue';
import styles from '../styles/admin.module.css';

const props = defineProps({
  contact: { type: Object, required: true },
  canEdit: { type: Boolean, required: true },
});

const emit = defineEmits(['save', 'delete', 'move', 'toggle-visibility']);

const isEditing = ref(false);
const loading = ref(false);
const name = ref(props.contact.name);
const phone = ref(props.contact.phone);
const ip = ref(props.contact.ip || '');
const department = ref(props.contact.department);
const city = ref(props.contact.city || 'sao_gabriel');
const phoneModel = ref(props.contact.phoneModel || '');

function resetFields() {
  name.value = props.contact.name;
  phone.value = props.contact.phone;
  department.value = props.contact.department;
  city.value = props.contact.city || 'sao_gabriel';
  ip.value = props.contact.ip || '';
  phoneModel.value = props.contact.phoneModel || '';
}

async function handleSave() {
  if (!name.value || !phone.value || !department.value) {
    alert('Preencha Nome, Número e Setor!');
    return;
  }
  loading.value = true;
  await new Promise((resolve) => {
    emit('save', props.contact.id, name.value, phone.value, department.value, ip.value, city.value, phoneModel.value, resolve);
  });
  loading.value = false;
  isEditing.value = false;
}

async function handleToggleVisibility() {
  loading.value = true;
  await new Promise((resolve) => {
    emit('toggle-visibility', props.contact.id, !props.contact.hidden, resolve);
  });
  loading.value = false;
}
</script>

<template>
  <tr v-if="isEditing && canEdit">
    <td>
      <input type="text" v-model="name" :class="styles.inputInline" placeholder="Nome" />
      <input
        type="text"
        list="departments-list"
        v-model="department"
        :class="styles.inputInline"
        placeholder="Setor"
        style="margin-top: 0.5rem; font-size: 0.85rem"
      />
      <select v-model="city" :class="styles.inputInline" style="margin-top: 0.5rem; font-size: 0.85rem">
        <option value="sao_gabriel">São Gabriel</option>
        <option value="bage">Bagé</option>
        <option value="passo_fundo">Passo Fundo</option>
        <option value="all">Global (Todas as Unidades)</option>
      </select>
    </td>
    <td>
      <input type="text" v-model="phone" :class="styles.inputInline" placeholder="Número" />
    </td>
    <td>
      <input type="text" v-model="ip" :class="styles.inputInline" placeholder="IP" />
    </td>
    <td>
      <select v-model="phoneModel" :class="styles.inputInline">
        <option value="">Selecione o Modelo</option>
        <option value="Intelbras ATA 200">Intelbras ATA 200</option>
        <option value="Telefone IP Intelbras TIP 125i">Telefone IP Intelbras TIP 125i</option>
        <option value="Telefone IP Intelbras TIP 200">Telefone IP Intelbras TIP 200</option>
        <option value="Telefone Sem Fio TS 2510">Telefone Sem Fio TS 2510</option>
        <option value="MicroSIP">MicroSIP</option>
      </select>
    </td>
    <td>
      <div :class="styles.tableActions">
        <button @click="handleSave" :class="styles.btnPrimary" style="padding: 0.4rem 0.8rem; font-size: 0.85rem" :disabled="loading">
          {{ loading ? '...' : 'Salvar' }}
        </button>
        <button
          @click="() => { isEditing = false; resetFields(); }"
          :class="styles.btnSecondary"
          style="padding: 0.4rem 0.8rem; font-size: 0.85rem"
          :disabled="loading"
        >
          Cancelar
        </button>
      </div>
    </td>
  </tr>

  <tr v-else>
    <td>{{ contact.name }}</td>
    <td>{{ contact.phone }}</td>
    <td>
      <a v-if="contact.ip" :href="`http://${contact.ip}`" target="_blank" rel="noopener noreferrer" class="admin-ip-link">
        {{ contact.ip }}
      </a>
      <template v-else>-</template>
    </td>
    <td>{{ contact.phoneModel || '-' }}</td>
    <td v-if="canEdit">
      <div :class="styles.tableActions">
        <button @click="emit('move', contact.id, 'up')" :class="styles.btnSecondary" style="padding: 0.4rem 0.6rem" title="Mover para Cima" :disabled="loading">
          ↑
        </button>
        <button @click="emit('move', contact.id, 'down')" :class="styles.btnSecondary" style="padding: 0.4rem 0.6rem" title="Mover para Baixo" :disabled="loading">
          ↓
        </button>
        <button
          @click="handleToggleVisibility"
          :class="styles.btnSecondary"
          :style="{ padding: '0.4rem 0.6rem', color: contact.hidden ? 'gray' : 'inherit' }"
          :title="contact.hidden ? 'Mostrar no site principal' : 'Ocultar do site principal'"
          :disabled="loading"
        >
          {{ contact.hidden ? 'Oculto' : 'Visível' }}
        </button>
        <button @click="isEditing = true" :class="styles.btnSecondary" :disabled="loading">
          Editar
        </button>
        <button @click="emit('delete', contact.id)" :class="styles.btnDanger" :disabled="loading">
          Excluir
        </button>
      </div>
    </td>
  </tr>
</template>

<style scoped>
.admin-ip-link {
  color: var(--primary-color);
  text-decoration: none;
}
.admin-ip-link:hover {
  text-decoration: underline;
}
</style>
