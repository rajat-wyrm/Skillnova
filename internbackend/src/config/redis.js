const redis = require('redis');
const config = require('./index');

let client = null;

async function getRedisClient() {
  if (!config.redisUrl) return null;   // No URL -> no Redis
  if (client) return client;

  try {
    client = redis.createClient({
      url: config.redisUrl,
      socket: { connectTimeout: 3000, reconnectStrategy: false }
    });
    client.on('error', () => {});
    await client.connect();
    console.log('Redis connected');
    return client;
  } catch (err) {
    console.warn('Redis unavailable – continuing without it');
    client = null;
    return null;
  }
}

module.exports = { getRedisClient };
