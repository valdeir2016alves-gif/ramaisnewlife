<script setup>
import { ref, onMounted } from 'vue';

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['close', 'open-radio']);

function handleOpenRadio() {
  emit('open-radio');
}

function handleClose() {
  emit('close');
}
</script>

<template>
  <transition name="announcement-fade">
    <div v-if="isOpen" class="announcement-overlay" @click.self="handleClose">
      <div class="announcement-card glass" @click.stop>
        
        <!-- Botão Fechar -->
        <button class="close-btn" @click="handleClose" title="Fechar aviso (Esc)">✕</button>

        <!-- Banner Visual Superior com Ondas e Ícone -->
        <div class="card-banner">
          <div class="radio-graphic">
            <span class="radio-emoji">📻</span>
            <div class="sound-waves">
              <span class="bar bar1"></span>
              <span class="bar bar2"></span>
              <span class="bar bar3"></span>
              <span class="bar bar4"></span>
              <span class="bar bar5"></span>
            </div>
          </div>
          <span class="badge-new">✨ NOVIDADE NO PORTAL</span>
        </div>

        <!-- Conteúdo do Card -->
        <div class="card-body">
          <h3 class="card-title">Opção de Rádios Online Adicionada!</h3>
          <p class="card-description">
            Agora você pode sintonizar suas rádios favoritas ao vivo diretamente pelo nosso diretório de ramais enquanto realiza suas atividades diárias.
          </p>

          <!-- Destaques das Rádios Disponíveis -->
          <div class="radio-highlights">
            <span class="station-tag">📻 Atlântida FM</span>
            <span class="station-tag">⚽ Rádio Gaúcha</span>
            <span class="station-tag">🎼 Antena 1</span>
            <span class="station-tag">🎧 Metropolitana</span>
            <span class="station-tag">+ Milhares do Brasil</span>
          </div>

          <div class="tip-box">
            <span class="tip-icon">💡</span>
            <span class="tip-text">
              Para ouvir ou trocar de estação a qualquer momento, basta clicar no botão <strong>Rádios Online</strong> no topo da página.
            </span>
          </div>

          <!-- Botões de Ação -->
          <div class="card-actions">
            <button class="btn-primary" @click="handleOpenRadio">
              <span class="play-icon">▶</span>
              <span>Ouvir Rádios Agora</span>
            </button>
            <button class="btn-secondary" @click="handleClose">
              Entendido
            </button>
          </div>
        </div>

      </div>
    </div>
  </transition>
</template>

<style scoped>
.announcement-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 99999;
  padding: 1rem;
}

.announcement-card {
  width: 100%;
  max-width: 480px;
  background: var(--bg-color);
  border: 1px solid rgba(72, 202, 228, 0.4);
  border-radius: 20px;
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.5), 0 0 25px rgba(72, 202, 228, 0.2);
  overflow: hidden;
  position: relative;
  animation: cardPop 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes cardPop {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.close-btn {
  position: absolute;
  top: 14px;
  right: 14px;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid var(--card-border);
  color: var(--text-main);
  width: 32px;
  height: 32px;
  border-radius: 50%;
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
  transition: all 0.2s;
}

.close-btn:hover {
  background: rgba(239, 68, 68, 0.3);
  border-color: #ef4444;
  color: #ef4444;
  transform: rotate(90deg);
}

/* Banner Superior */
.card-banner {
  background: linear-gradient(135deg, rgba(12, 30, 62, 0.95) 0%, rgba(20, 50, 95, 0.9) 100%);
  border-bottom: 1px solid var(--card-border);
  padding: 2rem 1.5rem 1.25rem 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.8rem;
  position: relative;
  overflow: hidden;
}

[data-theme="light"] .card-banner {
  background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%);
}

.radio-graphic {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.radio-emoji {
  font-size: 3rem;
  filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.4));
  animation: gentleBob 2.5s ease-in-out infinite;
}

@keyframes gentleBob {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}

.sound-waves {
  display: flex;
  align-items: flex-end;
  gap: 4px;
  height: 28px;
}

.bar {
  width: 5px;
  background: var(--primary-color);
  border-radius: 3px;
  animation: soundBars 1.2s ease-in-out infinite alternate;
}

[data-theme="light"] .bar {
  background: #ffffff;
}

.bar1 { height: 40%; animation-delay: 0.1s; }
.bar2 { height: 90%; animation-delay: 0.3s; }
.bar3 { height: 60%; animation-delay: 0.2s; }
.bar4 { height: 100%; animation-delay: 0.4s; }
.bar5 { height: 50%; animation-delay: 0.25s; }

@keyframes soundBars {
  0% { height: 20%; opacity: 0.5; }
  100% { height: 100%; opacity: 1; }
}

.badge-new {
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  background: rgba(72, 202, 228, 0.2);
  border: 1px solid var(--primary-color);
  color: var(--primary-color);
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
}

[data-theme="light"] .badge-new {
  background: rgba(255, 255, 255, 0.2);
  border-color: #ffffff;
  color: #ffffff;
}

/* Corpo do Card */
.card-body {
  padding: 1.5rem 1.75rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.card-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-main);
  text-align: center;
  margin: 0;
  line-height: 1.3;
}

.card-description {
  font-size: 0.88rem;
  color: var(--text-muted);
  text-align: center;
  line-height: 1.5;
  margin: 0;
}

.radio-highlights {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  justify-content: center;
}

.station-tag {
  font-size: 0.75rem;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--card-border);
  color: var(--text-main);
  padding: 0.25rem 0.6rem;
  border-radius: 12px;
}

[data-theme="light"] .station-tag {
  background: #f1f5f9;
  border-color: #cbd5e1;
  color: #1e293b;
}

.tip-box {
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  background: rgba(72, 202, 228, 0.08);
  border: 1px solid rgba(72, 202, 228, 0.25);
  border-radius: 10px;
  padding: 0.75rem 0.9rem;
  font-size: 0.82rem;
  color: var(--text-main);
  line-height: 1.4;
}

[data-theme="light"] .tip-box {
  background: #eff6ff;
  border-color: #bfdbfe;
  color: #1e3a8a;
}

.tip-icon {
  font-size: 1.1rem;
  line-height: 1;
}

.tip-text strong {
  color: var(--primary-color);
}

/* Ações */
.card-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 0.25rem;
}

.btn-primary {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background: linear-gradient(135deg, #00b4d8 0%, #0077b6 100%);
  color: #ffffff;
  border: none;
  border-radius: 10px;
  padding: 0.75rem 1rem;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(0, 180, 216, 0.35);
  transition: all 0.2s ease;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 180, 216, 0.5);
  filter: brightness(1.1);
}

.play-icon {
  font-size: 0.8rem;
}

.btn-secondary {
  background: transparent;
  border: 1px solid var(--card-border);
  color: var(--text-muted);
  border-radius: 10px;
  padding: 0.75rem 1.25rem;
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-secondary:hover {
  color: var(--text-main);
  border-color: var(--text-muted);
}

/* Transições */
.announcement-fade-enter-active,
.announcement-fade-leave-active {
  transition: opacity 0.25s ease;
}

.announcement-fade-enter-from,
.announcement-fade-leave-to {
  opacity: 0;
}
</style>
