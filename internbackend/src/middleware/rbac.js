function rbac(...roles) {
  return (request, reply, done) => {
    if (!request.user || !roles.includes(request.user.role)) {
      return reply.status(403).send({ error: 'Forbidden' });
    }
    done();
  };
}
module.exports = rbac;