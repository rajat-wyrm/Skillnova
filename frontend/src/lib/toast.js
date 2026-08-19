// ════════════════════════════════════════════════════════════
//  Toast notifications (react-hot-toast wrapper)
// ════════════════════════════════════════════════════════════
import toast from 'react-hot-toast';

export const notify = {
  success: (msg) => toast.success(msg),
  error: (msg) => toast.error(msg),
  info: (msg) => toast(msg, { icon: 'ℹ️' }),
  promise: (promise, messages) => toast.promise(promise, messages),
  dismiss: () => toast.dismiss(),
};

export default notify;
