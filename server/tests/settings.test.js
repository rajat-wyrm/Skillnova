import test from 'node:test';
import assert from 'node:assert/strict';
import prisma from '../src/utils/prisma.js';

test('system settings can be created and read back', async () => {
  const key = `test-setting-${Date.now()}`;
  await prisma.systemSetting.upsert({
    where: { key },
    update: { value: { enabled: true } },
    create: { key, value: { enabled: true } },
  });

  const stored = await prisma.systemSetting.findUnique({ where: { key } });
  assert.ok(stored);
  assert.deepEqual(stored.value, { enabled: true });
});
