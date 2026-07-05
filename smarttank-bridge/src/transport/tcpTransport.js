'use strict';
const net = require('node:net');
const { EventEmitter } = require('node:events');

const ETX = 0x03;

/**
 * Mantém UMA conexão TCP persistente com o TLS-450.
 * Importante: o console geralmente aceita apenas 1 cliente por porta —
 * este transporte deve ser o único software conectado nela.
 */
class TcpTransport extends EventEmitter {
  constructor({ host, port }) {
    super();
    this.host = host;
    this.port = port;
    this.socket = null;
    this.connected = false;
    this.buffer = Buffer.alloc(0);
    this.retryDelay = 2_000; // backoff exponencial até 60s
    this.stopped = false;
  }

  connect() {
    if (this.stopped) return;
    this.socket = net.createConnection({ host: this.host, port: this.port });
    this.socket.setKeepAlive(true, 15_000);

    this.socket.on('connect', () => {
      this.connected = true;
      this.retryDelay = 2_000;
      console.log(`[tcp] Conectado a ${this.host}:${this.port}`);
      this.emit('connect');
    });

    this.socket.on('data', (chunk) => this._onData(chunk));

    const onDown = (err) => {
      if (err) console.error(`[tcp] Erro: ${err.message}`);
      if (this.connected) console.warn('[tcp] Conexão caiu');
      this.connected = false;
      this.emit('disconnect');
      this.socket?.destroy();
      this.socket = null;
      if (!this.stopped) {
        console.log(`[tcp] Reconectando em ${this.retryDelay / 1000}s...`);
        setTimeout(() => this.connect(), this.retryDelay);
        this.retryDelay = Math.min(this.retryDelay * 2, 60_000);
      }
    };
    this.socket.on('error', onDown);
    this.socket.on('close', () => onDown());
  }

  _onData(chunk) {
    this.buffer = Buffer.concat([this.buffer, chunk]);
    let idx;
    // Respostas Veeder-Root terminam em ETX (0x03)
    while ((idx = this.buffer.indexOf(ETX)) !== -1) {
      const frame = this.buffer.subarray(0, idx + 1);
      this.buffer = this.buffer.subarray(idx + 1);
      this.emit('frame', frame);
    }
    // Proteção contra lixo acumulado sem ETX
    if (this.buffer.length > 64_000) this.buffer = Buffer.alloc(0);
  }

  write(bytes) {
    if (!this.connected || !this.socket) throw new Error('TCP não conectado');
    this.socket.write(bytes);
  }

  stop() {
    this.stopped = true;
    this.socket?.destroy();
  }
}

module.exports = TcpTransport;
