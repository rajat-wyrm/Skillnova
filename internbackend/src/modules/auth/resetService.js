const { BadRequestError } = require('../../utils/errors');
const repo = require('./resetRepository');
const userRepo = require('./repository');
const emailService = require('../../services/email');
const { createAuditLog, extractRequestInfo } = require('../../utils/audit');

async function forgotPassword(email, requestInfo) {
  const user = await userRepo.findByEmail(email);
  if (!user) throw new Error('If that email exists, a reset link has been sent.');
  const token = await repo.createResetToken(user.id);
  await emailService.sendEmail({
    to: email,
    subject: 'InternOps - Password Reset',
    body: `Your password reset token: ${token} (valid for 15 minutes)`,
  });
  await createAuditLog({
    userId: user.id,
    action: 'PASSWORD_RESET_REQUESTED',
    resourceType: 'user',
    resourceId: user.id,
    ...requestInfo,
  });
}

async function resetPassword(token, newPassword, requestInfo) {
  const record = await repo.verifyResetToken(token);
  if (!record) throw new BadRequestError('Invalid or expired reset token');
  await repo.updateUserPassword(record.user_id, newPassword);
  await repo.markTokenUsed(token);
  await createAuditLog({
    userId: record.user_id,
    action: 'PASSWORD_RESET_COMPLETED',
    resourceType: 'user',
    resourceId: record.user_id,
    ...requestInfo,
  });
}

module.exports = { forgotPassword, resetPassword };
