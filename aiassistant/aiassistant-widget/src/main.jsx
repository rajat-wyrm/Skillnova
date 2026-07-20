// Tiny dev playground — opens a page with just the AIAssistant widget
// so it can be iterated on without the main SkillNova app.
import React from 'react';
import { createRoot } from 'react-dom/client';
import { AIAssistantWidget } from './widget.jsx';

function Demo() {
  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: '#fff' }}>
      <header style={{ padding: 24 }}>
        <h1>SkillNova AIAssistant — dev playground</h1>
        <p style={{ opacity: 0.7 }}>
          The chat bubble in the bottom-right talks to the FastAPI backend
          at <code>VITE_AIASSISTANT_URL</code>. Click it to start a conversation.
        </p>
      </header>
      <AIAssistantWidget />
    </div>
  );
}

createRoot(document.getElementById('root')).render(<Demo />);
