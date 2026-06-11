const pool = require('../config/db');

async function createAuditLog({ userId, action, resourceType, resourceId, details, oldValue, newValue, ipAddress, userAgent }) {
  await pool.query(
    `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, old_value, new_value, ip_address, user_agent)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [
      userId,
      action,
      resourceType,
      resourceId,
      details ? JSON.stringify(details) : null,
      oldValue ? JSON.stringify(oldValue) : null,
      newValue ? JSON.stringify(newValue) : null,
      ipAddress,
      userAgent
    ]
  );
}

function extractRequestInfo(request) {
  return {
    ipAddress: request.ip,
    userAgent: request.headers['user-agent'],
  };
}

module.exports = { createAuditLog, extractRequestInfo };
