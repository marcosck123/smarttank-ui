'use strict';
const { EventEmitter } = require('node:events');

const ETX = 0x03;

/**
 * Conexão serial RS-232 com o TLS-450 (padrão 9600 8N1, confirme no console).
 * A serialport é carregada sob demanda para o modo TCP não depender dela.
 */
class SerialTransport extends EventEmitter {
  constructor({ path, baudRate, dataBits, parity, stopBits }) {
    super();
    this.opts = { path, baudRate, dataBits, parity, stopBits };
    this.port = null;
    this.connected = false;
    this.buffer = Buffer.alloc(0);
    this.retryDelay = 2_000;
    this.stopped = false;
  }

  connect() {
    if (this.stopped) return;
    const { SerialPort } = require('serialport');
    this.port = new SerialPort({ ...this.opts, autoOpen: false });

    this.port.open((err) => {
      if (err) return this._down(err);
      this.connected = true;
      this.retryDelay = 2_000;
      console.log(`[serial] Porta ${this.opts.path} aberta @ ${this.opts.baudRate} 8N1`);
      this.emit('connect');
    });

    this.port.on('data', (chunk) => this._onData(chunk));
    this.port.on('error', (err) => this._down(err));
    this.port.on('close', () => this._down());
  }

  _down(err) {
    if (err) console.error(`[serial] Erro: ${err.message}`);
    if (this.connected) console.warn('[serial] Porta caiu');
    this.connected = false;
    this.emit('disconnect');
    try { this.port?.close(() => {}); } catch (_) {}
    this.port = null;
    if (!this.stopped) {
      console.log(`[serial] Tentando reabrir em ${this.retryDelay / 1000}s...`);
      setTimeout(() => this.connect(), this.retryDelay);
      this.retryDelay = Math.min(this.retryDelay * 2, 60_000);
    }
  }

  _onData(chunk) {
    this.buffer = Buffer.concat([this.buffer, chunk]);
    let idx;
    while ((idx = this.buffer.indexOf(ETX)) !== -1) {
      const frame = this.buffer.subarray(0, idx + 1);
      this.buffer = this.buffer.subarray(idx + 1);
      this.emit('frame', frame);
    }
    if (this.buffer.length > 64_000) this.buffer = Buffer.alloc(0);
  }

  write(bytes) {
    if (!this.connected || !this.port) throw new Error('Serial não conectada');
    this.port.write(bytes);
  }

  stop() {
    this.stopped = true;
    try { this.port?.close(() => {}); } catch (_) {}
  }
}

module.exports = SerialTransport;
