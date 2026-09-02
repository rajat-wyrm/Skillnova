export function resolveOtpMode(role) {
  if (role === 'SUPER_ADMIN' || role === 'ADMIN') return 'admin';
  return 'user';
}
