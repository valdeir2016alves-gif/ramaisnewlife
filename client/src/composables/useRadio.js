import { ref, computed } from 'vue';

const SERVERS = [
  'https://de1.api.radio-browser.info',
  'https://nl1.api.radio-browser.info',
  'https://at1.api.radio-browser.info'
];

let currentServerIndex = 0;

// Shared audio element and state
let audio = null;
let hlsInstance = null;
const isPlaying = ref(false);
const isLoading = ref(false);
const isMuted = ref(false);
const streamError = ref(null);

// Verified Top Stations (RS & SP) with reliable tested streams & fallbacks
const VERIFIED_ATLANTIDA = {
  stationuuid: 'rede-atlantida-fm',
  name: 'Rádio Atlântida 94.3 FM',
  url_resolved: 'https://playerservices.streamtheworld.com/api/livestream-redirect/ATL_FLO.mp3',
  fallback_url: 'https://1852747t.ha.azioncdn.net/primary/atl_poa.sdp/playlist.m3u8',
  state: 'Rio Grande do Sul',
  tags: 'pop,rock,jovem,pretinho basico',
  favicon: 'https://atl.clicrbs.com.br/favicon.ico',
  codec: 'MP3 / HLS',
  bitrate: 128
};

const VERIFIED_GAUCHA = {
  stationuuid: 'radio-gaucha-poa',
  name: 'Rádio Gaúcha 93.7 FM',
  url_resolved: 'https://1132747t.ha.azioncdn.net/primary/gaucha_rbs.sdp/playlist.m3u8',
  fallback_url: 'https://liverdgaupoa.rbsdirect.com.br/primary/gaucha_rbs.sdp/playlist.m3u8',
  state: 'Rio Grande do Sul',
  tags: 'noticias,jornalismo,futebol,esportes',
  favicon: 'https://gauchazh.clicrbs.com.br/favicon.ico',
  codec: 'HLS',
  bitrate: 128
};

const VERIFIED_METROPOLITANA = {
  stationuuid: 'metropolitana-985-sp',
  name: 'Rádio Metropolitana 98.5 FM',
  url_resolved: 'https://ice.fabricahost.com.br/metropolitana985sp',
  state: 'São Paulo',
  tags: 'pop,hits,dance',
  favicon: '/metropolitana-logo.png',
  codec: 'AAC',
  bitrate: 128
};

// Persist last station & volume in localStorage
const savedStation = localStorage.getItem('radio_last_station');
const currentStation = ref(
  savedStation
    ? JSON.parse(savedStation)
    : VERIFIED_METROPOLITANA
);

const savedVolume = localStorage.getItem('radio_volume');
const volume = ref(savedVolume !== null ? parseFloat(savedVolume) : 0.8);

const stations = ref([]);
const isFetchingStations = ref(false);
const activeFilter = ref('top');
const searchQuery = ref('');

// Helper to load HLS.js if needed
async function getHls() {
  if (typeof window === 'undefined') return null;
  if (window.Hls) return window.Hls;

  try {
    const mod = await import('hls.js');
    if (mod && (mod.default || mod)) return mod.default || mod;
  } catch (e) {}

  return new Promise((resolve) => {
    if (window.Hls) return resolve(window.Hls);
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/hls.js/1.5.17/hls.min.js';
    script.async = true;
    script.onload = () => resolve(window.Hls || null);
    script.onerror = () => {
      const fb = document.createElement('script');
      fb.src = 'https://cdn.jsdelivr.net/npm/hls.js@1.5.17/dist/hls.min.js';
      fb.async = true;
      fb.onload = () => resolve(window.Hls || null);
      fb.onerror = () => resolve(null);
      document.head.appendChild(fb);
    };
    document.head.appendChild(script);
  });
}

function destroyHls() {
  if (hlsInstance) {
    try {
      hlsInstance.stopLoad();
      hlsInstance.detachMedia();
      hlsInstance.destroy();
    } catch (e) {}
    hlsInstance = null;
  }
}

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
    if (!hlsInstance) {
      isLoading.value = false;
      isPlaying.value = false;
      if (currentStation.value?.fallback_url && currentStation.value.url_resolved !== currentStation.value.fallback_url) {
        console.log('Tentando stream de fallback após erro de áudio...');
        playStation({ ...currentStation.value, url_resolved: currentStation.value.fallback_url, fallback_url: null });
        return;
      }
      streamError.value = 'Não foi possível reproduzir este sinal de rádio no momento.';
      console.warn('Erro no stream de áudio:', e);
    }
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

      const queryNormalized = (query || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();

      // Pin verified stations when relevant
      const shouldIncludeAtlantida = queryNormalized.includes('atl') || filter === 'rs' || filter === 'top';
      const shouldIncludeGaucha = queryNormalized.includes('gauch') || filter === 'rs';
      const shouldIncludeMetropolitana = queryNormalized.includes('metro') || filter === 'top' || (!query && filter === 'pop');

      if (shouldIncludeAtlantida) {
        cleanList.push(VERIFIED_ATLANTIDA);
        seenUrls.add(VERIFIED_ATLANTIDA.url_resolved);
        if (VERIFIED_ATLANTIDA.fallback_url) seenUrls.add(VERIFIED_ATLANTIDA.fallback_url);
      }

      if (shouldIncludeGaucha) {
        cleanList.push(VERIFIED_GAUCHA);
        seenUrls.add(VERIFIED_GAUCHA.url_resolved);
        if (VERIFIED_GAUCHA.fallback_url) seenUrls.add(VERIFIED_GAUCHA.fallback_url);
      }

      if (shouldIncludeMetropolitana && !seenUrls.has(VERIFIED_METROPOLITANA.url_resolved)) {
        cleanList.push(VERIFIED_METROPOLITANA);
        seenUrls.add(VERIFIED_METROPOLITANA.url_resolved);
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
          codec: st.codec || (streamUrl.includes('.m3u8') ? 'HLS' : 'MP3'),
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

  async function playStation(station) {
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
    destroyHls();

    const url = station.url_resolved;
    const isHls = url.includes('.m3u8') || station.codec?.toUpperCase().includes('HLS');

    const onPlaySuccess = () => {
      isLoading.value = false;
      isPlaying.value = true;
      streamError.value = null;
    };

    const onPlayFail = (err) => {
      console.warn('Erro ao reproduzir rádio:', err);
      // Try fallback URL if available
      if (station.fallback_url && station.fallback_url !== url) {
        console.log('Tentando stream alternativo:', station.fallback_url);
        destroyHls();
        playStation({ ...station, url_resolved: station.fallback_url, fallback_url: null });
        return;
      }
      destroyHls();
      isLoading.value = false;
      isPlaying.value = false;
      streamError.value = 'Não foi possível reproduzir este sinal de rádio no momento.';
    };

    // If HLS stream and browser needs Hls.js
    if (isHls && !audio.canPlayType('application/vnd.apple.mpegurl')) {
      try {
        const HlsClass = await getHls();
        if (HlsClass && HlsClass.isSupported()) {
          const hls = new HlsClass({
            enableWorker: true,
            lowLatencyMode: true,
            backBufferLength: 30
          });
          hlsInstance = hls;
          hls.loadSource(url);
          hls.attachMedia(audio);

          hls.on(HlsClass.Events.MANIFEST_PARSED, () => {
            audio.play().then(onPlaySuccess).catch(onPlayFail);
          });

          hls.on(HlsClass.Events.ERROR, (event, data) => {
            if (data.fatal) {
              switch (data.type) {
                case HlsClass.ErrorTypes.NETWORK_ERROR:
                  console.warn('HLS network error, tentando reconectar...', data);
                  hls.startLoad();
                  break;
                case HlsClass.ErrorTypes.MEDIA_ERROR:
                  console.warn('HLS media error, tentando recuperar...', data);
                  hls.recoverMediaError();
                  break;
                default:
                  onPlayFail(data);
                  break;
              }
            }
          });
          return;
        }
      } catch (e) {
        console.warn('Falha ao instanciar Hls.js:', e);
      }
    }

    // Direct playback (MP3, AAC, or Safari native HLS)
    audio.src = url;
    audio.load();
    audio.play().then(onPlaySuccess).catch(onPlayFail);

    // Notify Radio Browser click count if it has stationuuid
    if (station.stationuuid && station.stationuuid.length > 20) {
      queryRadioBrowser(`/json/url/${station.stationuuid}`).catch(() => {});
    }
  }

  function togglePlay() {
    if (!audio) initAudio();
    if (isPlaying.value) {
      audio.pause();
      isPlaying.value = false;
    } else {
      if (currentStation.value) {
        if (hlsInstance) {
          audio.play().catch(() => {
            isLoading.value = false;
            isPlaying.value = false;
          });
        } else {
          playStation(currentStation.value);
        }
      }
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
