const express = require('express');
const JsSIP = require('jssip');
const WebSocket = require('ws');
global.WebSocket = WebSocket;

// Silencia logs do JsSIP no backend
try {
  JsSIP.debug.disable();
} catch (e) {}

const router = express.Router();

const PBX_HOST = process.env.PBX_HOST || 'pabx.newlifefibra.com.br';
const PBX_WS_URL = process.env.PBX_WS_URL || 'ws://pabx.newlifefibra.com.br:8088/ws';
const TENANT_PREFIX = '2';
const REALM = 'twsolutions';

/**
 * Retorna as configurações padrão do SIP / MicroSIP da New Life
 */
router.get('/config', (req, res) => {
  res.json({
    server: PBX_HOST,
    domain: PBX_HOST,
    tenantPrefix: TENANT_PREFIX,
    passwordPattern: 'Ramal@{ramal}',
    transport: 'udp',
    port: 5060,
    wsUrl: '/sip-ws',
    realm: REALM
  });
});

/**
 * Gera e faz download do arquivo MicroSIP.ini configurado para um ramal
 */
router.get('/microsip-ini/:extension', (req, res) => {
  const ext = (req.params.extension || '').trim().replace(/\D/g, '');
  if (!ext) {
    return res.status(400).send('Ramal inválido');
  }

  const name = (req.query.name || `Ramal ${ext}`).trim();
  const password = (req.query.password || `Ramal@${ext}`).trim();
  const authUser = ext.length === 4 && !ext.startsWith(TENANT_PREFIX) ? (TENANT_PREFIX + ext) : ext;

  const iniContent = `[Global]
version=3.22.18

[Settings]
accountId=1
singleMode=1
audioCodecs=PCMA/8000/1 PCMU/8000/1
DTMFMethod=0
rport=1
autoAnswer=button
denyIncoming=button
enableLog=0
bringToFrontOnIncoming=1

[Account1]
label=${name}
server=${PBX_HOST}
proxy=
domain=${PBX_HOST}
username=${authUser}
password=${password}
authID=${authUser}
displayName=${ext}
dialingPrefix=
dialPlan=
transport=udp
registerRefresh=300
keepAlive=15
publish=0
ICE=0
allowRewrite=0
disableSessionTimer=0
`;

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="MicroSIP-${ext}.ini"`);
  res.send(iniContent);
});

/**
 * Testa a autenticação de um ramal diretamente na central Asterisk / VirtPBX
 */
router.post('/test', async (req, res) => {
  const { extension, password } = req.body || {};
  const cleanExt = (extension || '').toString().trim().replace(/\D/g, '');

  if (!cleanExt) {
    return res.status(400).json({ success: false, error: 'Número do ramal não informado' });
  }

  const authUser = cleanExt.length === 4 && !cleanExt.startsWith(TENANT_PREFIX) ? (TENANT_PREFIX + cleanExt) : cleanExt;
  const pass = (password || `Ramal@${cleanExt}`).trim();

  try {
    const startTime = Date.now();
    const result = await new Promise((resolve) => {
      let socket;
      try {
        socket = new JsSIP.WebSocketInterface(PBX_WS_URL);
      } catch (err) {
        return resolve({ success: false, error: `Erro no WebSocket: ${err.message}` });
      }

      const ua = new JsSIP.UA({
        sockets: [socket],
        uri: `sip:${authUser}@${PBX_HOST}`,
        authorization_user: authUser,
        password: pass,
        realm: REALM,
        display_name: cleanExt,
        register: true,
        session_timers: false,
        connection_recovery_min_interval: 1,
        connection_recovery_max_interval: 2
      });

      let resolved = false;
      const finish = (data) => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timer);
          try { ua.stop(); } catch (e) {}
          resolve(data);
        }
      };

      const timer = setTimeout(() => {
        finish({ success: false, error: 'Tempo limite esgotado ao contatar a central VirtPBX' });
      }, 4000);

      ua.on('registered', () => {
        const latencyMs = Date.now() - startTime;
        finish({
          success: true,
          message: `Ramal ${cleanExt} (usuário SIP ${authUser}) autenticado com sucesso!`,
          latencyMs
        });
      });

      ua.on('registrationFailed', (e) => {
        const cause = e?.cause || 'Falha de registro';
        let detail = cause;
        if (cause === 'Authentication Error') {
          detail = `Senha incorreta para o ramal ${cleanExt} (usuário ${authUser})`;
        }
        finish({ success: false, error: detail });
      });

      try {
        ua.start();
      } catch (e) {
        finish({ success: false, error: `Erro ao iniciar teste: ${e.message}` });
      }
    });

    res.json(result);
  } catch (err) {
    console.error('[SIP Test] Erro:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
