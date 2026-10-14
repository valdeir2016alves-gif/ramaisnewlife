<script setup>
import { ref, computed, onMounted } from 'vue';
import { getSipConfig, testSipExtension, getMicroSipIniUrl } from '../api';

const props = defineProps({
  contacts: {
    type: Array,
    default: () => []
  }
});

const config = ref({
  server: 'pabx.newlifefibra.com.br',
  domain: 'pabx.newlifefibra.com.br',
  tenantPrefix: '2',
  passwordPattern: 'Ramal@{ramal}',
  transport: 'udp',
  port: 5060,
  realm: 'twsolutions'
});

const searchQuery = ref('');
const selectedCity = ref('all');
const showTutorial = ref(false);

// Teste rápido
const testExt = ref('');
const testPw = ref('');
const testing = ref(false);
const testResult = ref(null);

// Status de teste individual por ramal
const testingRows = ref({});
const rowResults = ref({});
const copiedNotice = ref('');

onMounted(async () => {
  try {
    const data = await getSipConfig();
    if (data && data.server) {
      config.value = { ...config.value, ...data };
    }
  } catch (e) {
    console.error('Erro ao carregar config SIP:', e);
  }
});

// Apenas ramais numéricos de 4 dígitos (exclui fixos regionais com DDD e 0800)
const ramaisList = computed(() => {
  const map = new Map();
  (props.contacts || []).forEach(c => {
    const raw = (c.phone || '').trim().replace(/\D/g, '');
    if (raw.length === 4) {
      if (!map.has(raw)) {
        map.set(raw, {
          id: c.id,
          ramal: raw,
          name: c.name,
          department: c.department,
          city: c.city || 'sao_gabriel',
          phoneModel: c.phoneModel || c.phone_model || '',
          authUser: `${config.value.tenantPrefix}${raw}`,
          password: `Ramal@${raw}`
        });
      }
    }
  });

  return Array.from(map.values()).sort((a, b) => a.ramal.localeCompare(b.ramal));
});

const filteredRamais = computed(() => {
  const q = searchQuery.value.toLowerCase().trim();
  return ramaisList.value.filter(r => {
    const matchCity = selectedCity.value === 'all' || r.city === selectedCity.value;
    const matchQuery = !q ||
      r.ramal.includes(q) ||
      r.name.toLowerCase().includes(q) ||
      r.department.toLowerCase().includes(q) ||
      r.authUser.includes(q);
    return matchCity && matchQuery;
  });
});

function copyToClipboard(text, label = 'Copiado!') {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text);
  } else {
    const input = document.createElement('textarea');
    input.value = text;
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    document.body.removeChild(input);
  }
  copiedNotice.value = label;
  setTimeout(() => {
    if (copiedNotice.value === label) copiedNotice.value = '';
  }, 2200);
}

function copyExtensionConfig(item) {
  const text = `Configuração do MicroSIP - Ramal ${item.ramal} (${item.name}):
• Nome da Conta: ${item.name} (${item.ramal})
• Servidor SIP: ${config.value.server}
• Usuário: ${item.authUser}
• Domínio: ${config.value.domain}
• Login / AuthID: ${item.authUser}
• Senha: ${item.password}
• Nome de Exibição: ${item.ramal}
• Transporte: ${config.value.transport.toUpperCase()}`;

  copyToClipboard(text, `Dados do ramal ${item.ramal} copiados!`);
}

function downloadIni(item) {
  const url = getMicroSipIniUrl(item.ramal, item.name, item.password);
  const a = document.createElement('a');
  a.href = url;
  a.download = `MicroSIP-${item.ramal}.ini`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

async function handleTestExtension(ext, pw = '', isRow = false) {
  if (!ext) return;
  const clean = ext.trim().replace(/\D/g, '');
  if (!clean) return;

  if (isRow) {
    testingRows.value = { ...testingRows.value, [clean]: true };
  } else {
    testing.value = true;
    testResult.value = null;
  }

  try {
    const res = await testSipExtension(clean, pw || `Ramal@${clean}`);
    if (isRow) {
      rowResults.value = { ...rowResults.value, [clean]: res };
    } else {
      testResult.value = res;
    }
  } catch (err) {
    const errRes = { success: false, error: err.message };
    if (isRow) {
      rowResults.value = { ...rowResults.value, [clean]: errRes };
    } else {
      testResult.value = errRes;
    }
  } finally {
    if (isRow) {
      const next = { ...testingRows.value };
      delete next[clean];
      testingRows.value = next;
    } else {
      testing.value = false;
    }
  }
}

function dialMicroSip(ramal) {
  if (typeof window !== 'undefined') {
    window.location.href = `sip:${ramal}`;
  }
}
</script>

<template>
  <div class="microsip-wrapper">
    <!-- Notificação Flutuante de Cópia -->
    <transition name="fade">
      <div v-if="copiedNotice" class="copy-toast">
        ✓ {{ copiedNotice }}
      </div>
    </transition>

    <!-- Cabeçalho Principal -->
    <div class="microsip-header glass">
      <div class="header-main">
        <div class="header-icon-box">
          <span class="header-emoji">🎧</span>
        </div>
        <div>
          <h2 class="header-title">Configuração do MicroSIP (Softphone)</h2>
          <p class="header-desc">
            Instruções, parâmetros de autenticação e geração automática de arquivos <code>MicroSIP.ini</code> para os colaboradores.
          </p>
        </div>
      </div>

      <div class="header-stats-grid">
        <div class="stat-box">
          <span class="stat-label">Servidor / Domínio</span>
          <span class="stat-value font-mono">{{ config.server }}</span>
        </div>
        <div class="stat-box">
          <span class="stat-label">Prefixo de Conta (VirtPBX)</span>
          <span class="stat-value font-mono text-cyan">{{ config.tenantPrefix }} (Ex: 4088 → 24088)</span>
        </div>
        <div class="stat-box">
          <span class="stat-label">Padrão de Senha</span>
          <span class="stat-value font-mono">Ramal@{ramal}</span>
        </div>
        <div class="stat-box">
          <span class="stat-label">Transporte Recomendado</span>
          <span class="stat-value font-mono text-emerald">UDP (Porta 5060)</span>
        </div>
      </div>

      <div class="header-actions">
        <button
          type="button"
          class="btn-help"
          @click="showTutorial = !showTutorial"
        >
          {{ showTutorial ? 'Ocultar Guia Passo a Passo' : '📖 Como Configurar o MicroSIP no Windows (Passo a Passo)' }}
        </button>

        <a
          href="https://www.microsip.org/downloads"
          target="_blank"
          rel="noopener noreferrer"
          class="btn-download-app"
        >
          ⬇️ Baixar MicroSIP Oficial (microsip.org)
        </a>
      </div>
    </div>

    <!-- Guia Passo a Passo Ilustrado (Colapsável) -->
    <transition name="expand">
      <div v-if="showTutorial" class="tutorial-card glass">
        <h3 class="tutorial-title">Passo a Passo: Como Configurar o Ramal no MicroSIP</h3>
        <div class="steps-grid">
          <div class="step-item">
            <div class="step-number">1</div>
            <div class="step-content">
              <strong>Baixar e Instalar o MicroSIP</strong>
              <p>Baixe a versão gratuita no site oficial ou execute a versão portátil no computador do colaborador.</p>
            </div>
          </div>

          <div class="step-item">
            <div class="step-number">2</div>
            <div class="step-content">
              <strong>Abrir o Menu de Contas</strong>
              <p>No canto superior direito da janela do MicroSIP, clique na <strong>setinha para baixo ▾</strong> e selecione <strong>Adicionar Conta...</strong> (ou <em>Editar Conta</em>).</p>
            </div>
          </div>

          <div class="step-item">
            <div class="step-number">3</div>
            <div class="step-content">
              <strong>Preencher os Campos</strong>
              <p>Copie os dados da tabela abaixo para cada campo. <em>Atenção:</em> o <strong>Usuário</strong> e <strong>Login</strong> devem conter o prefixo <strong>2</strong> (Ex: <code>24088</code> para o ramal 4088).</p>
            </div>
          </div>

          <div class="step-item">
            <div class="step-number">4</div>
            <div class="step-content">
              <strong>Salvar e Validar</strong>
              <p>Clique em <strong>Salvar</strong>. Em instantes o status no canto inferior esquerdo ficará <span class="badge-online">● Online</span>.</p>
            </div>
          </div>
        </div>

        <div class="ini-tip-box">
          <span class="tip-icon">💡</span>
          <div>
            <strong>Dica de Produtividade (Configuração Automática em 10 Segundos):</strong>
            <p>
              Em vez de digitar tudo manualmente, clique no botão <strong>"📥 Baixar INI"</strong> na linha do ramal desejado. Depois, feche o MicroSIP e copie o arquivo baixado para a pasta <code>%APPDATA%\MicroSIP\MicroSIP.ini</code> (ou cole na pasta do MicroSIP Portable). Ao abrir o programa, ele já entrará 100% configurado e Online!
            </p>
          </div>
        </div>
      </div>
    </transition>

    <!-- Caixa de Teste Rápido de Ramal na Central -->
    <div class="test-panel glass">
      <h3 class="test-title">⚡ Testador de Ramal na Central VirtPBX</h3>
      <p class="test-desc">Verifique em tempo real se a central Asterisk está aceitando a autenticação e senha de qualquer ramal.</p>
      
      <div class="test-form">
        <div class="test-field">
          <label>Ramal (4 dígitos):</label>
          <input
            type="text"
            v-model="testExt"
            placeholder="Ex: 4088, 4001"
            maxlength="4"
            class="test-input"
            @keydown.enter="handleTestExtension(testExt, testPw)"
          />
        </div>

        <div class="test-field">
          <label>Senha (opcional se for padrão):</label>
          <input
            type="text"
            v-model="testPw"
            :placeholder="`Padrão: Ramal@${testExt || '4088'}`"
            class="test-input"
            @keydown.enter="handleTestExtension(testExt, testPw)"
          />
        </div>

        <button
          type="button"
          class="btn-run-test"
          :disabled="!testExt.trim() || testing"
          @click="handleTestExtension(testExt, testPw)"
        >
          <span v-if="testing" class="spinner"></span>
          <span>{{ testing ? 'Verificando...' : 'Testar Autenticação' }}</span>
        </button>
      </div>

      <div v-if="testResult" class="test-feedback" :class="testResult.success ? 'feedback-success' : 'feedback-error'">
        <div class="feedback-icon">{{ testResult.success ? '✅' : '❌' }}</div>
        <div>
          <div class="feedback-main">
            {{ testResult.success ? 'Autenticação Aprovada pela Central!' : 'Falha na Autenticação' }}
            <span v-if="testResult.latencyMs" class="feedback-latency">({{ testResult.latencyMs }}ms)</span>
          </div>
          <div class="feedback-detail">
            {{ testResult.message || testResult.error }}
          </div>
        </div>
      </div>
    </div>

    <!-- Lista e Tabela de Todos os Ramais -->
    <div class="table-container glass">
      <div class="table-toolbar">
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input
            type="text"
            v-model="searchQuery"
            placeholder="Buscar por ramal, colaborador, setor..."
            class="search-input"
          />
          <button v-if="searchQuery" @click="searchQuery = ''" class="btn-clear-search">✕</button>
        </div>

        <div class="filter-chips">
          <button
            :class="selectedCity === 'all' ? 'chip-active' : 'chip'"
            @click="selectedCity = 'all'"
          >
            Todas Unidades ({{ ramaisList.length }})
          </button>
          <button
            :class="selectedCity === 'sao_gabriel' ? 'chip-active' : 'chip'"
            @click="selectedCity = 'sao_gabriel'"
          >
            São Gabriel
          </button>
          <button
            :class="selectedCity === 'bage' ? 'chip-active' : 'chip'"
            @click="selectedCity = 'bage'"
          >
            Bagé
          </button>
          <button
            :class="selectedCity === 'passo_fundo' ? 'chip-active' : 'chip'"
            @click="selectedCity = 'passo_fundo'"
          >
            Passo Fundo
          </button>
        </div>
      </div>

      <div class="table-stats-bar">
        <span>Exibindo <strong>{{ filteredRamais.length }}</strong> ramais disponíveis</span>
      </div>

      <div class="table-responsive">
        <table class="microsip-table">
          <thead>
            <tr>
              <th style="width: 90px;">Ramal</th>
              <th>Colaborador / Setor</th>
              <th style="width: 130px;">Usuário MicroSIP</th>
              <th style="width: 150px;">Senha Padrão</th>
              <th style="width: 130px;">Equipamento</th>
              <th style="text-align: right; width: 270px;">Ações MicroSIP</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="filteredRamais.length === 0">
              <td colspan="6" class="empty-state">
                Nenhum ramal encontrado para o filtro pesquisado.
              </td>
            </tr>
            <tr v-for="item in filteredRamais" :key="item.id" class="table-row">
              <td>
                <span class="ramal-badge">{{ item.ramal }}</span>
              </td>
              <td>
                <div class="collab-name">{{ item.name }}</div>
                <div class="collab-dept">{{ item.department }}</div>
              </td>
              <td>
                <div class="code-pill font-mono" title="Clique para copiar" @click="copyToClipboard(item.authUser, `Usuário ${item.authUser} copiado!`)">
                  <span>{{ item.authUser }}</span>
                  <span class="copy-hint">📋</span>
                </div>
              </td>
              <td>
                <div class="code-pill font-mono" title="Clique para copiar" @click="copyToClipboard(item.password, `Senha ${item.password} copiada!`)">
                  <span>{{ item.password }}</span>
                  <span class="copy-hint">📋</span>
                </div>
              </td>
              <td>
                <span class="device-tag">{{ item.phoneModel || 'MicroSIP / ATA' }}</span>
              </td>
              <td style="text-align: right;">
                <div class="row-actions">
                  <!-- Baixar INI -->
                  <button
                    type="button"
                    class="action-btn btn-ini"
                    @click="downloadIni(item)"
                    title="Baixar arquivo MicroSIP.ini pré-configurado"
                  >
                    📥 Baixar INI
                  </button>

                  <!-- Copiar Dados -->
                  <button
                    type="button"
                    class="action-btn btn-copy"
                    @click="copyExtensionConfig(item)"
                    title="Copiar texto com todos os parâmetros da conta"
                  >
                    📋 Copiar
                  </button>

                  <!-- Testar na Central -->
                  <button
                    type="button"
                    class="action-btn btn-test"
                    :disabled="testingRows[item.ramal]"
                    @click="handleTestExtension(item.ramal, item.password, true)"
                    title="Testar autenticação na central"
                  >
                    <span v-if="testingRows[item.ramal]">⏳</span>
                    <span v-else>⚡ Testar</span>
                  </button>

                  <!-- Discar -->
                  <button
                    type="button"
                    class="action-btn btn-dial"
                    @click="dialMicroSip(item.ramal)"
                    title="Chamar ramal via MicroSIP"
                  >
                    📞
                  </button>
                </div>

                <!-- Resultado de teste na linha -->
                <div v-if="rowResults[item.ramal]" class="row-result" :class="rowResults[item.ramal].success ? 'row-res-ok' : 'row-res-err'">
                  {{ rowResults[item.ramal].success ? '✓ Conexão OK' : '✕ ' + rowResults[item.ramal].error }}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.microsip-wrapper {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  width: 100%;
}

.font-mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.text-cyan {
  color: #38bdf8 !important;
}

.text-emerald {
  color: #34d399 !important;
}

.copy-toast {
  position: fixed;
  top: 24px;
  right: 24px;
  background: #10b981;
  color: #ffffff;
  padding: 10px 18px;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);
  z-index: 99999;
}

/* Header */
.microsip-header {
  padding: 1.75rem;
  border-radius: 16px;
  background: rgba(15, 23, 42, 0.65);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.header-main {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.header-icon-box {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: linear-gradient(135deg, rgba(14, 165, 233, 0.2), rgba(30, 58, 138, 0.4));
  border: 1px solid rgba(56, 189, 248, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
}

.header-emoji {
  font-size: 1.75rem;
}

.header-title {
  margin: 0;
  font-size: 1.4rem;
  font-weight: 700;
  color: #f8fafc;
}

.header-desc {
  margin: 4px 0 0;
  font-size: 0.9rem;
  color: #94a3b8;
}

.header-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.85rem;
}

.stat-box {
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.06);
  padding: 0.85rem 1rem;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-label {
  font-size: 0.72rem;
  text-transform: uppercase;
  color: #94a3b8;
  letter-spacing: 0.05em;
  font-weight: 600;
}

.stat-value {
  font-size: 0.95rem;
  font-weight: 700;
  color: #f1f5f9;
}

.header-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  align-items: center;
}

.btn-help {
  background: rgba(56, 189, 248, 0.15);
  border: 1px solid rgba(56, 189, 248, 0.4);
  color: #38bdf8;
  font-weight: 600;
  font-size: 0.88rem;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-help:hover {
  background: rgba(56, 189, 248, 0.25);
  transform: translateY(-1px);
}

.btn-download-app {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #e2e8f0;
  font-weight: 600;
  font-size: 0.88rem;
  padding: 8px 16px;
  border-radius: 8px;
  text-decoration: none;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
}

.btn-download-app:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.3);
}

/* Guia Tutorial */
.tutorial-card {
  padding: 1.5rem;
  border-radius: 16px;
  background: rgba(15, 23, 42, 0.7);
  border: 1px solid rgba(56, 189, 248, 0.2);
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.tutorial-title {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 700;
  color: #38bdf8;
}

.steps-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
}

.step-item {
  display: flex;
  gap: 0.75rem;
  background: rgba(30, 41, 59, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.05);
  padding: 1rem;
  border-radius: 10px;
}

.step-number {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #0284c7, #2563eb);
  color: #fff;
  font-weight: 700;
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.step-content strong {
  display: block;
  font-size: 0.9rem;
  color: #f1f5f9;
  margin-bottom: 4px;
}

.step-content p {
  margin: 0;
  font-size: 0.8rem;
  color: #94a3b8;
  line-height: 1.4;
}

.badge-online {
  color: #34d399;
  font-weight: 700;
}

.ini-tip-box {
  background: rgba(16, 185, 129, 0.1);
  border: 1px dashed rgba(16, 185, 129, 0.4);
  padding: 1rem 1.25rem;
  border-radius: 10px;
  display: flex;
  gap: 0.85rem;
  align-items: flex-start;
}

.tip-icon {
  font-size: 1.5rem;
}

.ini-tip-box strong {
  color: #34d399;
  font-size: 0.92rem;
}

.ini-tip-box p {
  margin: 4px 0 0;
  font-size: 0.84rem;
  color: #cbd5e1;
  line-height: 1.4;
}

.ini-tip-box code {
  background: rgba(0, 0, 0, 0.4);
  padding: 2px 6px;
  border-radius: 4px;
  color: #38bdf8;
  font-size: 0.8rem;
}

/* Test Panel */
.test-panel {
  padding: 1.25rem 1.5rem;
  border-radius: 14px;
  background: rgba(15, 23, 42, 0.65);
  border: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.test-title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: #f8fafc;
}

.test-desc {
  margin: 0;
  font-size: 0.85rem;
  color: #94a3b8;
}

.test-form {
  display: flex;
  gap: 1rem;
  align-items: flex-end;
  flex-wrap: wrap;
  margin-top: 4px;
}

.test-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.test-field label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #94a3b8;
}

.test-input {
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #f1f5f9;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 0.9rem;
  outline: none;
  min-width: 180px;
}

.test-input:focus {
  border-color: #38bdf8;
}

.btn-run-test {
  background: linear-gradient(135deg, #0284c7, #2563eb);
  color: #ffffff;
  font-weight: 600;
  font-size: 0.88rem;
  padding: 9px 18px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s ease;
}

.btn-run-test:hover:not(:disabled) {
  transform: translateY(-1px);
  filter: brightness(1.1);
}

.btn-run-test:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.test-feedback {
  margin-top: 6px;
  padding: 10px 14px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.feedback-success {
  background: rgba(16, 185, 129, 0.15);
  border: 1px solid rgba(16, 185, 129, 0.4);
  color: #34d399;
}

.feedback-error {
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.4);
  color: #f87171;
}

.feedback-main {
  font-weight: 700;
  font-size: 0.88rem;
}

.feedback-latency {
  font-size: 0.75rem;
  opacity: 0.8;
  font-weight: 500;
  margin-left: 4px;
}

.feedback-detail {
  font-size: 0.8rem;
  margin-top: 2px;
  opacity: 0.9;
}

/* Tabela */
.table-container {
  padding: 1.5rem;
  border-radius: 16px;
  background: rgba(15, 23, 42, 0.65);
  border: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.table-toolbar {
  display: flex;
  gap: 1rem;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
}

.search-box {
  position: relative;
  min-width: 280px;
  flex: 1;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.9rem;
  color: #64748b;
}

.search-input {
  width: 100%;
  padding: 8px 32px 8px 36px;
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  color: #f8fafc;
  font-size: 0.88rem;
  outline: none;
}

.search-input:focus {
  border-color: #38bdf8;
}

.btn-clear-search {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  font-size: 0.85rem;
}

.filter-chips {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.chip {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #94a3b8;
  font-size: 0.8rem;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.chip:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #e2e8f0;
}

.chip-active {
  background: rgba(56, 189, 248, 0.2);
  border: 1px solid rgba(56, 189, 248, 0.5);
  color: #38bdf8;
  font-weight: 600;
  font-size: 0.8rem;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
}

.table-stats-bar {
  font-size: 0.82rem;
  color: #94a3b8;
}

.table-responsive {
  overflow-x: auto;
}

.microsip-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.88rem;
}

.microsip-table th {
  text-align: left;
  padding: 10px 12px;
  background: rgba(30, 41, 59, 0.7);
  color: #94a3b8;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.microsip-table td {
  padding: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  vertical-align: middle;
}

.table-row:hover td {
  background: rgba(255, 255, 255, 0.02);
}

.ramal-badge {
  display: inline-block;
  background: rgba(56, 189, 248, 0.15);
  color: #38bdf8;
  border: 1px solid rgba(56, 189, 248, 0.3);
  font-family: monospace;
  font-weight: 700;
  font-size: 0.95rem;
  padding: 3px 8px;
  border-radius: 6px;
}

.collab-name {
  font-weight: 600;
  color: #f1f5f9;
}

.collab-dept {
  font-size: 0.78rem;
  color: #94a3b8;
  margin-top: 2px;
}

.code-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(30, 41, 59, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 0.85rem;
  color: #e2e8f0;
  cursor: pointer;
  transition: all 0.2s ease;
}

.code-pill:hover {
  background: rgba(56, 189, 248, 0.15);
  border-color: rgba(56, 189, 248, 0.4);
  color: #38bdf8;
}

.copy-hint {
  font-size: 0.72rem;
  opacity: 0.6;
}

.device-tag {
  font-size: 0.76rem;
  color: #94a3b8;
  background: rgba(255, 255, 255, 0.04);
  padding: 2px 6px;
  border-radius: 4px;
}

.row-actions {
  display: flex;
  gap: 6px;
  justify-content: flex-end;
  align-items: center;
}

.action-btn {
  border: none;
  font-size: 0.76rem;
  font-weight: 600;
  padding: 6px 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.btn-ini {
  background: rgba(16, 185, 129, 0.15);
  border: 1px solid rgba(16, 185, 129, 0.3);
  color: #34d399;
}

.btn-ini:hover {
  background: rgba(16, 185, 129, 0.25);
  transform: translateY(-1px);
}

.btn-copy {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #e2e8f0;
}

.btn-copy:hover {
  background: rgba(255, 255, 255, 0.15);
}

.btn-test {
  background: rgba(56, 189, 248, 0.12);
  border: 1px solid rgba(56, 189, 248, 0.3);
  color: #38bdf8;
}

.btn-test:hover:not(:disabled) {
  background: rgba(56, 189, 248, 0.22);
}

.btn-dial {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #94a3b8;
  padding: 6px 8px;
}

.btn-dial:hover {
  background: rgba(56, 189, 248, 0.2);
  color: #38bdf8;
}

.row-result {
  font-size: 0.75rem;
  margin-top: 4px;
  font-weight: 600;
}

.row-res-ok {
  color: #34d399;
}

.row-res-err {
  color: #f87171;
}

.empty-state {
  text-align: center;
  padding: 2.5rem !important;
  color: #64748b;
  font-size: 0.95rem;
}

.spinner {
  display: inline-block;
  width: 12px;
  height: 12px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: #fff;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.25s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
