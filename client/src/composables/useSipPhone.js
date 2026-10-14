import { ref, computed } from 'vue';
import JsSIP from 'jssip';
import {
  playDtmfTone,
  startRingbackTone,
  stopRingbackTone,
  startIncomingRingTone,
  stopIncomingRingTone,
  playCallEndTone
} from '../utils/sipAudio';

// Desabilita logs excessivos do JsSIP em produção
try {
  JsSIP.debug.disable();
} catch (e) {}

// Configurações internas do PBX New Life (100% ocultas do usuário final)
const PBX_DOMAIN = 'pabx.newlifefibra.com.br';
// Usa o hostname oficial correspondente ao certificado SSL da operadora para evitar bloqueio no navegador
const PBX_WSS_SERVER = 'wss://45-4-78-194.twsolutions.com.br:8089/ws';
const PBX_WS_SERVER = 'ws://pabx.newlifefibra.com.br:8088/ws';

function getWsUrl() {
  if (typeof window !== 'undefined' && window.location.protocol === 'http:') {
    return PBX_WS_SERVER;
  }
  return PBX_WSS_SERVER;
}

const STORAGE_KEY_USER_EXT = 'nl_user_extension';
const STORAGE_KEY_USER_PW = 'nl_user_password';

function loadStoredExtension() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_USER_EXT);
    if (saved) return saved.trim();
    const legacy = localStorage.getItem('nl_sip_config');
    if (legacy) {
      const parsed = JSON.parse(legacy);
      if (parsed.extension) return parsed.extension.trim();
    }
  } catch (e) {}
  return '';
}

function loadStoredPassword() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_USER_PW);
    if (saved) return saved.trim();
    const legacy = localStorage.getItem('nl_sip_config');
    if (legacy) {
      const parsed = JSON.parse(legacy);
      if (parsed.password) return parsed.password.trim();
    }
  } catch (e) {}
  return '';
}

// Estado compartilhado (Singleton)
const myExtension = ref(loadStoredExtension());
const myPassword = ref(loadStoredPassword());
const status = ref('disconnected'); // unconfigured, disconnected, connecting, connected, registered, registrationFailed, error
const callStatus = ref('idle'); // idle, calling (discando), ringing (recebendo), in-call (em chamada), ended, failed
const errorMessage = ref('');
const targetNumber = ref('');
const remoteParty = ref({ number: '', name: '' });
const callDuration = ref(0);
const isMuted = ref(false);
const isOnHold = ref(false);

const isWebphoneOpen = ref(false);
const pendingCallTarget = ref('');

let ua = null;
let currentSession = null;
let incomingSession = null;
let durationTimer = null;
let remoteAudioEl = null;

function ensureRemoteAudioElement() {
  if (typeof document === 'undefined') return;
  if (!remoteAudioEl) {
    remoteAudioEl = document.getElementById('sip-remote-audio');
    if (!remoteAudioEl) {
      remoteAudioEl = document.createElement('audio');
      remoteAudioEl.id = 'sip-remote-audio';
      remoteAudioEl.autoplay = true;
      remoteAudioEl.playsInline = true;
      remoteAudioEl.style.display = 'none';
      document.body.appendChild(remoteAudioEl);
    }
  }
}

function startDurationTimer() {
  stopDurationTimer();
  callDuration.value = 0;
  durationTimer = setInterval(() => {
    callDuration.value += 1;
  }, 1000);
}

function stopDurationTimer() {
  if (durationTimer) {
    clearInterval(durationTimer);
    durationTimer = null;
  }
}

function formatDuration(totalSeconds) {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

const formattedCallDuration = computed(() => formatDuration(callDuration.value));

function isConfigured() {
  return !!(myExtension.value && myExtension.value.trim());
}

function cleanupSession() {
  stopRingbackTone();
  stopIncomingRingTone();
  stopDurationTimer();
  currentSession = null;
  incomingSession = null;
  isMuted.value = false;
  isOnHold.value = false;
  if (remoteAudioEl) {
    remoteAudioEl.srcObject = null;
  }
}

function setupSessionEvents(session) {
  session.on('peerconnection', (e) => {
    const pc = e.peerconnection;
    pc.addEventListener('track', (trackEvent) => {
      ensureRemoteAudioElement();
      const stream = trackEvent.streams[0] || new MediaStream([trackEvent.track]);
      if (remoteAudioEl) {
        remoteAudioEl.srcObject = stream;
        remoteAudioEl.play().catch(() => {});
      }
    });
  });

  session.on('connecting', () => {});

  session.on('progress', () => {
    if (callStatus.value !== 'in-call') {
      callStatus.value = 'calling';
    }
  });

  session.on('confirmed', () => {
    stopRingbackTone();
    stopIncomingRingTone();
    callStatus.value = 'in-call';
    startDurationTimer();
  });

  session.on('ended', () => {
    playCallEndTone();
    callStatus.value = 'ended';
    cleanupSession();
    setTimeout(() => {
      if (callStatus.value === 'ended') {
        callStatus.value = 'idle';
      }
    }, 2000);
  });

  session.on('failed', (e) => {
    playCallEndTone();
    callStatus.value = 'failed';
    const reason = e?.cause || 'Chamada não atendida / ocupado';
    errorMessage.value = reason;
    cleanupSession();
    setTimeout(() => {
      if (callStatus.value === 'failed') {
        callStatus.value = 'idle';
        errorMessage.value = '';
      }
    }, 3000);
  });

  session.on('hold', () => {
    isOnHold.value = session.isOnHold().local;
  });

  session.on('unhold', () => {
    isOnHold.value = session.isOnHold().local;
  });

  session.on('muted', () => {
    isMuted.value = session.isMuted().audio;
  });

  session.on('unmuted', () => {
    isMuted.value = session.isMuted().audio;
  });
}

function connect() {
  const ext = (myExtension.value || '').trim().replace(/\D/g, '');
  if (!ext) {
    status.value = 'unconfigured';
    return;
  }

  disconnect();

  ensureRemoteAudioElement();
  status.value = 'connecting';
  errorMessage.value = '';

  try {
    const wsUrl = getWsUrl();
    const socket = new JsSIP.WebSocketInterface(wsUrl);
    const domain = PBX_DOMAIN;
    const password = myPassword.value || `Ramal@${ext}`;

    const uaConfig = {
      sockets: [socket],
      uri: `sip:${ext}@${domain}`,
      password: password,
      display_name: `Ramal ${ext}`,
      authorization_user: ext,
      register: true,
      session_timers: false,
      connection_recovery_min_interval: 2,
      connection_recovery_max_interval: 30
    };

    ua = new JsSIP.UA(uaConfig);

    ua.on('connecting', () => {
      status.value = 'connecting';
    });

    ua.on('connected', () => {
      status.value = 'connected';
    });

    ua.on('disconnected', (e) => {
      status.value = 'disconnected';
      if (e?.error) {
        errorMessage.value = 'Conexão com a central perdida.';
      }
    });

    ua.on('registered', () => {
      status.value = 'registered';
      errorMessage.value = '';
    });

    ua.on('unregistered', () => {
      if (status.value === 'registered') {
        status.value = 'connected';
      }
    });

    ua.on('registrationFailed', (e) => {
      status.value = 'registrationFailed';
      errorMessage.value = e?.cause ? `Falha no ramal: ${e.cause}` : 'Ramal não encontrado ou indisponível na central';
    });

    ua.on('newRTCSession', (data) => {
      const session = data.session;
      if (session.direction === 'incoming') {
        if (currentSession || incomingSession) {
          session.terminate({ status_code: 486, reason_phrase: 'Busy Here' });
          return;
        }

        incomingSession = session;
        const uriUser = session.remote_identity?.uri?.user || 'Desconhecido';
        const dispName = session.remote_identity?.display_name || uriUser;
        remoteParty.value = {
          number: uriUser,
          name: dispName
        };
        callStatus.value = 'ringing';
        startIncomingRingTone();
        isWebphoneOpen.value = true;
        setupSessionEvents(session);
      } else {
        currentSession = session;
        setupSessionEvents(session);
      }
    });

    ua.start();
  } catch (err) {
    status.value = 'error';
    errorMessage.value = `Erro de conexão: ${err.message}`;
  }
}

function disconnect() {
  if (currentSession || incomingSession) {
    hangupCall();
  }
  if (ua) {
    try {
      ua.stop();
    } catch (e) {}
    ua = null;
  }
  status.value = isConfigured() ? 'disconnected' : 'unconfigured';
}

function setMyExtension(ext, pw = '', autoCallTarget = null) {
  const clean = (ext || '').toString().trim().replace(/\D/g, '');
  if (!clean) return false;

  myExtension.value = clean;
  myPassword.value = (pw || '').trim();

  try {
    localStorage.setItem(STORAGE_KEY_USER_EXT, clean);
    if (myPassword.value) {
      localStorage.setItem(STORAGE_KEY_USER_PW, myPassword.value);
    } else {
      localStorage.removeItem(STORAGE_KEY_USER_PW);
    }
  } catch (e) {}

  connect();

  if (autoCallTarget) {
    setTimeout(() => {
      makeCall(autoCallTarget);
    }, 1200);
  }
  return true;
}

function clearMyExtension() {
  myExtension.value = '';
  myPassword.value = '';
  try {
    localStorage.removeItem(STORAGE_KEY_USER_EXT);
    localStorage.removeItem(STORAGE_KEY_USER_PW);
  } catch (e) {}
  disconnect();
  status.value = 'unconfigured';
}

function makeCall(numberToCall) {
  const dest = (numberToCall || targetNumber.value || '').toString().trim().replace(/[^\d*#+]/g, '');
  if (!dest) {
    errorMessage.value = 'Digite o ramal desejado para discar';
    return;
  }

  if (!isConfigured()) {
    pendingCallTarget.value = dest;
    isWebphoneOpen.value = true;
    errorMessage.value = 'Informe seu ramal para fazer chamadas.';
    return;
  }

  if (status.value !== 'registered' && status.value !== 'connected') {
    isWebphoneOpen.value = true;
    errorMessage.value = 'Conectando ao ramal...';
    connect();
    setTimeout(() => {
      if (status.value === 'registered' || status.value === 'connected') {
        makeCall(dest);
      }
    }, 1500);
    return;
  }

  if (currentSession || incomingSession) {
    return;
  }

  isWebphoneOpen.value = true;
  errorMessage.value = '';

  const targetUri = `sip:${dest}@${PBX_DOMAIN}`;

  remoteParty.value = {
    number: dest,
    name: `Ramal ${dest}`
  };

  callStatus.value = 'calling';
  startRingbackTone();

  try {
    const options = {
      mediaConstraints: { audio: true, video: false },
      rtcOfferConstraints: {
        offerToReceiveAudio: true,
        offerToReceiveVideo: false
      }
    };
    ua.call(targetUri, options);
  } catch (err) {
    stopRingbackTone();
    callStatus.value = 'failed';
    errorMessage.value = `Erro ao chamar: ${err.message}`;
    setTimeout(() => {
      callStatus.value = 'idle';
      errorMessage.value = '';
    }, 3000);
  }
}

function answerCall() {
  if (!incomingSession) return;
  stopIncomingRingTone();
  currentSession = incomingSession;
  incomingSession = null;

  try {
    currentSession.answer({
      mediaConstraints: { audio: true, video: false }
    });
  } catch (err) {
    cleanupSession();
    callStatus.value = 'failed';
    errorMessage.value = `Erro ao atender: ${err.message}`;
  }
}

function rejectCall() {
  if (incomingSession) {
    stopIncomingRingTone();
    try {
      incomingSession.terminate({ status_code: 486, reason_phrase: 'Busy Here' });
    } catch (e) {}
    incomingSession = null;
  }
  callStatus.value = 'idle';
}

function hangupCall() {
  stopRingbackTone();
  stopIncomingRingTone();

  if (incomingSession) {
    try {
      incomingSession.terminate();
    } catch (e) {}
    incomingSession = null;
  }

  if (currentSession) {
    try {
      currentSession.terminate();
    } catch (e) {}
    currentSession = null;
  }

  cleanupSession();
  callStatus.value = 'idle';
}

function toggleMute() {
  if (!currentSession) return;
  try {
    if (isMuted.value) {
      currentSession.unmute({ audio: true });
      isMuted.value = false;
    } else {
      currentSession.mute({ audio: true });
      isMuted.value = true;
    }
  } catch (e) {}
}

function toggleHold() {
  if (!currentSession) return;
  try {
    if (isOnHold.value) {
      currentSession.unhold();
      isOnHold.value = false;
    } else {
      currentSession.hold();
      isOnHold.value = true;
    }
  } catch (e) {}
}

function sendDTMF(digit) {
  playDtmfTone(digit);
  if (callStatus.value === 'in-call' && currentSession) {
    try {
      currentSession.sendDTMF(digit);
    } catch (e) {}
  } else {
    targetNumber.value += digit;
  }
}

function clearTargetNumber() {
  targetNumber.value = '';
}

function backspaceTargetNumber() {
  targetNumber.value = targetNumber.value.slice(0, -1);
}

function openDialerWithNumber(num, autoCall = false) {
  const cleanTarget = (num || '').toString().trim().replace(/[^\d*#+]/g, '');
  targetNumber.value = cleanTarget;
  isWebphoneOpen.value = true;

  if (autoCall && cleanTarget) {
    if (!isConfigured()) {
      pendingCallTarget.value = cleanTarget;
    } else {
      makeCall(cleanTarget);
    }
  }
}

// Auto-conectar ao carregar se o ramal já foi configurado
if (typeof window !== 'undefined' && isConfigured()) {
  setTimeout(() => {
    connect();
  }, 1000);
}

export function useSipPhone() {
  return {
    myExtension,
    myPassword,
    status,
    callStatus,
    errorMessage,
    targetNumber,
    remoteParty,
    callDuration,
    formattedCallDuration,
    isMuted,
    isOnHold,
    isWebphoneOpen,
    pendingCallTarget,
    isConfigured: computed(() => isConfigured()),
    connect,
    disconnect,
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
    openDialerWithNumber
  };
}
