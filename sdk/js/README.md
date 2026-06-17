# SkillNova JavaScript SDK

Zero-dependency client for the SkillNova AI chatbot.

## Quick start

```js
import { SkillnovaClient } from "./sdk/js/skillnova.js";

const chat = new SkillnovaClient({
  baseUrl: "https://api.example.com",
  role: "Intern",
});

// Warm up the UI with the suggestion chips and capability list.
const { suggestions, capabilities, welcomeMessage } = await chat.bootstrap();

// One-shot JSON chat.
const result = await chat.chat({ message: "How do I submit a task?" });
console.log(result.reply);

// Stream tokens.
for await (const token of chat.stream({ message: "Tell me about reports." })) {
  document.getElementById("output").append(token);
}

// Feedback loop.
await chat.sendFeedback({ message: result.reply, rating: 1 });
```

## API

### `new SkillnovaClient({ baseUrl, sessionId?, role?, timeoutMs?, fetch? })`

- `baseUrl` — required. No trailing slash.
- `sessionId` — optional. Auto-generated if absent.
- `role` — default `"Intern"`.
- `timeoutMs` — default 30 s. Streaming calls get `4 * timeoutMs`.
- `fetch` — optional override (Node 18+, browser, custom polyfill).
- `onError` — optional error sink.

### Methods

| Method | Returns | Description |
|---|---|---|
| `bootstrap()` | `{ suggestions, capabilities, welcomeMessage }` | Parallel fetch of the 3 `/api/ai/*` helpers |
| `getSuggestions()` | `{ data: [...] }` | Suggestion chips |
| `getCapabilities()` | `{ data: [...] }` | Capability list |
| `getWelcomeMessage()` | `{ message }` | Greeting |
| `getSession()` | `{ session_id }` | New session id from the server |
| `chat({ message, sessionId?, role? })` | `ChatResponse` | One-shot JSON chat |
| `stream({ message, sessionId?, role? })` | `AsyncIterable<string>` | SSE token stream |
| `sendFeedback({ message, rating, comment?, sessionId? })` | `{ ok: true }` | Record a feedback vote |
| `health()` | `{ status, uptime_s, ... }` | Readiness check |

## Browser usage (no build step)

```html
<script type="module">
  import { SkillnovaClient } from "https://cdn.example.com/sdk/js/skillnova.js";
  // ...
</script>
```

## Node usage

```js
// Node 18+ has fetch built-in. Older Node needs a polyfill.
import { SkillnovaClient } from "./skillnova.js";
const chat = new SkillnovaClient({ baseUrl: process.env.SKILLNOVA_URL });
console.log((await chat.chat({ message: "ping" })).reply);
```

## Error handling

Network and HTTP errors throw an `Error`. Stream consumers should wrap
the `for await` in `try/catch` and surface the message to the user.

```js
try {
  for await (const token of chat.stream({ message })) {
    // ...
  }
} catch (e) {
  console.error("Chat failed:", e.message);
}
```