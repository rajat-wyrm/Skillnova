# SkillNova AI Chatbot — frontend widget

A self-contained React component that talks to the Python backend in
`../ai-backend`. Built as a single IIFE bundle that can be dropped into
any page — no coupling to the main SkillNova frontend.

## Use it standalone (dev playground)

```bash
npm install
npm run dev      # http://localhost:5174
```

The widget is mounted on the page; click the floating bubble.

## Embed it elsewhere

```bash
npm run build    # → dist/skillnova-chatbot.js
```

Then in any HTML page:

```html
<div id="skillnova-chatbot"></div>
<script src="/skillnova-chatbot.js"></script>
```

## Configure

```env
VITE_AI_API_URL=http://localhost:8000   # FastAPI backend
VITE_APP_NAME=SkillNova AI
```

## Lint

```bash
npm run lint
```

Runs in CI on every push to a feature branch.
