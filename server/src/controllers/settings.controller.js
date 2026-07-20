import prisma from '../utils/prisma.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';

export const getSettings = asyncHandler(async (_req, res) => {
  const settings = await prisma.systemSetting.findMany({
    orderBy: { key: 'asc' },
  });

  res.json({
    settings: Object.fromEntries(settings.map((item) => [item.key, item.value])),
  });
});

export const updateSetting = asyncHandler(async (req, res) => {
  const { key, value } = req.body;

  if (!key || typeof key !== 'string') {
    throw ApiError.badRequest('Setting key is required');
  }

  const updated = await prisma.systemSetting.upsert({
    where: { key },
    update: {
      value,
      updatedById: req.user?.id ?? null,
    },
    create: {
      key,
      value,
      updatedById: req.user?.id ?? null,
    },
  });

  res.json({ setting: updated });
});

export default { getSettings, updateSetting };
