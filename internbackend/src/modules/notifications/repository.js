const pool = require('../../config/db');

async function send(userId, message) {
  await pool.query('INSERT INTO notifications (user_id, message) VALUES ($1,$2)', [userId, message]);
}

async function get(userId, { page = 1, limit = 20 } = {}) {
  const offset = (page - 1) * limit;
  const res = await pool.query(
    `SELECT * FROM notifications
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );
  const countRes = await pool.query('SELECT COUNT(*) FROM notifications WHERE user_id = $1', [userId]);
  return {
    data: res.rows,
    total: parseInt(countRes.rows[0].count, 10),
    page,
    limit
  };
}

async function markRead(notificationId, userId) {
  await pool.query('UPDATE notifications SET read = TRUE WHERE id = $1 AND user_id = $2', [notificationId, userId]);
}

async function markAllRead(userId) {
  await pool.query('UPDATE notifications SET read = TRUE WHERE user_id = $1 AND read = FALSE', [userId]);
}

async function deleteNotification(notificationId, userId) {
  await pool.query('DELETE FROM notifications WHERE id = $1 AND user_id = $2', [notificationId, userId]);
}

async function getUnreadCount(userId) {
  const res = await pool.query('SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND read = FALSE', [userId]);
  return parseInt(res.rows[0].count, 10);
}

module.exports = { send, get, markRead, markAllRead, deleteNotification, getUnreadCount };
