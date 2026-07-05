'use strict';
require('dotenv').config();

function required(name) {
  const v = process.env[name];
  if (!v) {
    console.error(`[config] Variável obrigatória ausente: ${name} (veja .env.example)`);
    process.exit(1);
  }
  return v;
}

const transport = (process.env.TLS_TRANSPORT || 'tcp').toLowerCase();
if (!['tcp', 'serial'].includes(transport)) {
  console.error(`[config] TLS_TRANSPORT inválido: "${transport}" (use "tcp" ou "serial")`);
  process.exit(1);
}

const config = {
  transport,
  tcp: {
    host: process.env.TLS_HOST || '192.168.0.50',
    port: Number(process.env.TLS_PORT || 10001),
  },
  serial: {
    path: process.env.TLS_SERIAL_PATH || 'COM3',
    baudRate: Number(process.env.TLS_BAUD_RATE || 9600),
    dataBits: 8,
    parity: 'none',
    stopBits: 1,
  },
  pollIntervalMs: Math.max(10_000, Number(process.env.POLL_INTERVAL_MS || 20_000)),
  commandTimeoutMs: Number(process.env.COMMAND_TIMEOUT_MS || 8_000),
  apiPort: Number(process.env.API_PORT || 3050),
  bridgeToken: required('BRIDGE_TOKEN'),
  corsOrigins: (process.env.CORS_ORIGINS || '*').split(',').map((s) => s.trim()),
};

module.exports = config;
