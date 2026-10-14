const WebSocket = require('ws');

const PBX_WS_URL = process.env.PBX_WS_URL || 'ws://pabx.newlifefibra.com.br:8088/ws';

function setupSipProxy(server) {
  const wss = new WebSocket.Server({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    try {
      const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
      if (url.pathname === '/sip-ws') {
        wss.handleUpgrade(request, socket, head, (clientWs) => {
          wss.emit('connection', clientWs, request);
        });
      }
    } catch (err) {
      console.error('[SIP Proxy] Erro no upgrade:', err);
      socket.destroy();
    }
  });

  wss.on('connection', (clientWs, request) => {
    console.log('[SIP Proxy] Cliente Webphone conectado de:', request.headers['x-forwarded-for'] || request.socket.remoteAddress);

    const queue = [];
    let pbxConnected = false;

    const pbxWs = new WebSocket(PBX_WS_URL, ['sip']);

    pbxWs.on('open', () => {
      pbxConnected = true;
      while (queue.length > 0) {
        const item = queue.shift();
        try {
          pbxWs.send(item.data, { binary: item.isBinary });
        } catch (e) {
          console.error('[SIP Proxy] Erro ao enviar fila pro PBX:', e);
        }
      }
    });

    clientWs.on('message', (data, isBinary) => {
      if (pbxConnected && pbxWs.readyState === WebSocket.OPEN) {
        try {
          pbxWs.send(data, { binary: isBinary });
        } catch (e) {
          console.error('[SIP Proxy] Erro ao enviar pro PBX:', e);
        }
      } else {
        queue.push({ data, isBinary });
      }
    });

    pbxWs.on('message', (data, isBinary) => {
      if (clientWs.readyState === WebSocket.OPEN) {
        try {
          clientWs.send(data, { binary: isBinary });
        } catch (e) {
          console.error('[SIP Proxy] Erro ao enviar pro cliente:', e);
        }
      }
    });

    const cleanup = () => {
      try {
        if (clientWs.readyState === WebSocket.OPEN || clientWs.readyState === WebSocket.CONNECTING) {
          clientWs.close();
        }
      } catch (e) {}
      try {
        if (pbxWs.readyState === WebSocket.OPEN || pbxWs.readyState === WebSocket.CONNECTING) {
          pbxWs.close();
        }
      } catch (e) {}
    };

    clientWs.on('close', cleanup);
    clientWs.on('error', (err) => {
      console.error('[SIP Proxy] Erro no clientWs:', err.message);
      cleanup();
    });

    pbxWs.on('close', cleanup);
    pbxWs.on('error', (err) => {
      console.error('[SIP Proxy] Erro no pbxWs:', err.message);
      cleanup();
    });
  });

  console.log('[SIP Proxy] Endpoint /sip-ws configurado -> encaminhando para', PBX_WS_URL);
}

module.exports = { setupSipProxy };
