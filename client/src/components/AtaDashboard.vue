<script setup>
import { ref, computed, onMounted } from 'vue';
import styles from '../styles/admin.module.css';
import {
  getAtas,
  addAta,
  updateAta,
  deleteAta,
  pingAta,
  pingAllAtas,
  importAtasFromContacts,
} from '../api';

const props = defineProps({
  canEdit: { type: Boolean, default: false },
  departments: { type: Array, default: () => [] },
});

const atas = ref([]);
const loading = ref(false);
const pingingAll = ref(false);
const pingingId = ref(null);

// Filters
const searchQuery = ref('');
const statusFilter = ref('all');
const cityFilter = ref('all');

// Form state
const showAddForm = ref(false);
const formName = ref('');
const formIp = ref('');
const formModel = ref('Intelbras ATA 200');
const formCity = ref('sao_gabriel');
const formDepartment = ref('');
const formRamais = ref('');
const formNotes = ref('');

// Edit modal/inline state
const editingAta = ref(null);

const cityLabels = {
  sao_gabriel: 'São Gabriel',
  bage: 'Bagé',
  passo_fundo: 'Passo Fundo',
  all: 'Global',
};

async function loadAtas() {
  loading.value = true;
  try {
    const data = await getAtas({
      q: searchQuery.value,
      status: statusFilter.value,
      city: cityFilter.value,
    });
    atas.value = data || [];
  } catch (err) {
    console.error('Erro ao carregar ATAs:', err);
  } finally {
    loading.value = false;
  }
}

// Summary metrics
const totalCount = computed(() => atas.value.length);
const onlineCount = computed(() => atas.value.filter(a => a.status === 'online').length);
const offlineCount = computed(() => atas.value.filter(a => a.status === 'offline').length);
const unknownCount = computed(() => atas.value.filter(a => a.status !== 'online' && a.status !== 'offline').length);

const avgLatency = computed(() => {
  const onlineWithLatency = atas.value.filter(a => a.status === 'online' && typeof a.latencyMs === 'number');
  if (onlineWithLatency.length === 0) return null;
  const sum = onlineWithLatency.reduce((acc, curr) => acc + curr.latencyMs, 0);
  return Math.round(sum / onlineWithLatency.length);
});

const uptimePercent = computed(() => {
  const tested = onlineCount.value + offlineCount.value;
  if (tested === 0) return 100;
  return Math.round((onlineCount.value / tested) * 100);
});

async function handleAdd(e) {
  e.preventDefault();
  if (!formName.value || !formIp.value) {
    alert('Preencha o Nome e o IP do equipamento!');
    return;
  }

  loading.value = true;
  try {
    const res = await addAta({
      name: formName.value,
      ip: formIp.value,
      model: formModel.value || 'Intelbras ATA 200',
      city: formCity.value,
      department: formDepartment.value,
      ramais: formRamais.value,
      notes: formNotes.value,
    });

    if (res.success) {
      formName.value = '';
      formIp.value = '';
      formModel.value = 'Intelbras ATA 200';
      formDepartment.value = '';
      formRamais.value = '';
      formNotes.value = '';
      showAddForm.value = false;
      await loadAtas();
      // Auto ping the newly added device
      if (res.ata?.id) {
        handlePing(res.ata.id);
      }
    } else {
      alert('Erro: ' + (res.error || 'Falha ao adicionar ATA'));
    }
  } catch (err) {
    alert('Erro de conexão ao adicionar ATA');
  } finally {
    loading.value = false;
  }
}

function startEdit(ata) {
  editingAta.value = { ...ata };
}

function cancelEdit() {
  editingAta.value = null;
}

async function handleSaveEdit() {
  if (!editingAta.value) return;
  if (!editingAta.value.name || !editingAta.value.ip) {
    alert('Nome e IP são obrigatórios!');
    return;
  }

  loading.value = true;
  try {
    const res = await updateAta(editingAta.value.id, {
      name: editingAta.value.name,
      ip: editingAta.value.ip,
      model: editingAta.value.model,
      city: editingAta.value.city,
      department: editingAta.value.department,
      ramais: editingAta.value.ramais,
      notes: editingAta.value.notes,
    });

    if (res.success) {
      editingAta.value = null;
      await loadAtas();
    } else {
      alert('Erro ao atualizar: ' + res.error);
    }
  } catch (err) {
    alert('Erro ao salvar edições do ATA');
  } finally {
    loading.value = false;
  }
}

async function handleDelete(id) {
  if (!confirm('Deseja realmente remover este equipamento ATA?')) return;
  loading.value = true;
  try {
    const res = await deleteAta(id);
    if (res.success) {
      await loadAtas();
    } else {
      alert('Erro ao excluir: ' + res.error);
    }
  } catch (err) {
    alert('Erro ao excluir ATA');
  } finally {
    loading.value = false;
  }
}

async function handlePing(id) {
  pingingId.value = id;
  try {
    const res = await pingAta(id);
    if (res.success && res.ata) {
      const idx = atas.value.findIndex(a => a.id === id);
      if (idx !== -1) {
        atas.value[idx] = res.ata;
      }
    }
  } catch (err) {
    console.error('Erro ao pingar ATA:', err);
  } finally {
    pingingId.value = null;
  }
}

async function handlePingAll() {
  if (atas.value.length === 0) return;
  pingingAll.value = true;
  try {
    const res = await pingAllAtas();
    if (res.success && res.atas) {
      atas.value = res.atas;
    }
  } catch (err) {
    alert('Erro ao pingar equipamentos');
  } finally {
    pingingAll.value = false;
  }
}

async function handleImportFromContacts() {
  if (!confirm('Deseja importar automaticamente contatos que possuem IP cadastrado para esta lista de ATAs?')) {
    return;
  }
  loading.value = true;
  try {
    const res = await importAtasFromContacts();
    if (res.success) {
      alert(`${res.importedCount} novo(s) equipamento(s) importado(s) com sucesso!`);
      await loadAtas();
      if (res.importedCount > 0) {
        handlePingAll();
      }
    }
  } catch (err) {
    alert('Erro ao importar dos contatos');
  } finally {
    loading.value = false;
  }
}

function formatLastChecked(dateStr) {
  if (!dateStr) return 'Nunca verificado';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

onMounted(() => {
  loadAtas();
});
</script>

<template>
  <div class="ata-dashboard">
    <!-- Top Summary Metrics Cards -->
    <div class="metrics-grid">
      <div class="metric-card glass">
        <div class="metric-icon">📟</div>
        <div class="metric-content">
          <span class="metric-label">Total de Equipamentos</span>
          <span class="metric-value">{{ totalCount }}</span>
          <span class="metric-sub">Adaptadores & ATAs</span>
        </div>
      </div>

      <div class="metric-card glass card-online">
        <div class="metric-icon">🟢</div>
        <div class="metric-content">
          <span class="metric-label">Online</span>
          <span class="metric-value text-online">{{ onlineCount }}</span>
          <span class="metric-sub">{{ uptimePercent }}% do total</span>
        </div>
      </div>

      <div class="metric-card glass card-offline">
        <div class="metric-icon">🔴</div>
        <div class="metric-content">
          <span class="metric-label">Offline / Sem Resposta</span>
          <span class="metric-value text-offline">{{ offlineCount }}</span>
          <span class="metric-sub">{{ offlineCount > 0 ? 'Atenção necessária' : 'Todos respondendo' }}</span>
        </div>
      </div>

      <div class="metric-card glass">
        <div class="metric-icon">⚡</div>
        <div class="metric-content">
          <span class="metric-label">Latência Média (Ping)</span>
          <span class="metric-value">{{ avgLatency !== null ? `${avgLatency} ms` : '-' }}</span>
          <span class="metric-sub">Tempo de resposta ICMP/TCP</span>
        </div>
      </div>
    </div>

    <!-- Actions & Toolbar -->
    <div class="toolbar glass">
      <div class="toolbar-left">
        <button
          @click="handlePingAll"
          class="btn-ping-all"
          :disabled="pingingAll || loading || atas.length === 0"
          title="Executa ping em todos os ATAs simultaneamente"
        >
          <span v-if="pingingAll" class="spinner"></span>
          <span v-else>🔄</span>
          {{ pingingAll ? 'Verificando todos os IPs...' : 'Verificar Todos os Pings' }}
        </button>

        <button
          v-if="canEdit"
          @click="showAddForm = !showAddForm"
          :class="styles.btnPrimary"
          style="padding: 0.6rem 1.2rem; font-size: 0.9rem;"
        >
          {{ showAddForm ? '✕ Fechar Formulário' : '+ Novo ATA' }}
        </button>

        <button
          v-if="canEdit"
          @click="handleImportFromContacts"
          class="btn-import"
          title="Importa ramais cadastrados que possuem IP ou modelo ATA"
          :disabled="loading"
        >
          📥 Importar dos Ramais
        </button>
      </div>

      <div class="toolbar-right">
        <!-- Search -->
        <div class="search-box">
          <input
            type="text"
            v-model="searchQuery"
            placeholder="Buscar por Nome, IP, Ramal ou Setor..."
            class="filter-input"
            @input="loadAtas"
          />
        </div>

        <!-- Status Filter -->
        <select v-model="statusFilter" class="filter-select" @change="loadAtas">
          <option value="all">Status: Todos</option>
          <option value="online">Somente Online</option>
          <option value="offline">Somente Offline</option>
          <option value="unknown">Não Testados</option>
        </select>

        <!-- City Filter -->
        <select v-model="cityFilter" class="filter-select" @change="loadAtas">
          <option value="all">Cidade: Todas</option>
          <option value="sao_gabriel">São Gabriel</option>
          <option value="bage">Bagé</option>
          <option value="passo_fundo">Passo Fundo</option>
        </select>
      </div>
    </div>

    <!-- Add ATA Form (Collapsible) -->
    <transition name="slide">
      <div v-if="showAddForm && canEdit" class="add-box glass">
        <h3>Cadastrar Novo Equipamento ATA</h3>
        <p class="form-desc">
          Cadastre os dados de rede do ATA. Por padrão configurado como <strong>Intelbras ATA 200</strong>.
        </p>
        <form @submit="handleAdd" class="form-grid">
          <div>
            <label class="input-label">Nome / Identificação *</label>
            <input
              type="text"
              v-model="formName"
              placeholder="Ex: ATA 200 - Suporte Técnico"
              :class="styles.input"
              required
            />
          </div>

          <div>
            <label class="input-label">Endereço IP *</label>
            <input
              type="text"
              v-model="formIp"
              placeholder="Ex: 192.168.1.150"
              :class="styles.input"
              required
            />
          </div>

          <div>
            <label class="input-label">Modelo do Equipamento</label>
            <select v-model="formModel" :class="styles.input">
              <option value="Intelbras ATA 200">Intelbras ATA 200</option>
              <option value="Telefone IP Intelbras TIP 125i">Telefone IP Intelbras TIP 125i</option>
              <option value="Telefone IP Intelbras TIP 200">Telefone IP Intelbras TIP 200</option>
              <option value="Telefone Sem Fio TS 2510">Telefone Sem Fio TS 2510</option>
              <option value="Outro Modelo">Outro Modelo</option>
            </select>
          </div>

          <div>
            <label class="input-label">Cidade / Unidade</label>
            <select v-model="formCity" :class="styles.input">
              <option value="sao_gabriel">São Gabriel</option>
              <option value="bage">Bagé</option>
              <option value="passo_fundo">Passo Fundo</option>
              <option value="all">Global</option>
            </select>
          </div>

          <div>
            <label class="input-label">Setor / Departamento</label>
            <input
              type="text"
              v-model="formDepartment"
              placeholder="Ex: Suporte Técnico"
              :class="styles.input"
              list="departments-list"
            />
          </div>

          <div>
            <label class="input-label">Ramal(is) Atendido(s)</label>
            <input
              type="text"
              v-model="formRamais"
              placeholder="Ex: 4041, 4042"
              :class="styles.input"
            />
          </div>

          <div style="grid-column: 1 / -1;">
            <label class="input-label">Observações</label>
            <input
              type="text"
              v-model="formNotes"
              placeholder="Ex: Localizado no rack principal, porta FXS 1 e 2 configuradas"
              :class="styles.input"
            />
          </div>

          <div class="form-actions">
            <button
              type="button"
              @click="showAddForm = false"
              :class="styles.btnSecondary"
            >
              Cancelar
            </button>
            <button
              type="submit"
              :class="styles.btnPrimary"
              :disabled="loading"
            >
              Salvar e Testar Ping
            </button>
          </div>
        </form>
      </div>
    </transition>

    <!-- Table of ATAs -->
    <div :class="styles.tableContainer">
      <div v-if="loading && atas.length === 0" class="empty-state">
        Carregando equipamentos...
      </div>
      <div v-else-if="atas.length === 0" class="empty-state">
        <p>Nenhum equipamento ATA encontrado com os filtros selecionados.</p>
        <button
          v-if="canEdit"
          @click="handleImportFromContacts"
          class="btn-import"
          style="margin-top: 1rem;"
        >
          📥 Importar ATAs dos Ramais
        </button>
      </div>
      <table v-else :class="styles.table" class="ata-table">
        <thead>
          <tr>
            <th style="width: 140px">Status & Ping</th>
            <th>Nome / Identificação</th>
            <th>Endereço IP</th>
            <th>Modelo</th>
            <th>Unidade</th>
            <th>Setor / Ramais</th>
            <th>Última Checagem</th>
            <th style="text-align: right; width: 220px">Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="ata in atas" :key="ata.id" :class="{ 'row-offline': ata.status === 'offline' }">
            <!-- Status & Ping -->
            <td>
              <div class="status-cell">
                <span
                  class="status-dot"
                  :class="{
                    'dot-online': ata.status === 'online',
                    'dot-offline': ata.status === 'offline',
                    'dot-unknown': ata.status !== 'online' && ata.status !== 'offline'
                  }"
                ></span>
                <div class="status-text-block">
                  <span class="status-text">
                    {{ ata.status === 'online' ? 'Online' : ata.status === 'offline' ? 'Offline' : 'Pendente' }}
                  </span>
                  <span v-if="ata.status === 'online' && ata.latencyMs !== null" class="latency-badge">
                    {{ ata.latencyMs }}ms
                  </span>
                </div>
              </div>
            </td>

            <!-- Name -->
            <td>
              <strong>{{ ata.name }}</strong>
              <div v-if="ata.notes" class="subtext-note">{{ ata.notes }}</div>
            </td>

            <!-- IP & Web GUI Link -->
            <td>
              <a
                :href="`http://${ata.ip}`"
                target="_blank"
                rel="noopener noreferrer"
                class="ip-link"
                title="Abrir página web de administração do ATA 200"
              >
                {{ ata.ip }}
                <span class="external-icon">↗</span>
              </a>
            </td>

            <!-- Model -->
            <td>
              <span class="model-badge">{{ ata.model }}</span>
            </td>

            <!-- City -->
            <td>
              {{ cityLabels[ata.city] || ata.city }}
            </td>

            <!-- Department / Ramais -->
            <td>
              <div>{{ ata.department || '-' }}</div>
              <small v-if="ata.ramais" class="ramais-badge">📞 {{ ata.ramais }}</small>
            </td>

            <!-- Last Checked -->
            <td>
              <span class="last-checked">{{ formatLastChecked(ata.lastChecked) }}</span>
            </td>

            <!-- Actions -->
            <td style="text-align: right">
              <div class="action-buttons">
                <!-- Quick Ping Button -->
                <button
                  @click="handlePing(ata.id)"
                  class="btn-action-ping"
                  :disabled="pingingId === ata.id || pingingAll"
                  title="Testar ping imediatamente"
                >
                  <span v-if="pingingId === ata.id" class="mini-spinner"></span>
                  <span v-else>⚡ Ping</span>
                </button>

                <!-- Web Access Button -->
                <a
                  :href="`http://${ata.ip}`"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="btn-action-web"
                  title="Acessar tela de login do ATA 200"
                >
                  🌐 Web
                </a>

                <!-- Edit Button -->
                <button
                  v-if="canEdit"
                  @click="startEdit(ata)"
                  :class="styles.btnSecondary"
                  style="padding: 0.35rem 0.6rem; font-size: 0.8rem;"
                  title="Editar ATA"
                >
                  ✎
                </button>

                <!-- Delete Button -->
                <button
                  v-if="canEdit"
                  @click="handleDelete(ata.id)"
                  :class="styles.btnDanger"
                  style="padding: 0.35rem 0.6rem; font-size: 0.8rem;"
                  title="Remover ATA"
                >
                  🗑
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Edit Modal -->
    <div v-if="editingAta && canEdit" class="modal-backdrop" @click.self="cancelEdit">
      <div class="modal-content glass">
        <h3>Editar Equipamento ATA</h3>
        <form @submit.prevent="handleSaveEdit" class="form-grid" style="margin-top: 1rem;">
          <div>
            <label class="input-label">Nome / Identificação *</label>
            <input type="text" v-model="editingAta.name" :class="styles.input" required />
          </div>

          <div>
            <label class="input-label">Endereço IP *</label>
            <input type="text" v-model="editingAta.ip" :class="styles.input" required />
          </div>

          <div>
            <label class="input-label">Modelo</label>
            <select v-model="editingAta.model" :class="styles.input">
              <option value="Intelbras ATA 200">Intelbras ATA 200</option>
              <option value="Telefone IP Intelbras TIP 125i">Telefone IP Intelbras TIP 125i</option>
              <option value="Telefone IP Intelbras TIP 200">Telefone IP Intelbras TIP 200</option>
              <option value="Telefone Sem Fio TS 2510">Telefone Sem Fio TS 2510</option>
              <option value="Outro Modelo">Outro Modelo</option>
            </select>
          </div>

          <div>
            <label class="input-label">Cidade / Unidade</label>
            <select v-model="editingAta.city" :class="styles.input">
              <option value="sao_gabriel">São Gabriel</option>
              <option value="bage">Bagé</option>
              <option value="passo_fundo">Passo Fundo</option>
              <option value="all">Global</option>
            </select>
          </div>

          <div>
            <label class="input-label">Setor / Departamento</label>
            <input type="text" v-model="editingAta.department" :class="styles.input" list="departments-list" />
          </div>

          <div>
            <label class="input-label">Ramal(is)</label>
            <input type="text" v-model="editingAta.ramais" :class="styles.input" />
          </div>

          <div style="grid-column: 1 / -1;">
            <label class="input-label">Observações</label>
            <input type="text" v-model="editingAta.notes" :class="styles.input" />
          </div>

          <div class="form-actions">
            <button type="button" @click="cancelEdit" :class="styles.btnSecondary">Cancelar</button>
            <button type="submit" :class="styles.btnPrimary" :disabled="loading">Salvar Alterações</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ata-dashboard {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-top: 1rem;
}

/* Metric Cards */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.25rem;
}

.metric-card {
  display: flex;
  align-items: center;
  gap: 1.2rem;
  padding: 1.25rem;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(15, 23, 42, 0.6);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

.metric-icon {
  font-size: 2.2rem;
  line-height: 1;
}

.metric-content {
  display: flex;
  flex-direction: column;
}

.metric-label {
  font-size: 0.82rem;
  color: var(--text-muted, #94a3b8);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.metric-value {
  font-size: 1.8rem;
  font-weight: 700;
  color: #fff;
  line-height: 1.2;
}

.metric-sub {
  font-size: 0.75rem;
  color: var(--text-muted, #64748b);
}

.text-online {
  color: #10b981 !important;
  text-shadow: 0 0 12px rgba(16, 185, 129, 0.4);
}

.text-offline {
  color: #ef4444 !important;
  text-shadow: 0 0 12px rgba(239, 68, 68, 0.4);
}

/* Toolbar */
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  padding: 1rem 1.25rem;
  border-radius: 12px;
  background: rgba(15, 23, 42, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.btn-ping-all {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: linear-gradient(135deg, #0284c7, #0369a1);
  color: #fff;
  border: none;
  padding: 0.6rem 1.2rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(2, 132, 199, 0.3);
  transition: all 0.2s;
}

.btn-ping-all:hover:not(:disabled) {
  background: linear-gradient(135deg, #0ea5e9, #0284c7);
  box-shadow: 0 4px 12px rgba(2, 132, 199, 0.5);
  transform: translateY(-1px);
}

.btn-ping-all:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-import {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #e2e8f0;
  padding: 0.6rem 1rem;
  border-radius: 8px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-import:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.15);
  border-color: #38bdf8;
}

.filter-input {
  padding: 0.55rem 0.9rem;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(0, 0, 0, 0.25);
  color: #fff;
  font-size: 0.9rem;
  min-width: 250px;
  outline: none;
}

.filter-input:focus {
  border-color: #0284c7;
}

.filter-select {
  padding: 0.55rem 0.9rem;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(15, 23, 42, 0.9);
  color: #fff;
  font-size: 0.9rem;
  outline: none;
}

/* Add Form Box */
.add-box {
  padding: 1.5rem;
  border-radius: 12px;
  background: rgba(15, 23, 42, 0.7);
  border: 1px solid rgba(56, 189, 248, 0.2);
}

.add-box h3 {
  margin-top: 0;
  color: #38bdf8;
}

.form-desc {
  font-size: 0.88rem;
  color: var(--text-muted, #94a3b8);
  margin-bottom: 1.25rem;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
}

.input-label {
  display: block;
  font-size: 0.8rem;
  color: #cbd5e1;
  margin-bottom: 0.35rem;
}

.form-actions {
  grid-column: 1 / -1;
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

/* Status Indicator */
.status-cell {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.status-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  display: inline-block;
}

.dot-online {
  background-color: #10b981;
  box-shadow: 0 0 8px #10b981;
  animation: pulse-green 2s infinite;
}

.dot-offline {
  background-color: #ef4444;
  box-shadow: 0 0 8px #ef4444;
}

.dot-unknown {
  background-color: #94a3b8;
}

@keyframes pulse-green {
  0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
  70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
}

.status-text-block {
  display: flex;
  flex-direction: column;
}

.status-text {
  font-weight: 600;
  font-size: 0.88rem;
}

.latency-badge {
  font-size: 0.72rem;
  color: #38bdf8;
  font-family: monospace;
}

.ip-link {
  color: #38bdf8;
  text-decoration: none;
  font-weight: 600;
  font-family: monospace;
  font-size: 0.95rem;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}

.ip-link:hover {
  text-decoration: underline;
  color: #7dd3fc;
}

.external-icon {
  font-size: 0.8rem;
  opacity: 0.7;
}

.model-badge {
  display: inline-block;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.82rem;
  color: #e2e8f0;
}

.ramais-badge {
  display: inline-block;
  color: #cbd5e1;
  margin-top: 0.2rem;
}

.subtext-note {
  font-size: 0.75rem;
  color: #64748b;
  margin-top: 0.2rem;
}

.last-checked {
  font-size: 0.8rem;
  color: var(--text-muted, #94a3b8);
}

.action-buttons {
  display: flex;
  gap: 0.4rem;
  justify-content: flex-end;
  align-items: center;
}

.btn-action-ping {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  background: rgba(2, 132, 199, 0.15);
  color: #38bdf8;
  border: 1px solid rgba(2, 132, 199, 0.3);
  padding: 0.35rem 0.65rem;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-action-ping:hover:not(:disabled) {
  background: rgba(2, 132, 199, 0.35);
  color: #fff;
}

.btn-action-web {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  background: rgba(255, 255, 255, 0.05);
  color: #e2e8f0;
  border: 1px solid rgba(255, 255, 255, 0.15);
  padding: 0.35rem 0.65rem;
  border-radius: 6px;
  font-size: 0.8rem;
  text-decoration: none;
  transition: all 0.2s;
}

.btn-action-web:hover {
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
}

.row-offline {
  background: rgba(239, 68, 68, 0.03);
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: var(--text-muted, #94a3b8);
}

/* Spinner */
.spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  display: inline-block;
}

.mini-spinner {
  width: 11px;
  height: 11px;
  border: 2px solid rgba(56, 189, 248, 0.4);
  border-top-color: #38bdf8;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  display: inline-block;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Modal */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
  padding: 1rem;
}

.modal-content {
  background: #0f172a;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 16px;
  width: 100%;
  max-width: 600px;
  padding: 2rem;
  box-shadow: 0 10px 30px rgba(0,0,0,0.5);
}

.modal-content h3 {
  margin-top: 0;
  color: #38bdf8;
}
</style>
