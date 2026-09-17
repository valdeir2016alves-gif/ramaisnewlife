const { execFile } = require('child_process');
const net = require('net');
const os = require('os');

/**
 * Pings an IP address using system ICMP ping.
 * Returns { online: boolean, latencyMs: number | null }
 */
function systemIcmpPing(ip, timeoutMs = 1500) {
  return new Promise((resolve) => {
    const isWin = os.platform() === 'win32';
    const cmd = 'ping';
    // Windows: -n 1 (count), -w <timeout_ms>
    // Linux: -c 1 (count), -W <timeout_seconds>
    const timeoutSec = Math.max(1, Math.ceil(timeoutMs / 1000));
    const args = isWin
      ? ['-n', '1', '-w', String(timeoutMs), ip]
      : ['-c', '1', '-W', String(timeoutSec), ip];

    const startTime = Date.now();

    execFile(cmd, args, { timeout: timeoutMs + 500 }, (error, stdout) => {
      const elapsed = Date.now() - startTime;
      if (error || !stdout) {
        return resolve({ online: false, latencyMs: null });
      }

      const output = stdout.toString();

      // Check for packet loss / unreachable
      const winSuccess = /tempo[=<](\d+)ms/i.exec(output) || /time[=<](\d+)ms/i.exec(output);
      const linuxSuccess = /time=(\d+(?:\.\d+)?) ?ms/i.exec(output) || /min\/avg\/max[^\n]*=\s*[\d.]+\/([\d.]+)/i.exec(output);

      if (winSuccess) {
        const ms = parseInt(winSuccess[1], 10);
        return resolve({ online: true, latencyMs: isNaN(ms) ? elapsed : ms });
      }

      if (linuxSuccess) {
        const ms = Math.round(parseFloat(linuxSuccess[1]));
        return resolve({ online: true, latencyMs: isNaN(ms) ? elapsed : ms });
      }

      // If output indicates successful reply without explicit regex match
      if (
        (output.includes('bytes=') || output.includes('bytes from') || output.includes('Resposta de') || output.includes('Reply from')) &&
        !output.includes('Destination host unreachable') &&
        !output.includes('Esgotado o tempo limite') &&
        !output.includes('100% loss') &&
        !output.includes('100% packet loss')
      ) {
        return resolve({ online: true, latencyMs: elapsed });
      }

      return resolve({ online: false, latencyMs: null });
    });
  });
}

/**
 * Pings an IP using TCP connection (useful for ATA 200 web interface on port 80).
 */
function tcpPing(ip, port = 80, timeoutMs = 1500) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let resolved = false;
    const startTime = Date.now();

    const finish = (online, error = null) => {
      if (!resolved) {
        resolved = true;
        socket.destroy();
        const latencyMs = online ? Math.max(1, Date.now() - startTime) : null;
        resolve({ online, latencyMs, error });
      }
    };

    socket.setTimeout(timeoutMs);

    socket.on('connect', () => finish(true));
    socket.on('timeout', () => finish(false, 'Timeout'));
    socket.on('error', (err) => {
      // ECONNREFUSED means the host IP reached and sent RST (host is online!)
      if (err.code === 'ECONNREFUSED') {
        finish(true);
      } else {
        finish(false, err.code || 'Error');
      }
    });

    try {
      socket.connect(port, ip);
    } catch (e) {
      finish(false, e.message);
    }
  });
}

/**
 * Hybrid ping: tries ICMP first, then TCP fallback (or vice-versa).
 */
async function pingDevice(ip) {
  if (!ip || typeof ip !== 'string') {
    return { online: false, latencyMs: null, error: 'IP inválido' };
  }

  const cleanIp = ip.trim();
  // Basic IPv4 format validation
  if (!/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(cleanIp)) {
    return { online: false, latencyMs: null, error: 'Formato de IP inválido' };
  }

  // 1. Try ICMP ping first
  const icmpResult = await systemIcmpPing(cleanIp, 1500);
  if (icmpResult.online) {
    return { online: true, latencyMs: icmpResult.latencyMs };
  }

  // 2. Fallback to TCP port 80 (Intelbras ATA 200 web management)
  const tcp80 = await tcpPing(cleanIp, 80, 1500);
  if (tcp80.online) {
    return { online: true, latencyMs: tcp80.latencyMs };
  }

  // 3. Fallback to TCP port 5060 (SIP)
  const tcp5060 = await tcpPing(cleanIp, 5060, 1000);
  if (tcp5060.online) {
    return { online: true, latencyMs: tcp5060.latencyMs };
  }

  return { online: false, latencyMs: null };
}

module.exports = {
  pingDevice,
  systemIcmpPing,
  tcpPing,
};
