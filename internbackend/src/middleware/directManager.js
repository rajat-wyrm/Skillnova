const { isDirectManager, isValidStep } = require('../utils/hierarchy');
function directManagerValidation(field = 'user_id') {
  // Returns an async preHandler with only 2 args (no done)
  return async (request, reply) => {
    const target = request.body[field] || request.params[field];
    if (!target) return reply.status(400).send({ error: 'Target required' });
    const pool = require('../config/db');
    const { rows: [user] } = await pool.query('SELECT id, role, manager_id FROM users WHERE id = $1', [target]);
    if (!user) return reply.status(404).send({ error: 'User not found' });
    if (user.manager_id !== request.user.id || !isValidStep(request.user.role, user.role))
      return reply.status(403).send({ error: 'Not your direct report or invalid step' });
  };
}
module.exports = directManagerValidation;