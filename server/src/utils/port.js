import net from 'node:net';

export async function findAvailablePort(startPort = 4000, host) {
  const candidate = Number(startPort);
  if (!Number.isInteger(candidate) || candidate < 1 || candidate > 65535) {
    throw new Error('Invalid port');
  }

  for (let port = candidate; port <= 65535; port += 1) {
    const isFree = await new Promise((resolve) => {
      const server = net.createServer();
      server.once('error', () => resolve(false));
      server.once('listening', () => {
        server.close(() => resolve(true));
      });
      if (host) server.listen(port, host);
      else server.listen(port);
    });

    if (isFree) return port;
  }

  throw new Error('No available port found');
}
