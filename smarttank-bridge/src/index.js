'use strict';
const config = require('./config');
const { VeederRootClient } = require('./veederRoot');
const Poller = require('./poller');
const buildServer = require('./server');

async function main() {
  console.log(`[bridge] Transporte: ${config.transport.toUpperCase()}`);

  const transport =
    config.transport === 'serial'
      ? new (require('./transport/serialTransport'))(config.serial)
      : new (require('./transport/tcpTransport'))(config.tcp);

  const client = new VeederRootClient(transport, {
    commandTimeoutMs: config.commandTimeoutMs,
  });
  const poller = new Poller(client, { intervalMs: config.pollIntervalMs });

  transport.connect();
  poller.start();

  const app = await buildServer({ poller, config });
  await app.listen({ port: config.apiPort, host: '0.0.0.0' });
  console.log(`[bridge] API disponível em http://0.0.0.0:${config.apiPort}`);

  const shutdown = async () => {
    console.log('[bridge] Encerrando...');
    poller.stop();
    transport.stop();
    await app.close();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  console.error('[bridge] Erro fatal:', err);
  process.exit(1);
});
