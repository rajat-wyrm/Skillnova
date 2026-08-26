// ════════════════════════════════════════════════════════════
//  Notification Preferences — per-user, per-type
// ════════════════════════════════════════════════════════════
import { z } from 'zod';
import prisma from '../utils/prisma.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const _schema = z.object({
  emailEnabled: z.boolean().optional(),
  pushEnabled: z.boolean().optional(),
  inAppEnabled: z.boolean().optional(),
  typePrefs: z.record(z.boolean()).optional(),
  quietFrom: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
  quietTo: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
});

export const get = asyncHandler(async (req, res) => {
  let pref = await prisma.notificationPref.findUnique({ where: { userId: req.user.id } });
  if (!pref) {
    pref = await prisma.notificationPref.create({
      data: { userId: req.user.id, typePrefs: {} },
    });
  }
  res.json({ pref });
});

export const update = asyncHandler(async (req, res) => {
  const data = req.body;
  const pref = await prisma.notificationPref.upsert({
    where: { userId: req.user.id },
    update: data,
    create: { userId: req.user.id, typePrefs: {}, ...data },
  });
  res.json({ pref });
});

export default { get, update };
