'use strict';
const { EventEmitter } = require('node:events');
const { ParseError } = require('./veederRoot');

/**
 * Faz polling do TLS-450 num intervalo fixo e mantém cache em memória.
 * O SmartTank NUNCA fala com o equipamento — só com este cache.
 * Emite 'update' quando uma leitura nova chega (para o WebSocket).
 */
class Poller extends EventEmitter {
  constructor(client, { intervalMs }) {
    super();
    this.client = client;
    this.intervalMs = intervalMs;
    this.cache = null;           // última leitura boa
    this.lastError = null;
    this.consecutiveFailures = 0;
    this.timer = null;
  }

  start() {
    const tick = async () => {
      try {
        const data = await this.client.readInventory();
        this.cache = data;
        this.lastError = null;
        this.consecutiveFailures = 0;
        this.emit('update', data);
      } catch (err) {
        this.consecutiveFailures++;
        this.lastError = { message: err.message, at: new Date().toISOString() };
        console.error(`[poller] Falha #${this.consecutiveFailures}: ${err.message}`);
        if (err instanceof ParseError) {
          // Resposta crua em hex — essencial para ajustar o parser ao firmware real
          console.error(`[poller] Resposta crua (hex): ${err.rawHex}`);
        }
      }
    };
    // Primeira leitura quando o transporte conectar (evita falha falsa de boot
    // e antecipa o primeiro dado); depois, intervalo fixo.
    if (this.client.transport.connected) tick();
    else this.client.transport.once('connect', tick);
    this.timer = setInterval(tick, this.intervalMs);
  }

  stop() {
    clearInterval(this.timer);
  }

  /** Dado considerado velho se passou 3x o intervalo sem leitura boa. */
  get status() {
    const stale =
      !this.cache ||
      Date.now() - new Date(this.cache.readAt).getTime() > this.intervalMs * 3;
    return {
      connected: this.client.transport.connected,
      stale,
      lastReadAt: this.cache?.readAt || null,
      consecutiveFailures: this.consecutiveFailures,
      lastError: this.lastError,
    };
  }
}

module.exports = Poller;
