const fs = require('fs');
let content = fs.readFileSync('src/user/pages/AIAssistant.jsx', 'utf8');
const oldText = '{msg.content}';
const newText = {(() => {
    if (msg.role === 'user') return React.createElement('span', null, msg.content);
    const actionMatch = msg.content.match(/<actions>([\\s\\S]*?)<\\/actions>/);
    const cleanContent = msg.content.replace(/<actions>[\\s\\S]*?<\\/actions>/g, '').trim();
    let actions = [];
    if (actionMatch) { try { actions = JSON.parse(actionMatch[1]); } catch(e) {} }
    return React.createElement(React.Fragment, null,
      React.createElement('span', null, cleanContent),
      actions.length > 0 && React.createElement('div', {className: 'flex flex-wrap gap-2 mt-3'},
        actions.map((a, i) => React.createElement('button', {
          key: i,
          onClick: () => a.path && (window.location.href = a.path),
          className: 'text-xs px-3 py-1.5 rounded-full font-medium',
          style: {background: 'linear-gradient(135deg, #ff6d34, #ff8c5f)', color: '#fff'}
        }, a.label))
      )
    );
  })()};
content = content.replace(oldText, newText);
fs.writeFileSync('src/user/pages/AIAssistant.jsx', content, 'utf8');
console.log('Done! Replaced:', content.includes('actionMatch') ? 'YES' : 'NO');
