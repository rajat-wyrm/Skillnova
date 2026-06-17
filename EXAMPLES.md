# Examples

Copy-pasteable curl commands for every public endpoint. Replace
`$HOST` with `http://localhost:5000` (or your deployment URL).

## Python chatbot

### Health
```bash
curl $HOST/
curl $HOST/api/health
curl $HOST/api/metrics
```

### New session
```bash
curl $HOST/api/session
# {"session_id":"e5b1…"}
```

### Chat (one-shot)
```bash
curl -X POST $HOST/api/chat \
  -H 'Content-Type: application/json' \
  -d '{"message":"What is the attendance policy?"}'
```

### Chat (stream)
```bash
curl -N -X POST $HOST/api/chat/stream \
  -H 'Content-Type: application/json' \
  -d '{"message":"Tell me about InternOps."}'
```

### WebSocket
```bash
# Requires the `wscat` CLI (npm i -g wscat)
wscat -c ws://localhost:5000/api/ws/chat \
  -H 'Origin: http://localhost:5000'
> {"type":"chat","message":"hello","role":"Intern"}
< {"type":"ready","session_id":"…"}
< {"type":"token","content":"Hello "}
< {"type":"token","content":"there! "}
< {"type":"done","confidence":0.92,"sources":[]}
```

### Feedback
```bash
curl -X POST $HOST/api/feedback \
  -H 'Content-Type: application/json' \
  -d '{"session_id":"e5b1…","message":"thanks","rating":1,"comment":"very helpful"}'
```

### Admin (token-gated)
```bash
curl $HOST/api/admin/stats -H "X-Admin-Token: $ADMIN_TOKEN"
curl "$HOST/api/admin/recent?limit=20" -H "X-Admin-Token: $ADMIN_TOKEN"
```

### Frontend aliases
```bash
curl $HOST/api/ai/suggestions
curl $HOST/api/ai/capabilities
curl $HOST/api/ai/welcome-message
curl -X POST $HOST/api/ai/chat \
  -H 'Content-Type: application/json' \
  -d '{"message":"How do I submit a task?"}'
```

## Node InternOps

### Health
```bash
curl $HOST/health
curl $HOST/health/db
curl $HOST/health/full
curl $HOST/metrics
```

### CSRF token (needed for state-changing calls)
```bash
CSRF=$(curl -s -c /tmp/cookies.txt $HOST/api/auth/csrf-token | jq -r .csrfToken)
```

### Login
```bash
curl -X POST $HOST/api/auth/login \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: $CSRF" \
  -d '{"email":"admin@internops.com","password":"Admin@123"}'
```

### Authenticated request
```bash
TOKEN="paste_access_token_here"
curl $HOST/api/users/me \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-CSRF-Token: $CSRF"
```

### Departments list
```bash
curl $HOST/api/departments \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-CSRF-Token: $CSRF"
```

### Upload an image
```bash
curl -X POST $HOST/api/uploads \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-CSRF-Token: $CSRF" \
  -F "file=@/path/to/image.png"
```

### WebSocket chat (bridge to Python chatbot)
```bash
wscat -c ws://localhost:5000/api/ws/chat \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-CSRF-Token: $CSRF"
> {"type":"chat","message":"What is InternOps?","role":"Intern"}
```

## End-to-end smoke

```bash
# 1. Boot the stack
./scripts/up.sh up

# 2. Wait ~10s, then curl every endpoint
./scripts/verify.sh

# 3. Tail logs
./scripts/up.sh logs

# 4. Tear down
./scripts/up.sh down
```