<template>
  <div v-if="isOpen" class="modal-overlay" @click.self="$emit('close')">
    <div class="radio-modal glass" @click.stop>
      <!-- Header -->
      <div class="modal-header">
        <div class="header-title-box">
          <div class="title-row">
            <span class="live-dot"></span>
            <h3>Rádios Online</h3>
            <span class="api-badge">Radio Browser API</span>
          </div>
          <p class="subtitle">Sintonize milhares de rádios ao vivo do Brasil e do mundo</p>
        </div>
        <button class="close-btn" @click="$emit('close')" title="Fechar">✕</button>
      </div>

      <!-- Search & Filters -->
      <div class="search-filters-box">
        <div class="search-row">
          <span class="search-icon">🔍</span>
          <input
            type="text"
            v-model="searchInput"
            @input="handleSearch"
            placeholder="Buscar rádio (ex: Metropolitana, Gaúcha, Atlântida, Antena 1, Jovem Pan...)"
            class="search-input"
          />
          <button v-if="searchInput" @click="clearSearch" class="clear-search-btn">✕</button>
        </div>

        <!-- Filter Chips -->
        <div class="filter-chips">
          <button
            v-for="chip in filterChips"
            :key="chip.id"
            @click="setFilter(chip.id)"
            :class="['chip-btn', { active: activeFilter === chip.id && !searchInput }]"
          >
            {{ chip.label }}
          </button>
        </div>
      </div>

      <!-- Stations List Area -->
      <div class="stations-container">
        <div v-if="isFetchingStations" class="loading-state">
          <div class="spinner"></div>
          <p>Conectando à Radio Browser API...</p>
        </div>

        <div v-else-if="stations.length === 0" class="empty-state">
          <p>Nenhuma estação encontrada para a sua busca.</p>
          <button @click="resetToTop" class="btn-retry">Ver mais ouvidas</button>
        </div>

        <div v-else class="stations-grid">
          <div
            v-for="st in stations"
            :key="st.url_resolved"
            @click="playStation(st)"
            :class="[
              'station-card',
              { active: currentStation?.url_resolved === st.url_resolved && isPlaying }
            ]"
          >
            <!-- Logo / Favicon -->
            <div class="station-logo-box">
              <img
                v-if="st.favicon"
                :src="st.favicon"
                :alt="st.name"
                class="station-logo"
                @error="(e) => (e.target.style.display = 'none')"
              />
              <div v-else class="station-icon-fallback">📻</div>
            </div>

            <!-- Details -->
            <div class="station-info">
              <div class="station-title">{{ st.name }}</div>
              <div class="station-meta">
                <span class="station-state">{{ st.state }}</span>
                <span v-if="st.codec" class="station-codec">{{ st.codec }}</span>
              </div>
            </div>

            <!-- Play / State Action -->
            <div class="station-action">
              <template v-if="currentStation?.url_resolved === st.url_resolved">
                <div v-if="isLoading" class="mini-spinner"></div>
                <div v-else-if="isPlaying" class="equalizer-bars">
                  <span class="bar bar-1"></span>
                  <span class="bar bar-2"></span>
                  <span class="bar bar-3"></span>
                </div>
                <button v-else class="play-btn">▶</button>
              </template>
              <button v-else class="play-btn">▶</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Player Bar (Bottom) -->
      <div class="player-bar">
        <div class="current-track">
          <div class="player-logo-wrap">
            <img
              v-if="currentStation?.favicon"
              :src="currentStation.favicon"
              class="current-logo"
              @error="(e) => (e.target.style.display = 'none')"
            />
            <span v-else class="current-logo-fallback">📻</span>
          </div>

          <div class="current-meta">
            <div class="current-name">{{ currentStation?.name || 'Selecione uma Rádio' }}</div>
            <div class="current-status">
              <span v-if="isLoading" class="status-loading">Conectando ao vivo...</span>
              <span v-else-if="isPlaying" class="status-live">● TRANSMISSÃO AO VIVO</span>
              <span v-else class="status-idle">Pronto para reproduzir</span>
              <span v-if="streamError" class="status-error">{{ streamError }}</span>
            </div>
          </div>
        </div>

        <div class="player-controls">
          <!-- Play / Pause -->
          <button
            @click="togglePlay"
            :disabled="!currentStation"
            class="main-play-btn"
            :title="isPlaying ? 'Pausar' : 'Reproduzir'"
          >
            <span v-if="isLoading" class="spinner-small"></span>
            <span v-else-if="isPlaying">⏸</span>
            <span v-else>▶</span>
          </button>

          <!-- Volume Controls -->
          <div class="volume-box">
            <button @click="toggleMute" class="mute-btn" title="Mutar / Desmutar">
              <span v-if="isMuted || volume === 0">🔇</span>
              <span v-else-if="volume < 0.5">🔉</span>
              <span v-else>🔊</span>
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              :value="isMuted ? 0 : volume"
              @input="(e) => setVolume(parseFloat(e.target.value))"
              class="volume-slider"
              title="Volume"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRadio } from '../composables/useRadio';

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  }
});

defineEmits(['close']);

const {
  isPlaying,
  isLoading,
  isMuted,
  streamError,
  currentStation,
  volume,
  stations,
  isFetchingStations,
  activeFilter,
  searchQuery,
  loadStations,
  playStation,
  togglePlay,
  setVolume,
  toggleMute
} = useRadio();

const searchInput = ref('');
let searchTimer = null;

const filterChips = [
  { id: 'top', label: '🔥 Mais Ouvidas' },
  { id: 'rs', label: '📍 Rio Grande do Sul' },
  { id: 'sp', label: '📍 São Paulo' },
  { id: 'pop', label: '🎵 Pop / Hits' },
  { id: 'rock', label: '🎸 Rock' },
  { id: 'sertanejo', label: '🤠 Sertanejo' },
  { id: 'news', label: '📰 Notícias' }
];

function handleSearch() {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    searchQuery.value = searchInput.value;
    loadStations({ query: searchInput.value });
  }, 400);
}

function clearSearch() {
  searchInput.value = '';
  searchQuery.value = '';
  loadStations({ query: '', filter: activeFilter.value });
}

function setFilter(id) {
  searchInput.value = '';
  searchQuery.value = '';
  activeFilter.value = id;
  loadStations({ filter: id, query: '' });
}

function resetToTop() {
  setFilter('top');
}

onMounted(() => {
  if (stations.value.length === 0) {
    loadStations({ filter: 'top' });
  }
});

watch(
  () => props.isOpen,
  (open) => {
    if (open && stations.value.length === 0) {
      loadStations({ filter: activeFilter.value });
    }
  }
);
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  z-index: 99999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.radio-modal {
  width: 100%;
  max-width: 680px;
  background: rgba(15, 23, 42, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 16px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  max-height: 88vh;
  animation: modalIn 0.25s ease-out;
}

:global([data-theme="light"]) .radio-modal {
  background: #ffffff;
  border-color: #cbd5e1;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
}

@keyframes modalIn {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

/* Header */
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 1.25rem 1.5rem 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

:global([data-theme="light"]) .modal-header {
  border-bottom-color: #f1f5f9;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.title-row h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: #fff;
}

:global([data-theme="light"]) .title-row h3 {
  color: #0f172a;
}

.live-dot {
  width: 10px;
  height: 10px;
  background: #f43f5e;
  border-radius: 50%;
  box-shadow: 0 0 10px #f43f5e;
  animation: pulseLive 1.5s infinite;
}

@keyframes pulseLive {
  0% {
    transform: scale(0.95);
    opacity: 0.8;
  }
  50% {
    transform: scale(1.2);
    opacity: 1;
  }
  100% {
    transform: scale(0.95);
    opacity: 0.8;
  }
}

.api-badge {
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: rgba(56, 189, 248, 0.15);
  color: #38bdf8;
  border: 1px solid rgba(56, 189, 248, 0.3);
  padding: 0.15rem 0.45rem;
  border-radius: 4px;
  font-weight: 600;
}

.subtitle {
  margin: 0.25rem 0 0;
  font-size: 0.82rem;
  color: #94a3b8;
}

.close-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  transition: all 0.2s;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

/* Search and Filters */
.search-filters-box {
  padding: 1rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

:global([data-theme="light"]) .search-filters-box {
  border-bottom-color: #f1f5f9;
}

.search-row {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 0.85rem;
  font-size: 0.95rem;
  color: #64748b;
}

.search-input {
  width: 100%;
  padding: 0.65rem 2.2rem 0.65rem 2.4rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  color: #fff;
  font-size: 0.88rem;
  outline: none;
  transition: all 0.2s;
}

.search-input:focus {
  border-color: #38bdf8;
  background: rgba(255, 255, 255, 0.08);
}

:global([data-theme="light"]) .search-input {
  background: #f8fafc;
  border-color: #cbd5e1;
  color: #0f172a;
}

:global([data-theme="light"]) .search-input:focus {
  border-color: #0284c7;
  background: #fff;
}

.clear-search-btn {
  position: absolute;
  right: 0.75rem;
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 0.2rem;
  font-size: 0.85rem;
}

.filter-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.chip-btn {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #94a3b8;
  padding: 0.25rem 0.65rem;
  border-radius: 20px;
  font-size: 0.78rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.chip-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.chip-btn.active {
  background: rgba(56, 189, 248, 0.2);
  border-color: #38bdf8;
  color: #38bdf8;
  font-weight: 600;
}

:global([data-theme="light"]) .chip-btn {
  background: #f1f5f9;
  border-color: #e2e8f0;
  color: #475569;
}

:global([data-theme="light"]) .chip-btn.active {
  background: #e0f2fe;
  border-color: #0284c7;
  color: #0369a1;
}

/* Stations Container */
.stations-container {
  flex: 1;
  overflow-y: auto;
  padding: 1rem 1.5rem;
  min-height: 250px;
  max-height: 380px;
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 220px;
  color: #94a3b8;
  gap: 0.75rem;
  font-size: 0.9rem;
}

.btn-retry {
  background: rgba(56, 189, 248, 0.2);
  border: 1px solid #38bdf8;
  color: #38bdf8;
  padding: 0.4rem 1rem;
  border-radius: 6px;
  font-size: 0.82rem;
  cursor: pointer;
}

.stations-grid {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.station-card {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 0.65rem 0.85rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.station-card:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(56, 189, 248, 0.4);
  transform: translateY(-1px);
}

.station-card.active {
  background: rgba(56, 189, 248, 0.12);
  border-color: #38bdf8;
  box-shadow: 0 0 15px rgba(56, 189, 248, 0.2);
}

:global([data-theme="light"]) .station-card {
  background: #f8fafc;
  border-color: #e2e8f0;
}

:global([data-theme="light"]) .station-card:hover {
  background: #f1f5f9;
  border-color: #0284c7;
}

:global([data-theme="light"]) .station-card.active {
  background: #e0f2fe;
  border-color: #0284c7;
}

.station-logo-box {
  width: 38px;
  height: 38px;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
}

.station-logo {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.station-icon-fallback {
  font-size: 1.25rem;
}

.station-info {
  flex: 1;
  min-width: 0;
}

.station-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

:global([data-theme="light"]) .station-title {
  color: #0f172a;
}

.station-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.2rem;
  font-size: 0.74rem;
  color: #94a3b8;
}

.station-codec {
  background: rgba(255, 255, 255, 0.08);
  padding: 0.1rem 0.35rem;
  border-radius: 4px;
  font-size: 0.68rem;
  text-transform: uppercase;
}

:global([data-theme="light"]) .station-codec {
  background: #e2e8f0;
  color: #334155;
}

.station-action {
  flex-shrink: 0;
}

.play-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 0.75rem;
  transition: all 0.2s;
}

.station-card:hover .play-btn {
  background: #38bdf8;
  color: #0f172a;
  border-color: #38bdf8;
}

/* Equalizer Bars Animation */
.equalizer-bars {
  display: flex;
  align-items: flex-end;
  gap: 2.5px;
  height: 18px;
  padding: 0 4px;
}

.bar {
  width: 3px;
  background: #38bdf8;
  border-radius: 2px;
  animation: bounce 0.8s ease-in-out infinite alternate;
}

.bar-1 {
  height: 60%;
  animation-delay: 0.1s;
}

.bar-2 {
  height: 100%;
  animation-delay: 0.3s;
}

.bar-3 {
  height: 40%;
  animation-delay: 0.2s;
}

@keyframes bounce {
  0% {
    height: 20%;
  }
  100% {
    height: 100%;
  }
}

/* Bottom Player Bar */
.player-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.85rem 1.5rem;
  background: rgba(10, 15, 30, 0.98);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  gap: 1rem;
}

:global([data-theme="light"]) .player-bar {
  background: #f8fafc;
  border-top-color: #e2e8f0;
}

.current-track {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
  min-width: 0;
}

.player-logo-wrap {
  width: 34px;
  height: 34px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
}

.current-logo {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.current-logo-fallback {
  font-size: 1.1rem;
}

.current-meta {
  flex: 1;
  min-width: 0;
}

.current-name {
  font-size: 0.88rem;
  font-weight: 700;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

:global([data-theme="light"]) .current-name {
  color: #0f172a;
}

.current-status {
  font-size: 0.72rem;
  margin-top: 0.1rem;
}

.status-live {
  color: #10b981;
  font-weight: 700;
  letter-spacing: 0.03em;
}

.status-loading {
  color: #f59e0b;
}

.status-idle {
  color: #64748b;
}

.status-error {
  color: #ef4444;
  margin-left: 0.5rem;
}

.player-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-shrink: 0;
}

.main-play-btn {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: #38bdf8;
  color: #0f172a;
  border: none;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  box-shadow: 0 0 15px rgba(56, 189, 248, 0.4);
}

.main-play-btn:hover {
  transform: scale(1.06);
  background: #7dd3fc;
}

.main-play-btn:active {
  transform: scale(0.96);
}

.volume-box {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.mute-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 1rem;
  cursor: pointer;
}

.volume-slider {
  width: 75px;
  accent-color: #38bdf8;
  cursor: pointer;
}

/* Spinners */
.spinner {
  width: 24px;
  height: 24px;
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-top-color: #38bdf8;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.mini-spinner,
.spinner-small {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(0, 0, 0, 0.2);
  border-top-color: #0f172a;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.mini-spinner {
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-top-color: #38bdf8;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
