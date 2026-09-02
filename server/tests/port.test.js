import test from 'node:test';
import assert from 'node:assert/strict';
import net from 'node:net';
import { findAvailablePort } from '../src/utils/port.js';

test('findAvailablePort skips occupied ports and returns a different one', async () => {
  const server = net.createServer();
  await new Promise((resolve, reject) => {
    server.listen(0, '127.0.0.1', (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  const address = server.address();
  assert.ok(address && typeof address.port === 'number');

  const nextPort = await findAvailablePort(address.port, '127.0.0.1');
  assert.notStrictEqual(nextPort, address.port);

  await new Promise((resolve, reject) => {
    server.close((err) => {
      if (err) reject(err);
      else resolve();
    });
  });
});
