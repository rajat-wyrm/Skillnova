import test from 'node:test';
import assert from 'node:assert/strict';
import prisma from '../src/utils/prisma.js';
import { remove as removeNotification } from '../src/controllers/notifications.controller.js';

test('removing a notification deletes it for the signed-in user', async () => {
  const user = await prisma.user.findFirst({ where: { role: 'INTERN' } });
  assert.ok(user, 'expected an intern user to exist for the test');

  const created = await prisma.notification.create({
    data: {
      userId: user.id,
      type: 'task',
      title: 'Test notification',
      body: 'This should be removable',
    },
  });

  let payload = null;
  const req = {
    user: { id: user.id },
    validatedParams: { id: created.id },
  };
  const res = {
    json(data) {
      payload = data;
      return this;
    },
  };

  await removeNotification(req, res, () => {});

  assert.deepEqual(payload, { ok: true });
  const deleted = await prisma.notification.findUnique({ where: { id: created.id } });
  assert.equal(deleted, null);
});
