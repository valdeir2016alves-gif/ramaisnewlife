<script setup>
import { ref, onMounted } from 'vue';
import { getSipPhones, addSipPhone, updateSipPhone, deleteSipPhone, testSipExtension } from '../api';

const phones = ref([]);
const editingId = ref(null);
const form = ref({ label: '', extension: '', password: '', active: true });
const saving = ref(false);
const errorMsg = ref('');
const testingRows = ref({});
const rowResults = ref({});

async function loadPhones() {
  try {
    const data = await getSipPhones();
    phones.value = Array.isArray(data) ? data : [];
  } catch (e) {
    console.error('Erro ao carregar telefones SIP:', e);
  }
}

onMounted(loadPhones);

function resetForm() {
  editingId.value = null;
  form.value = { label: '', extension: '', password: '', active: true };
  errorMsg.value = '';
}

function startEdit(phone) {
  editingId.value = phone.id;
  form.value = {
    label: phone.label,
    extension: phone.extension,
    password: phone.password,
    active: phone.active
  };
  errorMsg.value = '';
}

async function handleSave() {
  const extension = form.value.extension.trim().replace(/\D/g, '');
  if (!extension) {
    errorMsg.value = 'Informe o número do ramal.';
    return;
  }
  saving.value = true;
  errorMsg.value = '';
  const payload = { ...form.value, extension };
  const result = editingId.value
    ? await updateSipPhone(editingId.value, payload)
    : await addSipPhone(payload);
  saving.value = false;
  if (!result?.success) {
    errorMsg.value = result?.error || 'Erro ao salvar telefone.';
    return;
  }
  resetForm();
  await loadPhones();
}

async function handleToggleActive(phone) {
  await updateSipPhone(phone.id, { ...phone, active: !phone.active });
  await loadPhones();
}

async function handleDelete(phone) {
  if (!window.confirm(`Remover o telefone "${phone.label}" (${phone.extension})?`)) return;
  await deleteSipPhone(phone.id);
  if (editingId.value === phone.id) resetForm();
  await loadPhones();
}

async function handleTest(phone) {
  testingRows.value[phone.id] = true;
  rowResults.value[phone.id] = null;
  try {
    rowResults.value[phone.id] = await testSipExtension(phone.extension, phone.password);
  } catch (e) {
    rowResults.value[phone.id] = { success: false, error: e.message };
  } finally {
    testingRows.value[phone.id] = false;
  }
}
</script>

<template>
  <div class="phones-panel">
    <h3 class="phones-title">☎️ Telefones SIP da Página Principal</h3>
    <p class="phones-desc">
      Os telefones ativos cadastrados aqui aparecem no telefone da página principal, prontos para ligar
      sem que o usuário precise digitar ramal e senha.
    </p>

    <div class="phones-form">
      <div class="phones-field">
        <label>Nome / Identificação:</label>
        <input v-model="form.label" type="text" placeholder="Ex: Recepção" class="phones-input" />
      </div>
      <div class="phones-field">
        <label>Ramal:</label>
        <input v-model="form.extension" type="text" placeholder="Ex: 4001" maxlength="6" class="phones-input phones-input-short" />
      </div>
      <div class="phones-field">
        <label>Senha (opcional se for padrão):</label>
        <input
          v-model="form.password"
          type="text"
          :placeholder="`Padrão: Ramal@${form.extension || '4001'}`"
          class="phones-input"
          @keydown.enter="handleSave"
        />
      </div>
      <label class="phones-check">
        <input v-model="form.active" type="checkbox" />
        Ativo
      </label>
      <button type="button" class="btn-save" :disabled="saving || !form.extension.trim()" @click="handleSave">
        {{ editingId ? 'Salvar Alterações' : 'Cadastrar Telefone' }}
      </button>
      <button v-if="editingId" type="button" class="btn-row" @click="resetForm">Cancelar</button>
    </div>

    <div v-if="errorMsg" class="phones-error">{{ errorMsg }}</div>

    <table v-if="phones.length > 0" class="phones-table">
      <thead>
        <tr>
          <th>Nome</th>
          <th style="width: 90px;">Ramal</th>
          <th style="width: 90px;">Status</th>
          <th style="text-align: right;">Ações</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="phone in phones" :key="phone.id">
          <td>
            {{ phone.label }}
            <div v-if="rowResults[phone.id]" class="row-result" :class="rowResults[phone.id].success ? 'text-ok' : 'text-fail'">
              {{ rowResults[phone.id].success ? '✓ Autenticado na central' : `✗ ${rowResults[phone.id].error}` }}
            </div>
          </td>
          <td><span class="ramal-badge">{{ phone.extension }}</span></td>
          <td>
            <span :class="phone.active ? 'text-ok' : 'text-muted'">{{ phone.active ? '● Ativo' : '○ Inativo' }}</span>
          </td>
          <td class="phones-actions">
            <button type="button" class="btn-row" :disabled="testingRows[phone.id]" @click="handleTest(phone)">
              {{ testingRows[phone.id] ? 'Testando...' : 'Testar' }}
            </button>
            <button type="button" class="btn-row" @click="handleToggleActive(phone)">
              {{ phone.active ? 'Desativar' : 'Ativar' }}
            </button>
            <button type="button" class="btn-row" @click="startEdit(phone)">Editar</button>
            <button type="button" class="btn-row btn-danger" @click="handleDelete(phone)">Remover</button>
          </td>
        </tr>
      </tbody>
    </table>
    <p v-else class="phones-empty">Nenhum telefone cadastrado ainda.</p>
  </div>
</template>

<style scoped>
.phones-panel {
  padding: 1.25rem 1.5rem;
  margin-bottom: 1.5rem;
  border-radius: 14px;
  background: rgba(15, 23, 42, 0.65);
  border: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  color: #f1f5f9;
}

.phones-title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: #f8fafc;
}

.phones-desc {
  margin: 0;
  font-size: 0.85rem;
  color: #94a3b8;
}

.phones-form {
  display: flex;
  gap: 1rem;
  align-items: flex-end;
  flex-wrap: wrap;
}

.phones-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.phones-field label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #94a3b8;
}

.phones-input {
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #f1f5f9;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 0.9rem;
  outline: none;
  min-width: 180px;
}

.phones-input-short {
  min-width: 0;
  width: 100px;
}

.phones-input:focus {
  border-color: #38bdf8;
}

.phones-check {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  color: #cbd5e1;
  padding-bottom: 8px;
}

.btn-save {
  background: linear-gradient(135deg, #10b981, #059669);
  color: #ffffff;
  font-weight: 600;
  font-size: 0.88rem;
  padding: 9px 18px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
}

.btn-save:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.phones-error {
  font-size: 0.82rem;
  color: #f87171;
}

.phones-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.88rem;
}

.phones-table th {
  text-align: left;
  font-size: 0.75rem;
  color: #94a3b8;
  font-weight: 600;
  padding: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.phones-table td {
  padding: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  vertical-align: middle;
}

.phones-actions {
  display: flex;
  gap: 6px;
  justify-content: flex-end;
  flex-wrap: wrap;
}

.ramal-badge {
  font-family: monospace;
  font-weight: 700;
  color: #38bdf8;
}

.btn-row {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #e2e8f0;
  font-size: 0.78rem;
  font-weight: 600;
  padding: 6px 10px;
  border-radius: 6px;
  cursor: pointer;
}

.btn-row:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.15);
}

.btn-danger {
  color: #f87171;
  border-color: rgba(239, 68, 68, 0.3);
}

.row-result {
  font-size: 0.75rem;
  margin-top: 4px;
  font-weight: 600;
}

.text-ok {
  color: #34d399;
}

.text-fail {
  color: #f87171;
}

.text-muted {
  color: #64748b;
}

.phones-empty {
  margin: 0;
  font-size: 0.85rem;
  color: #64748b;
}
</style>
