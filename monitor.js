const fs = require('fs');
const net = require('net');
const path = require('path');

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

const contactsFile = path.join(__dirname, 'data', 'contacts.json');

let offlineIPs = new Set();

function pingIp(ip) {
  if (!ip || !/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(ip)) return Promise.resolve(false);
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let resolved = false;

    const finish = (result) => {
      if (!resolved) {
        resolved = true;
        socket.destroy();
        resolve(result);
      }
    };

    socket.setTimeout(2000);
    
    socket.on('connect', () => finish(true));
    socket.on('timeout', () => finish(false));
    socket.on('error', (err) => {
      if (err.code === 'ECONNREFUSED') {
        finish(true);
      } else {
        finish(false);
      }
    });

    socket.connect(80, ip);
  });
}

async function sendTelegramAlert(contact, isDown) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) return;
  try {
    const statusIcon = isDown ? '🔴' : '🟢';
    const statusText = isDown ? 'OFFLINE' : 'ONLINE';
    const text = ${statusIcon} *Alerta de Ramal *\n\n*Nome:* \n*Setor:* \n*IP:* \n*Ramal:* ;
    
    const url = https://api.telegram.org/bot/sendMessage;
    
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: text,
        parse_mode: 'Markdown'
      })
    });
  } catch (error) {
    console.error('Falha ao enviar alerta do telegram:', error);
  }
}

async function checkIPs() {
  try {
    if (!fs.existsSync(contactsFile)) return;
    const data = JSON.parse(fs.readFileSync(contactsFile, 'utf-8'));
    
    for (const contact of data) {
      if (!contact.ip) continue;
      
      const isOnline = await pingIp(contact.ip);
      
      if (!isOnline && !offlineIPs.has(contact.id)) {
        console.log([Monitor] Ramal  () caiu!);
        offlineIPs.add(contact.id);
        await sendTelegramAlert(contact, true);
      } else if (isOnline && offlineIPs.has(contact.id)) {
        console.log([Monitor] Ramal  () voltou!);
        offlineIPs.delete(contact.id);
        await sendTelegramAlert(contact, false);
      }
    }
  } catch (error) {
    console.error('[Monitor] Erro na verificação:', error);
  }
}

// Check every 3 minutes
console.log('[Monitor] Iniciando monitoramento de IP...');
setInterval(checkIPs, 3 * 60 * 1000);
checkIPs();

