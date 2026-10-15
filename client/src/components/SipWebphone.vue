<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useSipPhone } from '../composables/useSipPhone';
import { getSipPhones } from '../api';

const props = defineProps({
  contacts: {
    type: Array,
    default: () => []
  }
});

const {
  myExtension,
  myPassword,
  status,
  callStatus,
  errorMessage,
  targetNumber,
  remoteParty,
  formattedCallDuration,
  isMuted,
  isOnHold,
  isWebphoneOpen,
  pendingCallTarget,
  isConfigured,
  setMyExtension,
  clearMyExtension,
  makeCall,
  answerCall,
  rejectCall,
  hangupCall,
  toggleMute,
  toggleHold,
  sendDTMF,
  clearTargetNumber,
  backspaceTargetNumber,
  openMicroSipCall
} = useSipPhone();

const inputExt = ref('');
const inputPw = ref('');
const selectedExt = ref('');
const isEditingMyExt = ref(false);

// Telefones SIP cadastrados pelo administrador (aba MicroSIP do admin)
const sipPhones = ref([]);

onMounted(async () => {
  try {
    const data = await getSipPhones();
    sipPhones.value = Array.isArray(data) ? data.filter(p => p.active) : [];
  } catch (e) {
    console.error('Erro ao carregar telefones SIP:', e);
    return;
  }

  // Se o admin trocou a senha do telefone que este navegador usa, atualiza e reconecta
  const current = sipPhones.value.find(p => p.extension === myExtension.value);
  const currentPw = current && (current.password || `Ramal@${current.extension}`);
  if (current && currentPw !== myPassword.value) {
    setMyExtension(current.extension, currentPw);
  }
});

// Com um único telefone cadastrado, usa ele direto, sem tela de escolha
watch([isWebphoneOpen, sipPhones], ([open, phones]) => {
  if (open && !isConfigured.value && !isEditingMyExt.value && phones.length === 1) {
    handleUseSipPhone(phones[0]);
  }
});

function handleUseSipPhone(phone) {
  const targetToCall = pendingCallTarget.value;
  pendingCallTarget.value = '';
  setMyExtension(phone.extension, phone.password || `Ramal@${phone.extension}`, targetToCall);
  isEditingMyExt.value = false;
}

// Lista de ramais dos colaboradores a partir da lista do site
const availableRamais = computed(() => {
  const map = new Map();
  (props.contacts || []).forEach(c => {
    const raw = (c.phone || '').trim().replace(/\D/g, '');
    if (raw.length === 4 && !map.has(raw)) {
      map.set(raw, {
        extension: raw,
        label: `${raw} — ${c.name} (${c.department})`
      });
    }
  });
  return Array.from(map.values()).sort((a, b) => a.extension.localeCompare(b.extension));
});

function handleSaveMyExtension() {
  const ext = (selectedExt.value || inputExt.value || '').trim().replace(/\D/g, '');
  if (!ext) return;

  const targetToCall = pendingCallTarget.value;
  pendingCallTarget.value = '';
  const pw = inputPw.value.trim() || `Ramal@${ext}`;
  setMyExtension(ext, pw, targetToCall);
  isEditingMyExt.value = false;
  inputExt.value = '';
  inputPw.value = '';
  selectedExt.value = '';
}

function handleStartChangeExt() {
  isEditingMyExt.value = true;
  inputExt.value = myExtension.value || '';
  inputPw.value = myPassword.value || '';
}

const dialpadKeys = [
  { digit: '1', sub: '' },
  { digit: '2', sub: 'ABC' },
  { digit: '3', sub: 'DEF' },
  { digit: '4', sub: 'GHI' },
  { digit: '5', sub: 'JKL' },
  { digit: '6', sub: 'MNO' },
  { digit: '7', sub: 'PQRS' },
  { digit: '8', sub: 'TUV' },
  { digit: '9', sub: 'WXYZ' },
  { digit: '*', sub: '' },
  { digit: '0', sub: '+' },
  { digit: '#', sub: '' }
];

function handleKeyClick(digit) {
  sendDTMF(digit);
}

function handleKeyDown(e) {
  if (!isConfigured.value || isEditingMyExt.value) return;
  const key = e.key;
  if (/^[0-9*#]$/.test(key)) {
    sendDTMF(key);
  } else if (key === 'Backspace') {
    backspaceTargetNumber();
  } else if (key === 'Enter' && callStatus.value === 'idle') {
    makeCall();
  }
}
</script>

<template>
  <div class="sip-webphone-container" @keydown="handleKeyDown" tabindex="-1">
    <!-- Botão Flutuante quando Minimizado -->
    <transition name="fade">
      <button
        v-if="!isWebphoneOpen"
        class="sip-floating-btn"
        :class="{
          'sip-btn-in-call': callStatus === 'in-call',
          'sip-btn-ringing': callStatus === 'ringing',
          'sip-btn-registered': status === 'registered' && callStatus === 'idle'
        }"
        @click="isWebphoneOpen = true"
        title="Abrir Telefone / Ramal"
        type="button"
      >
        <span class="sip-btn-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
          </svg>
        </span>

        <span class="sip-btn-label">
          <span v-if="callStatus === 'in-call'" class="sip-badge-pulse">Em Chamada {{ formattedCallDuration }}</span>
          <span v-else-if="callStatus === 'ringing'" class="sip-badge-pulse sip-badge-ringing">Chamando!</span>
          <span v-else-if="callStatus === 'calling'" class="sip-badge-pulse">Discando...</span>
          <span v-else-if="status === 'registered'">Ramal: {{ myExtension }}</span>
          <span v-else-if="myExtension">Ramal: {{ myExtension }}</span>
          <span v-else>Telefone</span>
        </span>

        <span
          class="sip-status-dot"
          :class="{
            'dot-registered': status === 'registered',
            'dot-connecting': status === 'connecting',
            'dot-error': status === 'error' || status === 'registrationFailed' || status === 'disconnected'
          }"
        ></span>
      </button>
    </transition>

    <!-- Janela do Webphone quando Aberto -->
    <transition name="slide-up">
      <div v-if="isWebphoneOpen" class="sip-phone-card">
        <!-- Header -->
        <div class="sip-card-header">
          <div class="sip-header-info">
            <span class="sip-title-text">Telefone</span>
            <span
              class="sip-status-tag"
              :class="{
                'tag-registered': status === 'registered',
                'tag-connecting': status === 'connecting',
                'tag-error': status === 'error' || status === 'registrationFailed',
                'tag-disconnected': status === 'disconnected' || status === 'unconfigured'
              }"
            >
              <span class="status-pulse-dot"></span>
              <span v-if="status === 'registered'">Online ({{ myExtension }})</span>
              <span v-else-if="status === 'connecting'">Conectando...</span>
              <span v-else-if="myExtension">Offline ({{ myExtension }})</span>
              <span v-else>Sem Ramal</span>
            </span>
          </div>

          <div class="sip-header-actions">
            <button
              v-if="myExtension && !isEditingMyExt"
              type="button"
              class="sip-change-link"
              @click="handleStartChangeExt"
              title="Trocar meu ramal"
            >
              Trocar ramal
            </button>
            <button
              type="button"
              class="sip-close-btn"
              @click="isWebphoneOpen = false"
              title="Minimizar"
            >
              ✕
            </button>
          </div>
        </div>

        <!-- Banner de Mensagem -->
        <div v-if="errorMessage" class="sip-alert-bar">
          <span class="sip-alert-icon">⚠️</span>
          <span class="sip-alert-text">{{ errorMessage }}</span>
        </div>

        <!-- TELA 1: IDENTIFICAÇÃO DO MEU RAMAL (APENAS O NÚMERO DO RAMAL, SEM DADOS DE SERVIDOR OU SENHAS) -->
        <div v-if="!isConfigured || isEditingMyExt" class="sip-prompt-view">
          <div class="sip-prompt-icon">📞</div>
          <div class="sip-prompt-title">
            {{ isEditingMyExt ? 'Alterar meu Ramal' : 'Qual é o seu Ramal?' }}
          </div>
          <p class="sip-prompt-desc">
            Informe o número do seu ramal para poder realizar e receber ligações diretamente pelo site.
          </p>

          <!-- Telefones cadastrados pelo administrador -->
          <div v-if="sipPhones.length > 0" class="sip-field-group">
            <label class="sip-field-label">Telefones disponíveis:</label>
            <button
              v-for="p in sipPhones"
              :key="p.id"
              type="button"
              class="sip-phone-option"
              :class="{ 'sip-phone-option-current': p.extension === myExtension }"
              @click="handleUseSipPhone(p)"
            >
              <span>{{ p.label }}</span>
              <span class="sip-phone-option-ext">{{ p.extension }}</span>
            </button>
          </div>

          <div v-if="sipPhones.length > 0" class="sip-divider-text">ou use outro ramal</div>

          <!-- Opção 1: Selecionar na lista -->
          <div v-if="availableRamais.length > 0" class="sip-field-group">
            <label class="sip-field-label">Escolha seu ramal na lista:</label>
            <select v-model="selectedExt" class="sip-select" @change="inputExt = ''">
              <option value="">-- Selecione seu ramal --</option>
              <option
                v-for="r in availableRamais"
                :key="r.extension"
                :value="r.extension"
              >
                {{ r.label }}
              </option>
            </select>
          </div>

          <div v-if="availableRamais.length > 0" class="sip-divider-text">ou digite</div>

          <!-- Opção 2: Digitar número -->
          <div class="sip-field-group">
            <input
              type="text"
              v-model="inputExt"
              placeholder="Ex: 4001, 4049, 4055..."
              maxlength="4"
              class="sip-input-number"
              @input="selectedExt = ''"
              @keydown.enter="handleSaveMyExtension"
            />
          </div>

          <!-- Campo de Senha do Ramal -->
          <div class="sip-field-group" style="margin-top: 4px;">
            <label class="sip-field-label">Senha do ramal (opcional se for padrão):</label>
            <input
              type="password"
              v-model="inputPw"
              :placeholder="`Padrão: Ramal@${selectedExt || inputExt || '4001'}`"
              class="sip-input-password"
              @keydown.enter="handleSaveMyExtension"
            />
          </div>

          <div class="sip-prompt-actions">
            <button
              type="button"
              class="sip-btn-confirm"
              :disabled="!selectedExt && !inputExt"
              @click="handleSaveMyExtension"
            >
              {{ pendingCallTarget ? `Confirmar e Ligar para ${pendingCallTarget}` : 'Confirmar Ramal' }}
            </button>
            <button
              v-if="isEditingMyExt"
              type="button"
              class="sip-btn-cancel"
              @click="isEditingMyExt = false"
            >
              Cancelar
            </button>
          </div>
        </div>

        <!-- TELA 2: CHAMADA RECEBIDA -->
        <div v-else-if="callStatus === 'ringing'" class="sip-incoming-view">
          <div class="sip-incoming-avatar">
            <div class="sip-wave-ring"></div>
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
            </svg>
          </div>
          <div class="sip-incoming-title">Chamada Recebida</div>
          <div class="sip-caller-name">{{ remoteParty.name }}</div>
          <div class="sip-caller-number">{{ remoteParty.number }}</div>

          <div class="sip-incoming-buttons">
            <button type="button" class="sip-btn-answer" @click="answerCall">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
              </svg>
              Atender
            </button>
            <button type="button" class="sip-btn-reject" @click="rejectCall">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
              Recusar
            </button>
          </div>
        </div>

        <!-- TELA 3: CHAMADA EM ANDAMENTO OU DISCAGEM -->
        <div v-else-if="callStatus === 'in-call' || callStatus === 'calling' || callStatus === 'ended' || callStatus === 'failed'" class="sip-active-call-view">
          <div class="sip-call-header">
            <span v-if="callStatus === 'calling'" class="sip-call-status-badge calling">Chamando...</span>
            <span v-else-if="callStatus === 'in-call'" class="sip-call-status-badge incall">Em Chamada</span>
            <span v-else-if="callStatus === 'ended'" class="sip-call-status-badge ended">Encerrada</span>
            <span v-else-if="callStatus === 'failed'" class="sip-call-status-badge failed">Não Atendida</span>

            <div class="sip-call-target-name">{{ remoteParty.name || 'Ramal ' + remoteParty.number }}</div>
            <div class="sip-call-target-number">{{ remoteParty.number }}</div>

            <div v-if="callStatus === 'in-call'" class="sip-call-timer">
              ⏱️ {{ formattedCallDuration }}
            </div>
          </div>

          <!-- Controles de chamada -->
          <div class="sip-call-controls" v-if="callStatus === 'in-call'">
            <button
              type="button"
              class="sip-ctrl-btn"
              :class="{ 'ctrl-active': isMuted }"
              @click="toggleMute"
              :title="isMuted ? 'Desativar Mudo' : 'Ativar Mudo'"
            >
              <span v-if="isMuted">🔇</span>
              <span v-else>🎤</span>
              <span class="ctrl-label">{{ isMuted ? 'Mudo (Ativo)' : 'Mudo' }}</span>
            </button>

            <button
              type="button"
              class="sip-ctrl-btn"
              :class="{ 'ctrl-active': isOnHold }"
              @click="toggleHold"
              :title="isOnHold ? 'Retomar Chamada' : 'Colocar em Espera'"
            >
              <span v-if="isOnHold">▶️</span>
              <span v-else>⏸️</span>
              <span class="ctrl-label">{{ isOnHold ? 'Em Espera' : 'Espera' }}</span>
            </button>
          </div>

          <!-- Teclado DTMF na chamada -->
          <div class="sip-dtmf-container" v-if="callStatus === 'in-call'">
            <div class="sip-dtmf-title">Digitar opções (URA)</div>
            <div class="sip-dtmf-grid">
              <button
                v-for="k in ['1','2','3','4','5','6','7','8','9','*','0','#']"
                :key="k"
                type="button"
                class="sip-dtmf-btn"
                @click="sendDTMF(k)"
              >
                {{ k }}
              </button>
            </div>
          </div>

          <!-- Botão Desligar -->
          <div class="sip-call-bottom-action">
            <button type="button" class="sip-btn-hangup" @click="hangupCall">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="transform: rotate(135deg)">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
              </svg>
              Desligar
            </button>
          </div>
        </div>

        <!-- TELA 4: DISCADOR LIMPO (PADRÃO) -->
        <div v-else class="sip-dialer-view">
          <!-- Campo para digitar o ramal que deseja chamar -->
          <div class="sip-display-row">
            <input
              type="text"
              v-model="targetNumber"
              class="sip-number-input"
              placeholder="Digite o ramal..."
              autofocus
            />
            <button
              v-if="targetNumber"
              type="button"
              class="sip-backspace-btn"
              @click="backspaceTargetNumber"
              title="Apagar dígito"
            >
              ⌫
            </button>
            <button
              v-if="targetNumber"
              type="button"
              class="sip-clear-btn"
              @click="clearTargetNumber"
              title="Limpar visor"
            >
              C
            </button>
          </div>

          <!-- Teclado Numérico -->
          <div class="sip-dialpad-grid">
            <button
              v-for="k in dialpadKeys"
              :key="k.digit"
              type="button"
              class="sip-key-btn"
              @click="handleKeyClick(k.digit)"
            >
              <span class="sip-key-digit">{{ k.digit }}</span>
              <span v-if="k.sub" class="sip-key-sub">{{ k.sub }}</span>
            </button>
          </div>

          <!-- Botão Ligar -->
          <div class="sip-dialer-actions">
            <button
              type="button"
              class="sip-call-btn"
              :disabled="!targetNumber.trim()"
              @click="makeCall(targetNumber)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
              </svg>
              <span>Ligar</span>
            </button>
            <button
              v-if="targetNumber.trim()"
              type="button"
              class="sip-microsip-btn"
              @click="openMicroSipCall(targetNumber)"
              title="Discar usando o aplicativo MicroSIP do computador"
            >
              📞 Discar no MicroSIP
            </button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.sip-webphone-container {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 9999;
  font-family: inherit;
  color: #f1f5f9;
  outline: none;
}

/* Botão Flutuante */
.sip-floating-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 18px;
  background: rgba(15, 23, 42, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 9999px;
  color: #fff;
  cursor: pointer;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 0 15px rgba(56, 189, 248, 0.2);
  backdrop-filter: blur(12px);
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.sip-floating-btn:hover {
  transform: translateY(-2px);
  border-color: rgba(56, 189, 248, 0.4);
  box-shadow: 0 14px 28px -4px rgba(0, 0, 0, 0.6), 0 0 20px rgba(56, 189, 248, 0.35);
}

.sip-btn-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #38bdf8;
}

.sip-floating-btn.sip-btn-registered .sip-btn-icon {
  color: #10b981;
}

.sip-floating-btn.sip-btn-in-call {
  background: rgba(16, 185, 129, 0.9);
  border-color: #34d399;
  animation: pulse-border 2s infinite;
}

.sip-floating-btn.sip-btn-ringing {
  background: rgba(239, 68, 68, 0.95);
  border-color: #f87171;
  animation: shake 0.6s infinite;
}

.sip-btn-label {
  font-size: 0.875rem;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.sip-status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #94a3b8;
}

.dot-registered {
  background: #10b981;
  box-shadow: 0 0 8px #10b981;
}

.dot-connecting {
  background: #f59e0b;
  box-shadow: 0 0 8px #f59e0b;
}

.dot-error {
  background: #ef4444;
}

/* Card do Telefone */
.sip-phone-card {
  width: 320px;
  background: rgba(15, 23, 42, 0.96);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 20px;
  box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.75), 0 0 25px rgba(56, 189, 248, 0.15);
  backdrop-filter: blur(18px);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* Header */
.sip-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: rgba(30, 41, 59, 0.6);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.sip-header-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sip-title-text {
  font-size: 0.9rem;
  font-weight: 700;
  color: #f8fafc;
}

.sip-status-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.7rem;
  padding: 2px 7px;
  border-radius: 9999px;
  background: rgba(148, 163, 184, 0.15);
  color: #94a3b8;
}

.status-pulse-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.tag-registered {
  background: rgba(16, 185, 129, 0.15);
  color: #34d399;
}

.tag-connecting {
  background: rgba(245, 158, 11, 0.15);
  color: #fbbf24;
}

.tag-error {
  background: rgba(239, 68, 68, 0.15);
  color: #f87171;
}

.tag-disconnected {
  background: rgba(148, 163, 184, 0.15);
  color: #cbd5e1;
}

.sip-header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sip-change-link {
  background: transparent;
  border: none;
  color: #38bdf8;
  font-size: 0.72rem;
  cursor: pointer;
  text-decoration: underline;
  padding: 2px;
}

.sip-close-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s;
}

.sip-close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

/* Alert bar */
.sip-alert-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: rgba(239, 68, 68, 0.2);
  border-bottom: 1px solid rgba(239, 68, 68, 0.3);
  font-size: 0.75rem;
  color: #fca5a5;
}

/* Prompt View (Qual é o seu ramal?) */
.sip-prompt-view {
  padding: 22px 18px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 12px;
}

.sip-prompt-icon {
  font-size: 2.2rem;
}

.sip-prompt-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: #fff;
}

.sip-prompt-desc {
  font-size: 0.78rem;
  color: #94a3b8;
  line-height: 1.4;
  margin: 0;
}

.sip-field-group {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 6px;
  text-align: left;
}

.sip-field-label {
  font-size: 0.72rem;
  color: #cbd5e1;
  font-weight: 600;
}

.sip-select {
  width: 100%;
  padding: 8px 10px;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 10px;
  color: #fff;
  font-size: 0.82rem;
  outline: none;
  cursor: pointer;
}

.sip-select option {
  background: #0f172a;
  color: #fff;
}

.sip-phone-option {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 9px 12px;
  background: rgba(16, 185, 129, 0.12);
  border: 1px solid rgba(16, 185, 129, 0.35);
  border-radius: 10px;
  color: #fff;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.sip-phone-option:hover {
  background: rgba(16, 185, 129, 0.25);
}

.sip-phone-option-current {
  border-color: #34d399;
}

.sip-phone-option-ext {
  font-family: monospace;
  color: #34d399;
}

.sip-divider-text {
  font-size: 0.7rem;
  color: #64748b;
  font-weight: 600;
}

.sip-input-number {
  width: 100%;
  padding: 10px;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 10px;
  color: #fff;
  font-size: 1.15rem;
  font-weight: 700;
  text-align: center;
  letter-spacing: 0.1em;
  outline: none;
  box-sizing: border-box;
}

.sip-input-number:focus {
  border-color: #38bdf8;
}

.sip-input-password {
  width: 100%;
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 10px;
  color: #fff;
  font-size: 0.95rem;
  outline: none;
  box-sizing: border-box;
  text-align: center;
}

.sip-input-password:focus {
  border-color: #38bdf8;
}

.sip-prompt-actions {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 4px;
}

.sip-btn-confirm {
  width: 100%;
  padding: 10px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border: none;
  border-radius: 10px;
  color: #fff;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(16, 185, 129, 0.35);
  transition: all 0.2s;
}

.sip-btn-confirm:hover:not(:disabled) {
  filter: brightness(1.1);
}

.sip-btn-confirm:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.sip-btn-cancel {
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 0.78rem;
  cursor: pointer;
  padding: 4px;
}

/* Dialer view */
.sip-dialer-view {
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.sip-display-row {
  display: flex;
  align-items: center;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 4px 8px;
}

.sip-number-input {
  flex: 1;
  background: transparent;
  border: none;
  color: #fff;
  font-size: 1.25rem;
  font-weight: 600;
  text-align: center;
  letter-spacing: 0.05em;
  padding: 6px;
  outline: none;
  min-width: 0;
}

.sip-backspace-btn,
.sip-clear-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 6px;
  font-size: 0.9rem;
  transition: color 0.15s;
}

.sip-backspace-btn:hover,
.sip-clear-btn:hover {
  color: #ef4444;
}

/* Dialpad Grid */
.sip-dialpad-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.sip-key-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 8px 0;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  color: #f8fafc;
  cursor: pointer;
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  user-select: none;
}

.sip-key-btn:hover {
  background: rgba(56, 189, 248, 0.15);
  border-color: rgba(56, 189, 248, 0.3);
  transform: translateY(-1px);
}

.sip-key-btn:active {
  transform: scale(0.96);
  background: rgba(56, 189, 248, 0.3);
}

.sip-key-digit {
  font-size: 1.15rem;
  font-weight: 700;
  line-height: 1.1;
}

.sip-key-sub {
  font-size: 0.55rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  color: #64748b;
  margin-top: 1px;
}

.sip-dialer-actions {
  display: flex;
}

.sip-call-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border: none;
  border-radius: 12px;
  color: #fff;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(16, 185, 129, 0.35);
  transition: all 0.2s;
}

.sip-call-btn:hover:not(:disabled) {
  filter: brightness(1.1);
  transform: translateY(-1px);
}

.sip-call-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  filter: grayscale(0.5);
}

/* Incoming Call View */
.sip-incoming-view {
  padding: 24px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 12px;
}

.sip-incoming-avatar {
  position: relative;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: #3b82f6;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sip-wave-ring {
  position: absolute;
  inset: -6px;
  border-radius: 50%;
  border: 2px solid #3b82f6;
  animation: ping 1.4s cubic-bezier(0, 0, 0.2, 1) infinite;
}

.sip-incoming-title {
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #38bdf8;
  font-weight: 600;
}

.sip-caller-name {
  font-size: 1.2rem;
  font-weight: 700;
  color: #fff;
}

.sip-caller-number {
  font-size: 0.85rem;
  color: #94a3b8;
}

.sip-incoming-buttons {
  display: flex;
  gap: 12px;
  width: 100%;
  margin-top: 8px;
}

.sip-btn-answer,
.sip-btn-reject {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px;
  border: none;
  border-radius: 12px;
  font-weight: 700;
  font-size: 0.88rem;
  cursor: pointer;
  transition: transform 0.15s;
}

.sip-btn-answer {
  background: #10b981;
  color: #fff;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.35);
}

.sip-btn-reject {
  background: #ef4444;
  color: #fff;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.35);
}

.sip-btn-answer:hover,
.sip-btn-reject:hover {
  transform: translateY(-2px);
}

/* Active Call View */
.sip-active-call-view {
  padding: 18px 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.sip-call-header {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.sip-call-status-badge {
  font-size: 0.7rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 9999px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.sip-call-status-badge.calling {
  background: rgba(245, 158, 11, 0.2);
  color: #fbbf24;
}

.sip-call-status-badge.incall {
  background: rgba(16, 185, 129, 0.2);
  color: #34d399;
}

.sip-call-status-badge.ended,
.sip-call-status-badge.failed {
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
}

.sip-call-target-name {
  font-size: 1.15rem;
  font-weight: 700;
  color: #fff;
  margin-top: 4px;
}

.sip-call-target-number {
  font-size: 0.85rem;
  color: #94a3b8;
}

.sip-call-timer {
  font-size: 0.95rem;
  font-weight: 700;
  color: #38bdf8;
  font-variant-numeric: tabular-nums;
  margin-top: 2px;
}

.sip-call-controls {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.sip-ctrl-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  color: #cbd5e1;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.sip-ctrl-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.sip-ctrl-btn.ctrl-active {
  background: rgba(239, 68, 68, 0.25);
  border-color: #f87171;
  color: #fca5a5;
}

.ctrl-label {
  font-size: 0.65rem;
  font-weight: 600;
}

.sip-dtmf-container {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.sip-dtmf-title {
  font-size: 0.65rem;
  color: #64748b;
  text-align: center;
}

.sip-dtmf-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 4px;
}

.sip-dtmf-btn {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  color: #e2e8f0;
  padding: 4px 0;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
}

.sip-dtmf-btn:active {
  background: rgba(56, 189, 248, 0.3);
}

.sip-call-bottom-action {
  margin-top: 4px;
}

.sip-btn-hangup {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px;
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  border: none;
  border-radius: 12px;
  color: #fff;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(239, 68, 68, 0.35);
  transition: transform 0.15s;
}

.sip-btn-hangup:hover {
  transform: translateY(-1px);
}

/* Animations */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@keyframes pulse-border {
  0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.6); }
  70% { box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
  100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
}

@keyframes ping {
  75%, 100% {
    transform: scale(1.4);
    opacity: 0;
  }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-3px); }
  40%, 80% { transform: translateX(3px); }
}

.sip-microsip-btn {
  margin-top: 8px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px dashed rgba(255, 255, 255, 0.2);
  color: #94a3b8;
  font-size: 0.78rem;
  font-weight: 500;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.sip-microsip-btn:hover {
  background: rgba(56, 189, 248, 0.1);
  border-color: rgba(56, 189, 248, 0.5);
  color: #38bdf8;
}

@media (max-width: 480px) {
  .sip-webphone-container {
    bottom: 16px;
    right: 16px;
    left: 16px;
  }
  .sip-phone-card {
    width: 100%;
  }
}
</style>
