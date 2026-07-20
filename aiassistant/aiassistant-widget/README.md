# SkillNova AIAssistant — frontend widget

A self-contained React component that talks to the Python backend in
`../aiassistant-backend`. Built as a single IIFE bundle so the
**AIAssistant** can be dropped into any HTML page — including the
SkillNova user, mentor and admin apps.

## Use it standalone (dev playground)

```bash
npm install
npm run dev      # http://localhost:5174
```

The widget is mounted on the page; click the floating "AI" bubble.

## Embed it elsewhere

```bash
npm run build    # → dist/aiassistant.js
```

Then in any HTML page:

```html
<div id="aiassistant"></div>
<script src="/aiassistant.js"></script>
```

The widget reads the current user's role from `localStorage` (under
`skillnova-auth` or `auth`) and forwards it to the backend, so the
AIAssistant tailors answers to whoever is logged in.

## Configure

```env
VITE_AIASSISTANT_URL=http://localhost:8000   # FastAPI backend
VITE_APP_NAME=AIAssistant
```

## Lint

```bash
npm run lint
```

Runs in CI on every push to a feature branch.
