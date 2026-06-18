// Tiny dev playground — opens a page with just the widget so the
// frontend can be iterated on without the main SkillNova app.
import React from 'react';
import { createRoot } from 'react-dom/client';
import { ChatbotWidget } from './widget.jsx';

function Demo() {
  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: '#fff' }}>
      <header style={{ padding: 24 }}>
        <h1>SkillNova AI Chatbot — dev playground</h1>
        <p style={{ opacity: 0.7 }}>
          The chat bubble in the bottom-right talks to the FastAPI backend
          at <code>VITE_AI_API_URL</code>. Click it to start a conversation.
        </p>
      </header>
      <ChatbotWidget />
    </div>
  );
}

createRoot(document.getElementById('root')).render(<Demo />);
