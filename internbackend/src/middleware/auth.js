const { verifyAccessToken } = require('../utils/tokens');
async function authMiddleware(request, reply) {
  const auth = request.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return reply.status(401).send({ error: 'Missing authorization' });
  }
  try {
    const decoded = verifyAccessToken(auth.split(' ')[1]);
    request.user = decoded;
  } catch {
    return reply.status(401).send({ error: 'Invalid token' });
  }
}
module.exports = authMiddleware;