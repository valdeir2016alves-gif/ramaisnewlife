const net = require('net');
const pool = require('./db/pool');

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

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
    const text = `${statusIcon} *Alerta de Ramal ${statusText}*\n\n*Nome:* ${contact.name}\n*Setor:* ${contact.department}\n*IP:* ${contact.ip}\n*Ramal:* ${contact.phone}`;

    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

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

const { pingDevice } = require('./utils/ping');

async function checkIPs() {
  try {
    // 1. Monitor contacts
    const { rows } = await pool.query("SELECT id, name, department, ip, phone FROM contacts WHERE ip <> ''");

    for (const contact of rows) {
      if (!contact.ip) continue;

      const pingRes = await pingDevice(contact.ip);
      const isOnline = pingRes.online;

      if (!isOnline && !offlineIPs.has(contact.id)) {
        console.log(`[Monitor] Ramal ${contact.name} (${contact.ip}) caiu!`);
        offlineIPs.add(contact.id);
        await sendTelegramAlert(contact, true);
      } else if (isOnline && offlineIPs.has(contact.id)) {
        console.log(`[Monitor] Ramal ${contact.name} (${contact.ip}) voltou!`);
        offlineIPs.delete(contact.id);
        await sendTelegramAlert(contact, false);
      }
    }

    // 2. Monitor ATAs table
    const { rows: ataRows } = await pool.query("SELECT id, name, ip, status FROM atas WHERE ip <> ''");
    for (const ata of ataRows) {
      const pingRes = await pingDevice(ata.ip);
      const status = pingRes.online ? 'online' : 'offline';
      await pool.query(
        "UPDATE atas SET status = $1, latency_ms = $2, last_checked = now(), updated_at = now() WHERE id = $3",
        [status, pingRes.latencyMs, ata.id]
      );
    }
  } catch (error) {
    console.error('[Monitor] Erro na verificação:', error);
  }
}

async function waitForTables() {
  for (let attempt = 0; attempt < 30; attempt++) {
    const { rows } = await pool.query("SELECT to_regclass('public.contacts') AS c_reg, to_regclass('public.atas') AS a_reg");
    if (rows[0].c_reg && rows[0].a_reg) return;
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  console.error('[Monitor] Tabelas contacts/atas não apareceram a tempo; seguindo mesmo assim.');
}

console.log('[Monitor] Iniciando monitoramento de IP e ATAs...');
waitForTables().then(() => {
  setInterval(checkIPs, 3 * 60 * 1000);
  checkIPs();
});
