import { ref, computed } from 'vue';

const SERVERS = [
  'https://de1.api.radio-browser.info',
  'https://nl1.api.radio-browser.info',
  'https://at1.api.radio-browser.info'
];

let currentServerIndex = 0;

// Shared audio element and state
let audio = null;
const isPlaying = ref(false);
const isLoading = ref(false);
const isMuted = ref(false);
const streamError = ref(null);

// Persist last station & volume in localStorage
const savedStation = localStorage.getItem('radio_last_station');
const currentStation = ref(
  savedStation
    ? JSON.parse(savedStation)
    : {
        stationuuid: 'metropolitana-985-sp',
        name: 'Rádio Metropolitana 98.5 FM',
        url_resolved: 'https://ice.fabricahost.com.br/metropolitana985sp',
        state: 'São Paulo',
        tags: 'pop,hits,dance',
        favicon: '/metropolitana-logo.png',
        codec: 'AAC'
      }
);

const savedVolume = localStorage.getItem('radio_volume');
const volume = ref(savedVolume !== null ? parseFloat(savedVolume) : 0.8);

const stations = ref([]);
const isFetchingStations = ref(false);
const activeFilter = ref('top');
const searchQuery = ref('');

// Helper to query Radio Browser API with server failover
async function queryRadioBrowser(path) {
  for (let i = 0; i < SERVERS.length; i++) {
    const server = SERVERS[(currentServerIndex + i) % SERVERS.length];
    try {
      const response = await fetch(`${server}${path}`, {
        headers: {
          'User-Agent': 'RamaisNewLife/1.0'
        }
      });
      if (response.ok) {
        currentServerIndex = (currentServerIndex + i) % SERVERS.length;
        return await response.json();
      }
    } catch (e) {
      console.warn(`Servidor Radio Browser ${server} inacessível, tentando próximo...`);
    }
  }
  throw new Error('Todos os servidores da Radio Browser API estão inacessíveis');
}

function initAudio() {
  if (audio) return audio;
  audio = new Audio();
  audio.volume = isMuted.value ? 0 : volume.value;

  audio.addEventListener('waiting', () => {
    isLoading.value = true;
  });

  audio.addEventListener('playing', () => {
    isLoading.value = false;
    isPlaying.value = true;
    streamError.value = null;
  });

  audio.addEventListener('pause', () => {
    isPlaying.value = false;
    isLoading.value = false;
  });

  audio.addEventListener('error', (e) => {
    isLoading.value = false;
    isPlaying.value = false;
    streamError.value = 'Não foi possível reproduzir este sinal de rádio no momento.';
    console.warn('Erro no stream de áudio:', e);
  });

  return audio;
}

export function useRadio() {
  // Ensure audio is initialized
  if (typeof window !== 'undefined') {
    initAudio();
  }

  async function loadStations(options = {}) {
    isFetchingStations.value = true;
    try {
      const filter = options.filter ?? activeFilter.value;
      const query = options.query ?? searchQuery.value;

      let path = '/json/stations/search?';

      if (query && query.trim()) {
        const cleanQ = encodeURIComponent(query.trim());
        path += `name=${cleanQ}&limit=40&order=clickcount&reverse=true`;
      } else if (filter === 'rs') {
        path += 'countrycode=BR&state=Rio%20Grande%20do%20Sul&limit=40&order=clickcount&reverse=true';
      } else if (filter === 'sp') {
        path += 'countrycode=BR&state=Sao%20Paulo&limit=40&order=clickcount&reverse=true';
      } else if (filter === 'rock') {
        path += 'countrycode=BR&tag=rock&limit=40&order=clickcount&reverse=true';
      } else if (filter === 'pop') {
        path += 'countrycode=BR&tag=pop&limit=40&order=clickcount&reverse=true';
      } else if (filter === 'sertanejo') {
        path += 'countrycode=BR&tag=sertanejo&limit=40&order=clickcount&reverse=true';
      } else if (filter === 'news') {
        path += 'countrycode=BR&tag=noticias&limit=40&order=clickcount&reverse=true';
      } else {
        // Default: Top Brasil
        path += 'countrycode=BR&limit=40&order=clickcount&reverse=true';
      }

      const data = await queryRadioBrowser(path);

      // Prioritize HTTPS streams and deduplicate by URL
      const seenUrls = new Set();
      const cleanList = [];

      // If viewing top and Metropolitana isn't in list, ensure it's pinned at top
      if (!query && filter === 'top') {
        cleanList.push({
          stationuuid: 'metropolitana-985-sp',
          name: 'Rádio Metropolitana 98.5 FM',
          url_resolved: 'https://ice.fabricahost.com.br/metropolitana985sp',
          state: 'São Paulo',
          tags: 'pop,hits,dance',
          favicon: '/metropolitana-logo.png',
          codec: 'AAC'
        });
        seenUrls.add('https://ice.fabricahost.com.br/metropolitana985sp');
      }

      for (const st of data) {
        const streamUrl = (st.url_resolved || st.url || '').trim();
        if (!streamUrl || seenUrls.has(streamUrl)) continue;
        seenUrls.add(streamUrl);

        cleanList.push({
          stationuuid: st.stationuuid,
          name: st.name?.trim() || 'Rádio Sem Nome',
          url_resolved: streamUrl,
          state: st.state || st.country || 'Brasil',
          tags: st.tags || '',
          favicon: st.favicon?.startsWith('http') ? st.favicon : '',
          codec: st.codec || 'MP3',
          bitrate: st.bitrate || 128
        });
      }

      stations.value = cleanList;
    } catch (err) {
      console.error('Erro ao carregar rádios da API:', err);
    } finally {
      isFetchingStations.value = false;
    }
  }

  function playStation(station) {
    if (!audio) initAudio();
    streamError.value = null;

    if (currentStation.value?.url_resolved === station.url_resolved && isPlaying.value) {
      audio.pause();
      isPlaying.value = false;
      return;
    }

    currentStation.value = station;
    try {
      localStorage.setItem('radio_last_station', JSON.stringify(station));
    } catch (e) {}

    isLoading.value = true;
    audio.src = station.url_resolved;
    audio.play().catch((err) => {
      console.warn('Erro ao iniciar reprodução:', err);
      isLoading.value = false;
      isPlaying.value = false;
      streamError.value = 'Clique para reproduzir ou escolha outra estação.';
    });

    // Notify Radio Browser click count if it has stationuuid
    if (station.stationuuid && station.stationuuid.length > 20) {
      queryRadioBrowser(`/json/url/${station.stationuuid}`).catch(() => {});
    }
  }

  function togglePlay() {
    if (!audio) initAudio();
    if (isPlaying.value) {
      audio.pause();
    } else {
      if (!audio.src && currentStation.value) {
        audio.src = currentStation.value.url_resolved;
      }
      isLoading.value = true;
      audio.play().catch(() => {
        isLoading.value = false;
        isPlaying.value = false;
      });
    }
  }

  function setVolume(val) {
    const v = Math.max(0, Math.min(1, val));
    volume.value = v;
    if (audio) {
      audio.volume = isMuted.value ? 0 : v;
    }
    try {
      localStorage.setItem('radio_volume', String(v));
    } catch (e) {}
  }

  function toggleMute() {
    isMuted.value = !isMuted.value;
    if (audio) {
      audio.volume = isMuted.value ? 0 : volume.value;
    }
  }

  return {
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
  };
}
