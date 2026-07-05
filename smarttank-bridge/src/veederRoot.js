'use strict';

const SOH = 0x01;

// Mapa de produtos vem do .env (varia por posto): PRODUCT_LABELS=1:Diesel S500,4:Gas. Aditivada
const PRODUCT_LABELS = Object.fromEntries(
  (process.env.PRODUCT_LABELS || '')
    .split(',')
    .map((pair) => pair.split(':').map((s) => s.trim()))
    .filter(([k, v]) => k && v)
);

/**
 * Cliente do protocolo serial Veeder-Root (formato "computer", comandos minúsculos).
 * - Envia UM comando por vez (fila) — o console não lida bem com comandos sobrepostos.
 * - i20100 = In-Tank Inventory Report de todos os tanques.
 *
 * ATENÇÃO: o layout do i20100 abaixo segue o manual do protocolo serial
 * Veeder-Root (série TLS). Valide contra o equipamento real na primeira
 * conexão — variações de firmware podem mudar campos. O bridge loga a
 * resposta crua em caso de falha de parse justamente para isso.
 */
class VeederRootClient {
  constructor(transport, { commandTimeoutMs = 8000 } = {}) {
    this.transport = transport;
    this.commandTimeoutMs = commandTimeoutMs;
    this.queue = Promise.resolve();
    this.pending = null;

    transport.on('frame', (frame) => {
      if (this.pending) {
        const { resolve, timer } = this.pending;
        clearTimeout(timer);
        this.pending = null;
        resolve(frame);
      } else {
        console.warn('[vr] Frame recebido sem comando pendente (ignorado)');
      }
    });

    transport.on('disconnect', () => {
      if (this.pending) {
        const { reject, timer } = this.pending;
        clearTimeout(timer);
        this.pending = null;
        reject(new Error('Conexão caiu durante o comando'));
      }
    });
  }

  /** Enfileira um comando e resolve com o frame de resposta (Buffer até ETX). */
  sendCommand(command) {
    const run = () =>
      new Promise((resolve, reject) => {
        if (!this.transport.connected) {
          return reject(new Error('Transporte desconectado'));
        }
        const timer = setTimeout(() => {
          this.pending = null;
          reject(new Error(`Timeout aguardando resposta de "${command}"`));
        }, this.commandTimeoutMs);
        this.pending = { resolve, reject, timer };
        try {
          this.transport.write(Buffer.concat([Buffer.from([SOH]), Buffer.from(command, 'ascii')]));
        } catch (err) {
          clearTimeout(timer);
          this.pending = null;
          reject(err);
        }
      });

    // Serializa: próximo comando só sai quando o anterior terminar
    const result = this.queue.then(run, run);
    this.queue = result.catch(() => {});
    return result;
  }

  /** Lê o inventário de todos os tanques (i20100) já parseado. */
  async readInventory() {
    const frame = await this.sendCommand('i20100');
    return parseI20100(frame);
  }
}

/** Converte 8 chars hex (IEEE 754 single) em número JS. */
function hexToFloat(hex8) {
  const buf = Buffer.alloc(4);
  buf.writeUInt32BE(parseInt(hex8, 16) >>> 0, 0);
  const v = buf.readFloatBE(0);
  return Number.isFinite(v) ? Number(v.toFixed(2)) : null;
}

/**
 * Parser do i20100 (formato computer):
 *   SOH i20100 YYMMDDHHMM [bloco por tanque...] && CCCC ETX
 * Bloco por tanque:
 *   TT (nº tanque, 2) + P (código produto, 1) + SSSS (status, 4 hex)
 *   + NN (qtde de campos, 2) + NN * 8 chars hex (floats IEEE 754)
 * Ordem dos campos (NN normalmente = 7):
 *   volume, volume TC, ullage, altura, altura água, temperatura, volume água
 */
function parseI20100(frame) {
  const raw = frame.toString('ascii');
  // Remove SOH inicial e ETX final
  let body = raw.replace(/^\x01/, '').replace(/\x03$/, '');

  if (!body.startsWith('i20100')) {
    throw new ParseError('Resposta não ecoou i20100', raw);
  }
  body = body.slice('i20100'.length);

  const dateStr = body.slice(0, 10); // YYMMDDHHMM
  body = body.slice(10);

  // Descarta checksum final "&&CCCC" se presente
  const ckIdx = body.indexOf('&&');
  if (ckIdx !== -1) body = body.slice(0, ckIdx);

  const tanks = [];
  let pos = 0;
  try {
    while (pos + 9 <= body.length) {
      const tank = parseInt(body.slice(pos, pos + 2), 10);
      const productCode = parseInt(body.slice(pos + 2, pos + 3), 10);
      const statusBits = body.slice(pos + 3, pos + 7);
      const nFields = parseInt(body.slice(pos + 7, pos + 9), 10);
      pos += 9;

      if (!Number.isInteger(tank) || !Number.isInteger(nFields) || nFields > 12) {
        throw new ParseError(`Bloco de tanque inválido na posição ${pos - 9}`, raw);
      }

      const fields = [];
      for (let i = 0; i < nFields; i++) {
        fields.push(hexToFloat(body.slice(pos, pos + 8)));
        pos += 8;
      }

      const [volume, volumeTC, ullage, height, waterHeight, temperature, waterVolume] = fields;
      tanks.push({
        tank,
        productCode,
        productLabel: PRODUCT_LABELS[productCode] || `Produto ${productCode}`,
        statusBits,
        volume,          // litros
        volumeTC,        // litros termo-compensados
        ullage,          // espaço livre (litros)
        height,          // mm
        waterHeight,     // mm
        temperature,     // °C
        waterVolume,     // litros
      });
    }
  } catch (err) {
    if (err instanceof ParseError) throw err;
    throw new ParseError(err.message, raw);
  }

  if (tanks.length === 0) throw new ParseError('Nenhum tanque na resposta', raw);

  return {
    deviceTimestamp: dateStr,
    readAt: new Date().toISOString(),
    tanks,
  };
}

class ParseError extends Error {
  constructor(message, raw) {
    super(message);
    this.name = 'ParseError';
    // Guarda a resposta crua (hex) para depurar contra o equipamento real
    this.rawHex = Buffer.from(raw, 'ascii').toString('hex');
  }
}

module.exports = { VeederRootClient, parseI20100, ParseError };
