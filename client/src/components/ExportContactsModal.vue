<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  contacts: {
    type: Array,
    default: () => [],
  },
  lastUpdated: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['close']);

const selectedCity = ref('all');
const searchQuery = ref('');
const copiedToast = ref(false);
let toastTimeout = null;

// Fechar com tecla ESC
function handleKeyDown(e) {
  if (e.key === 'Escape' && props.isOpen) {
    emit('close');
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
  if (toastTimeout) clearTimeout(toastTimeout);
});

function getCityLabel(cityKey) {
  if (cityKey === 'bage') return 'Bagé';
  if (cityKey === 'passo_fundo') return 'Passo Fundo';
  if (cityKey === 'all') return 'Geral / Todas';
  return 'São Gabriel';
}

function getCityBadgeClass(cityKey) {
  if (cityKey === 'bage') return 'city-badge-bage';
  if (cityKey === 'passo_fundo') return 'city-badge-pf';
  if (cityKey === 'all') return 'city-badge-all';
  return 'city-badge-sg';
}

// Estatísticas executivas por cidade
const stats = computed(() => {
  const list = (props.contacts || []).filter(c => !c.hidden);
  
  let total = 0;
  let saoGabriel = 0;
  let bage = 0;
  let passoFundo = 0;
  let geral = 0;

  list.forEach(c => {
    total++;
    const city = c.city || 'sao_gabriel';
    if (city === 'sao_gabriel') saoGabriel++;
    else if (city === 'bage') bage++;
    else if (city === 'passo_fundo') passoFundo++;
    else if (city === 'all') geral++;
  });

  return {
    total,
    saoGabriel,
    bage,
    passoFundo,
    geral,
  };
});

// Contatos filtrados (apenas contatos visíveis, nomes, contatos e cidades)
const filteredContacts = computed(() => {
  const q = (searchQuery.value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

  return (props.contacts || [])
    .filter(c => {
      if (c.hidden) return false;

      const cCity = c.city || 'sao_gabriel';
      if (selectedCity.value !== 'all' && cCity !== selectedCity.value) {
        return false;
      }

      if (q) {
        const normName = (c.name || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
        const normDept = (c.department || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
        const phone = (c.phone || '').toLowerCase();
        const cityLabel = getCityLabel(cCity).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

        return normName.includes(q) || normDept.includes(q) || phone.includes(q) || cityLabel.includes(q);
      }

      return true;
    })
    .sort((a, b) => {
      const cityOrder = { sao_gabriel: 1, bage: 2, passo_fundo: 3, all: 4 };
      const cA = cityOrder[a.city || 'sao_gabriel'] || 99;
      const cB = cityOrder[b.city || 'sao_gabriel'] || 99;
      if (cA !== cB) return cA - cB;

      const deptA = (a.department || '').localeCompare(b.department || '');
      if (deptA !== 0) return deptA;

      return (a.name || '').localeCompare(b.name || '');
    });
});

// Geração de CSV para Excel (apenas Cidades, Nomes e Contatos)
function exportToExcel() {
  const list = filteredContacts.value;
  if (!list.length) {
    alert('Nenhum contato selecionado para exportar.');
    return;
  }

  const now = new Date();
  const dateFormatted = now.toLocaleDateString('pt-BR');
  const timeFormatted = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  const clean = (val) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = [];

  // Cabeçalho institucional / Resumo quantitativo para chefe e operadora
  rows.push([clean('RELATÓRIO DE CONTATOS E RAMAIS - NEW LIFE FIBRA')]);
  rows.push([clean(`Gerado em: ${dateFormatted} às ${timeFormatted}`), clean(`Total de Ramais: ${stats.value.total}`)]);
  rows.push([
    clean(`São Gabriel: ${stats.value.saoGabriel}`),
    clean(`Bagé: ${stats.value.bage}`),
    clean(`Passo Fundo: ${stats.value.passoFundo}`),
    clean(`Geral / Todas: ${stats.value.geral}`)
  ]);
  rows.push([]); // Linha em branco

  // Cabeçalho das Colunas (Apenas Cidade, Setor, Nome e Contato)
  rows.push([
    clean('Cidade'),
    clean('Departamento / Setor'),
    clean('Colaborador / Nome'),
    clean('Contato / Ramal')
  ]);

  // Linhas de dados
  list.forEach(c => {
    rows.push([
      clean(getCityLabel(c.city || 'sao_gabriel')),
      clean(c.department || 'Geral'),
      clean(c.name || ''),
      clean(c.phone || '')
    ]);
  });

  const csvContent = '\uFEFF' + rows.map(r => r.join(';')).join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const fileDate = now.toISOString().slice(0, 10);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `contatos_ramais_newlife_${fileDate}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Cópia do Relatório Formatado (WhatsApp / E-mail do chefe ou operadora)
function copyFormattedSummary() {
  const list = filteredContacts.value;
  if (!list.length) {
    alert('Nenhum contato encontrado com os filtros atuais.');
    return;
  }

  const now = new Date();
  const dateFormatted = now.toLocaleDateString('pt-BR');
  const timeFormatted = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  let text = `📞 RELATÓRIO DE RAMAIS - NEW LIFE FIBRA\n`;
  text += `📅 Gerado em: ${dateFormatted} às ${timeFormatted}\n\n`;

  text += `📊 QUANTIDADE DE RAMAIS POR CIDADE:\n`;
  text += `• Total Geral: ${stats.value.total} ramais/contatos\n`;
  text += `  - São Gabriel: ${stats.value.saoGabriel}\n`;
  text += `  - Bagé: ${stats.value.bage}\n`;
  text += `  - Passo Fundo: ${stats.value.passoFundo}\n`;
  if (stats.value.geral > 0) {
    text += `  - Geral / Todas: ${stats.value.geral}\n`;
  }
  text += `\n--------------------------------------------------\n`;
  text += `📋 LISTA DE CONTATOS:\n`;
  text += `--------------------------------------------------\n\n`;

  const grouped = {};
  list.forEach(c => {
    const cCity = getCityLabel(c.city || 'sao_gabriel');
    const dept = c.department || 'Outros';
    if (!grouped[cCity]) grouped[cCity] = {};
    if (!grouped[cCity][dept]) grouped[cCity][dept] = [];
    grouped[cCity][dept].push(c);
  });

  for (const [cityName, depts] of Object.entries(grouped)) {
    text += `🏢 [CIDADE: ${cityName.toUpperCase()}]\n`;
    for (const [deptName, contacts] of Object.entries(depts)) {
      text += `\n📁 ${deptName}:\n`;
      contacts.forEach(c => {
        text += `  • ${c.name}: ${c.phone}\n`;
      });
    }
    text += `\n==================================================\n\n`;
  }

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      triggerCopiedToast();
    }).catch(() => {
      fallbackCopy(text);
    });
  } else {
    fallbackCopy(text);
  }
}

function fallbackCopy(text) {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.top = '-9999px';
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  try {
    document.execCommand('copy');
    triggerCopiedToast();
  } catch (err) {
    alert('Erro ao copiar automaticamente. Selecione e copie o texto manualmente.');
  }
  document.body.removeChild(textArea);
}

function triggerCopiedToast() {
  copiedToast.value = true;
  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    copiedToast.value = false;
  }, 3000);
}

function printReport() {
  window.print();
}
</script>

<template>
  <div v-if="isOpen" class="modal-overlay" @click.self="$emit('close')">
    <div class="export-modal glass" @click.stop>
      
      <!-- Cabeçalho do Modal -->
      <div class="modal-header">
        <div class="header-title-box">
          <div class="title-row">
            <span class="export-header-icon">📑</span>
            <h3>Exportar Contatos e Ramais</h3>
            <span class="badge-cities">3 Cidades</span>
          </div>
          <p class="subtitle">
            Relatório de contatos das unidades São Gabriel, Bagé e Passo Fundo
          </p>
        </div>
        <button class="close-btn" @click="$emit('close')" title="Fechar (Esc)">✕</button>
      </div>

      <!-- Resumo Executivo das Cidades (Cards com quantidades) -->
      <div class="stats-grid">
        <div class="stat-card stat-total">
          <div class="stat-icon">🏢</div>
          <div class="stat-info">
            <span class="stat-number">{{ stats.total }}</span>
            <span class="stat-label">Total de Ramais</span>
          </div>
        </div>

        <div class="stat-card stat-sg">
          <div class="stat-icon">📍</div>
          <div class="stat-info">
            <span class="stat-number">{{ stats.saoGabriel }}</span>
            <span class="stat-label">São Gabriel</span>
          </div>
        </div>

        <div class="stat-card stat-bage">
          <div class="stat-icon">📍</div>
          <div class="stat-info">
            <span class="stat-number">{{ stats.bage }}</span>
            <span class="stat-label">Bagé</span>
          </div>
        </div>

        <div class="stat-card stat-pf">
          <div class="stat-icon">📍</div>
          <div class="stat-info">
            <span class="stat-number">{{ stats.passoFundo }}</span>
            <span class="stat-label">Passo Fundo</span>
          </div>
        </div>
      </div>

      <!-- Barra de Ações (Exportar Excel, Copiar, Imprimir) -->
      <div class="actions-bar">
        <button class="btn-action btn-excel" @click="exportToExcel" title="Baixar planilha formatada para Excel (.CSV)">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="8" y1="13" x2="16" y2="13"/>
            <line x1="8" y1="17" x2="16" y2="17"/>
            <polyline points="10 9 9 9 8 9"/>
          </svg>
          <span>Baixar Planilha Excel (.CSV)</span>
        </button>

        <button class="btn-action btn-copy" @click="copyFormattedSummary" title="Copiar resumo para enviar no WhatsApp ou E-mail">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
          </svg>
          <span>Copiar para WhatsApp / E-mail</span>
        </button>

        <button class="btn-action btn-print" @click="printReport" title="Imprimir ou Salvar como PDF">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="6 9 6 2 18 2 18 9"/>
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
            <rect x="6" y="14" width="12" height="8"/>
          </svg>
          <span>Imprimir / PDF</span>
        </button>
      </div>

      <!-- Filtros e Busca de Contatos -->
      <div class="filters-container">
        <div class="filter-group">
          <label class="filter-label">Filtrar Cidade:</label>
          <div class="chip-group">
            <button
              :class="['chip-btn', { active: selectedCity === 'all' }]"
              @click="selectedCity = 'all'"
            >
              Todas (3 Cidades)
            </button>
            <button
              :class="['chip-btn', { active: selectedCity === 'sao_gabriel' }]"
              @click="selectedCity = 'sao_gabriel'"
            >
              São Gabriel ({{ stats.saoGabriel }})
            </button>
            <button
              :class="['chip-btn', { active: selectedCity === 'bage' }]"
              @click="selectedCity = 'bage'"
            >
              Bagé ({{ stats.bage }})
            </button>
            <button
              :class="['chip-btn', { active: selectedCity === 'passo_fundo' }]"
              @click="selectedCity = 'passo_fundo'"
            >
              Passo Fundo ({{ stats.passoFundo }})
            </button>
          </div>
        </div>

        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input
            type="text"
            v-model="searchQuery"
            placeholder="Pesquisar por nome, contato, setor ou cidade..."
            class="search-input"
          />
          <button v-if="searchQuery" @click="searchQuery = ''" class="clear-search-btn">✕</button>
        </div>
      </div>

      <!-- Tabela de Prévia: Apenas Cidades, Setores, Nomes e Contatos -->
      <div class="preview-container">
        <div class="preview-header">
          <span>Contatos selecionados ({{ filteredContacts.length }} de {{ stats.total }})</span>
          <span class="preview-hint">Clique em "Baixar Planilha Excel" para exportar o arquivo</span>
        </div>

        <div class="table-scroll">
          <table class="contacts-table">
            <thead>
              <tr>
                <th style="width: 140px;">Cidade</th>
                <th style="width: 220px;">Departamento / Setor</th>
                <th>Colaborador / Nome</th>
                <th style="width: 180px;">Contato / Ramal</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="filteredContacts.length === 0">
                <td colspan="4" class="empty-row">Nenhum contato encontrado.</td>
              </tr>
              <tr v-for="c in filteredContacts" :key="c.id || (c.name + c.phone)">
                <td>
                  <span :class="['city-pill', getCityBadgeClass(c.city || 'sao_gabriel')]">
                    {{ getCityLabel(c.city || 'sao_gabriel') }}
                  </span>
                </td>
                <td class="cell-dept">{{ c.department || 'Geral' }}</td>
                <td class="cell-name">{{ c.name }}</td>
                <td class="cell-phone">
                  <strong>{{ c.phone }}</strong>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Rodapé do Modal -->
      <div class="modal-footer">
        <div class="footer-left">
          <span>Atualizado em: {{ lastUpdated || 'Hoje' }}</span>
        </div>
        <div class="footer-right">
          <button class="btn-secondary" @click="$emit('close')">Fechar</button>
          <button class="btn-primary" @click="exportToExcel">
            📥 Baixar Planilha Excel (.CSV)
          </button>
        </div>
      </div>

      <!-- Toast Flutuante de Cópia Concluída -->
      <transition name="toast-fade">
        <div v-if="copiedToast" class="copied-toast">
          <span>✅ Relatório copiado para a área de transferência!</span>
          <small>Pronto para colar no WhatsApp ou E-mail.</small>
        </div>
      </transition>

    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 1rem;
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.export-modal {
  width: 100%;
  max-width: 900px;
  max-height: 90vh;
  background: var(--bg-color);
  border: 1px solid var(--card-border);
  border-radius: 20px;
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.45);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  animation: slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Header */
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.75rem;
  border-bottom: 1px solid var(--card-border);
  background: rgba(255, 255, 255, 0.02);
}

.header-title-box {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.export-header-icon {
  font-size: 1.4rem;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.35rem;
  font-weight: 700;
  color: var(--primary-color);
  letter-spacing: -0.01em;
}

.badge-cities {
  font-size: 0.72rem;
  padding: 0.2rem 0.55rem;
  background: rgba(72, 202, 228, 0.15);
  color: var(--primary-color);
  border: 1px solid var(--primary-color);
  border-radius: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.subtitle {
  margin: 0;
  font-size: 0.85rem;
  color: var(--text-muted);
}

.close-btn {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--card-border);
  color: var(--text-muted);
  width: 34px;
  height: 34px;
  border-radius: 50%;
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.close-btn:hover {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
  border-color: #ef4444;
}

/* Stats Cards */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.75rem;
  padding: 1.25rem 1.75rem 0.75rem 1.75rem;
}

.stat-card {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 12px;
  padding: 0.75rem 1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  transition: transform 0.2s, border-color 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  border-color: var(--card-border-hover);
}

.stat-icon {
  font-size: 1.5rem;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-number {
  font-size: 1.35rem;
  font-weight: 800;
  color: var(--text-main);
  line-height: 1.1;
}

.stat-label {
  font-size: 0.72rem;
  color: var(--text-muted);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.stat-total .stat-number {
  color: var(--primary-color);
}

/* Actions Bar */
.actions-bar {
  display: flex;
  gap: 0.75rem;
  padding: 0.5rem 1.75rem 1rem 1.75rem;
  flex-wrap: wrap;
}

.btn-action {
  flex: 1;
  min-width: 180px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  padding: 0.7rem 1.2rem;
  border-radius: 10px;
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.btn-excel {
  background: #10b981;
  color: #ffffff;
  box-shadow: 0 4px 14px rgba(16, 185, 129, 0.25);
}

.btn-excel:hover {
  background: #059669;
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(16, 185, 129, 0.35);
}

.btn-copy {
  background: rgba(56, 189, 248, 0.15);
  color: #38bdf8;
  border-color: rgba(56, 189, 248, 0.3);
}

.btn-copy:hover {
  background: rgba(56, 189, 248, 0.25);
  border-color: #38bdf8;
  transform: translateY(-1px);
}

.btn-print {
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-main);
  border-color: var(--card-border);
  flex: 0 0 auto;
  min-width: 130px;
}

.btn-print:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: var(--primary-color);
  color: var(--primary-color);
}

/* Filters */
.filters-container {
  padding: 0.5rem 1.75rem 0.75rem 1.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.filter-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-muted);
}

.chip-group {
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.chip-btn {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  color: var(--text-muted);
  padding: 0.35rem 0.8rem;
  border-radius: 20px;
  font-size: 0.78rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.chip-btn:hover {
  border-color: var(--primary-color);
  color: var(--text-main);
}

.chip-btn.active {
  background: var(--primary-color);
  color: #0c1e3e;
  border-color: var(--primary-color);
  font-weight: 700;
}

[data-theme="light"] .chip-btn.active {
  color: #ffffff;
}

.search-box {
  width: 100%;
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 0.75rem;
  font-size: 0.85rem;
  pointer-events: none;
  opacity: 0.6;
}

.search-input {
  width: 100%;
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 8px;
  padding: 0.5rem 2rem 0.5rem 2.2rem;
  color: var(--text-main);
  font-size: 0.85rem;
  outline: none;
  transition: border-color 0.2s;
}

.search-input:focus {
  border-color: var(--primary-color);
}

.clear-search-btn {
  position: absolute;
  right: 0.6rem;
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 0.85rem;
}

/* Preview Table */
.preview-container {
  flex: 1;
  min-height: 200px;
  display: flex;
  flex-direction: column;
  padding: 0 1.75rem;
  overflow: hidden;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.78rem;
  color: var(--text-muted);
  margin-bottom: 0.4rem;
}

.preview-hint {
  font-style: italic;
  font-size: 0.74rem;
}

.table-scroll {
  flex: 1;
  overflow-y: auto;
  border: 1px solid var(--card-border);
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.15);
  max-height: 320px;
}

.contacts-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.82rem;
  text-align: left;
}

.contacts-table thead {
  position: sticky;
  top: 0;
  background: var(--bg-color);
  z-index: 2;
  border-bottom: 1px solid var(--card-border);
}

.contacts-table th {
  padding: 0.6rem 0.8rem;
  color: var(--text-muted);
  font-weight: 600;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.contacts-table td {
  padding: 0.55rem 0.8rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  color: var(--text-main);
}

.contacts-table tbody tr:hover {
  background: rgba(255, 255, 255, 0.03);
}

.empty-row {
  text-align: center;
  padding: 2rem !important;
  color: var(--text-muted);
}

.cell-dept {
  color: var(--text-muted);
}

.cell-name {
  font-weight: 500;
}

.cell-phone {
  color: var(--primary-color);
  font-family: monospace;
  font-size: 0.88rem;
}

.city-pill {
  display: inline-block;
  font-size: 0.7rem;
  padding: 0.15rem 0.45rem;
  border-radius: 4px;
  font-weight: 600;
}

.city-badge-sg {
  background: rgba(72, 202, 228, 0.15);
  color: #48cae4;
  border: 1px solid rgba(72, 202, 228, 0.3);
}

.city-badge-bage {
  background: rgba(239, 68, 68, 0.15);
  color: #f87171;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.city-badge-pf {
  background: rgba(16, 185, 129, 0.15);
  color: #34d399;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.city-badge-all {
  background: rgba(168, 85, 247, 0.15);
  color: #c084fc;
  border: 1px solid rgba(168, 85, 247, 0.3);
}

/* Modal Footer */
.modal-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.75rem;
  border-top: 1px solid var(--card-border);
  background: rgba(255, 255, 255, 0.02);
  margin-top: 0.75rem;
}

.footer-left {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.footer-right {
  display: flex;
  gap: 0.75rem;
}

.btn-secondary {
  background: transparent;
  border: 1px solid var(--card-border);
  color: var(--text-muted);
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary:hover {
  color: var(--text-main);
  border-color: var(--text-muted);
}

.btn-primary {
  background: #10b981;
  color: #ffffff;
  border: none;
  padding: 0.5rem 1.25rem;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary:hover {
  background: #059669;
}

/* Floating Toast */
.copied-toast {
  position: absolute;
  bottom: 5rem;
  left: 50%;
  transform: translateX(-50%);
  background: #064e3b;
  border: 1px solid #10b981;
  color: #ecfdf5;
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
  font-size: 0.9rem;
  font-weight: 600;
  z-index: 10000;
  pointer-events: none;
}

.copied-toast small {
  font-size: 0.75rem;
  color: #a7f3d0;
  font-weight: 400;
}

.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: all 0.25s ease;
}

.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
  transform: translate(-50%, 10px);
}

/* Impressão / Print Styles */
@media print {
  body * {
    visibility: hidden;
  }
  .modal-overlay,
  .export-modal,
  .export-modal * {
    visibility: visible;
  }
  .modal-overlay {
    position: absolute;
    inset: 0;
    background: #ffffff;
    padding: 0;
  }
  .export-modal {
    box-shadow: none;
    border: none;
    max-width: 100%;
    max-height: none;
    color: #000;
    background: #fff;
  }
  .close-btn,
  .actions-bar,
  .filters-container,
  .modal-footer {
    display: none !important;
  }
  .table-scroll {
    max-height: none;
    overflow: visible;
    border: 1px solid #ccc;
  }
  .contacts-table th,
  .contacts-table td {
    color: #000 !important;
    border-bottom: 1px solid #eee;
  }
}

/* Responsividade */
@media (max-width: 768px) {
  .export-modal {
    max-height: 95vh;
  }
  .modal-header {
    padding: 1rem;
  }
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    padding: 0.75rem 1rem;
  }
  .actions-bar {
    padding: 0.5rem 1rem;
  }
  .btn-action {
    min-width: 100%;
  }
  .filters-container {
    padding: 0.5rem 1rem;
  }
  .preview-container {
    padding: 0 1rem;
  }
  .modal-footer {
    padding: 0.75rem 1rem;
  }
}
</style>
