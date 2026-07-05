'use strict';
const Fastify = require('fastify');
const cors = require('@fastify/cors');
const websocket = require('@fastify/websocket');

/**
 * API consumida pelo SmartTank.
 *   GET /health            — status do bridge (sem token, sem dados de tanque)
 *   GET /tanques           — inventário completo (cache)
 *   GET /tanques/:id       — um tanque específico
 *   WS  /ws?token=...      — push a cada leitura nova
 * Autenticação: header "x-api-key" (REST) ou query "token" (WS).
 */
async function buildServer({ poller, config }) {
  const app = Fastify({ logger: true });

  await app.register(cors, {
    origin: config.corsOrigins.includes('*') ? true : config.corsOrigins,
  });
  await app.register(websocket);

  const checkToken = (value) => value === config.bridgeToken;

  app.addHook('onRequest', async (req, reply) => {
    if (req.url === '/health' || req.url.startsWith('/ws')) return;
    if (!checkToken(req.headers['x-api-key'])) {
      return reply.code(401).send({ error: 'Token inválido ou ausente (header x-api-key)' });
    }
  });

  app.get('/health', async () => ({
    ok: true,
    uptimeSec: Math.round(process.uptime()),
    ...poller.status,
  }));

  app.get('/tanques', async (req, reply) => {
    if (!poller.cache) {
      return reply.code(503).send({ error: 'Ainda sem leitura do equipamento', status: poller.status });
    }
    return { ...poller.cache, status: poller.status };
  });

  app.get('/tanques/:id', async (req, reply) => {
    if (!poller.cache) {
      return reply.code(503).send({ error: 'Ainda sem leitura do equipamento', status: poller.status });
    }
    const id = Number(req.params.id);
    const tank = poller.cache.tanks.find((t) => t.tank === id);
    if (!tank) return reply.code(404).send({ error: `Tanque ${id} não encontrado` });
    return { readAt: poller.cache.readAt, tank };
  });

  // WebSocket: push de leituras novas
  app.get('/ws', { websocket: true }, (socket, req) => {
    const url = new URL(req.url, 'http://localhost');
    if (!checkToken(url.searchParams.get('token'))) {
      socket.close(4401, 'Token inválido');
      return;
    }
    // Envia o estado atual imediatamente
    if (poller.cache) {
      socket.send(JSON.stringify({ type: 'inventory', data: poller.cache }));
    }
    const onUpdate = (data) => {
      if (socket.readyState === 1) {
        socket.send(JSON.stringify({ type: 'inventory', data }));
      }
    };
    poller.on('update', onUpdate);
    socket.on('close', () => poller.off('update', onUpdate));
  });

  return app;
}

module.exports = buildServer;
