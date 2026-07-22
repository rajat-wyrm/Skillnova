# Troubleshooting Guide

## Common Issues

### Database Connection Errors

**Error:** `P1001: Can't reach database server`

**Solution:**
1. Verify your `DATABASE_URL` in `server/.env`
2. Ensure PostgreSQL is running
3. Check firewall rules
4. Verify credentials

**Error:** `P1012: PrismaClientInitializationError`

**Solution:**
1. Run `npm run prisma:generate` in the server directory
2. Ensure `DATABASE_URL` starts with `postgresql://` or `postgres://`
3. Check if the database exists

### Authentication Issues

**Error:** `401 Unauthorized`

**Solution:**
1. Ensure you're sending a valid JWT token
2. Check token expiration
3. Verify the `Authorization: Bearer <token>` header format
4. Ensure the user account is not suspended

**Error:** `403 Forbidden - CSRF token missing or invalid`

**Solution:**
1. Fetch a CSRF token from `/api/v1/auth/csrf-token`
2. Include the token in the `X-CSRF-Token` header
3. Ensure the cookie and header values match

### Redis Connection Issues

**Warning:** `Redis not configured — using in-memory store`

**Solution:**
1. Set `UPSTASH_REDIS_REST_URL` in `server/.env`
2. Set `UPSTASH_REDIS_REST_TOKEN` in `server/.env`
3. Data will not persist across restarts without Redis

### Build Errors

**Error:** `Module not found`

**Solution:**
1. Run `npm install` in the project root
2. Run `npm run server:install` for server dependencies
3. Clear `node_modules` and reinstall

**Error:** `Vite build failed`

**Solution:**
1. Check for syntax errors in your code
2. Ensure all imports are correct
3. Verify environment variables are set

### Port Already in Use

**Error:** `EADDRINUSE: address already in use :::4000`

**Solution:**
1. Kill the process using the port: `lsof -ti:4000 | xargs kill -9`
2. Or change the port in `server/.env`: `PORT=4001`

### File Upload Issues

**Error:** `Unsupported file type`

**Solution:**
1. Check the file MIME type
2. Ensure the file type is in the allowed list
3. Maximum file size is 25MB

### Socket Connection Issues

**Error:** `WebSocket connection failed`

**Solution:**
1. Ensure the backend server is running
2. Check CORS configuration
3. Verify the socket URL is correct
4. Check firewall rules for WebSocket connections

### Prisma Migration Issues

**Error:** `Migration already applied`

**Solution:**
1. Run `npx prisma migrate status` to check migration status
2. If needed, reset the database: `npx prisma migrate reset`
3. Re-run migrations: `npx prisma migrate dev`

### Environment Variable Issues

**Error:** `Missing required environment variables`

**Solution:**
1. Copy `server/.env.example` to `server/.env`
2. Fill in all required values
3. Generate secrets with: `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`

### Google OAuth Issues

**Error:** `Google sign-in is not enabled`

**Solution:**
1. Set `GOOGLE_OAUTH_ENABLED=true` in `server/.env`
2. Add your Google Client ID and Secret
3. Configure the callback URL in Google Cloud Console

### AI Assistant Issues

**Error:** `AI service unavailable`

**Solution:**
1. Ensure `GROQ_API_KEY` is set in `server/.env`
2. Check the API key is valid
3. Verify network connectivity

### Performance Issues

**Symptoms:** Slow API responses

**Solution:**
1. Check database query performance
2. Verify Redis cache is working
3. Monitor memory usage
4. Check for N+1 query problems

## Getting Help

If you're still experiencing issues:

1. Check the [GitHub Issues](https://github.com/rajat-wyrm/Skillnova/issues)
2. Search for similar problems
3. Open a new issue with:
   - Error message
   - Steps to reproduce
   - Environment details
   - Screenshots if applicable

## Logs

### Server Logs

Server logs are output to stdout in development:

```bash
npm run dev
```

In production, logs are structured JSON:

```bash
npm run prod
```

### Frontend Logs

Check the browser console for frontend errors.

### Database Logs

Check PostgreSQL logs for database issues:

```bash
# Linux
tail -f /var/log/postgresql/postgresql-*.log

# macOS
tail -f /usr/local/var/log/postgres.log
```

## Debug Mode

Enable debug mode:

```bash
DEBUG=* npm run dev
```

Or for specific modules:

```bash
DEBUG=prisma:* npm run dev
```

## Health Checks

Verify system health:

```bash
# Basic health
curl http://localhost:4000/healthz

# Readiness
curl http://localhost:4000/healthz/ready

# Liveness
curl http://localhost:4000/healthz/live

# Database
curl http://localhost:4000/healthz/db

# Disk
curl http://localhost:4000/healthz/disk
```
