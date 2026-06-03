const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n')
    .filter(l => l.trim() && !l.startsWith('#'))
    .forEach(l => { const [k,...v]=l.split('='); if(k&&v.length) process.env[k.trim()]=v.join('=').trim(); });
}

const fbConfig = {
  apiKey: process.env.FB_API_KEY,
  authDomain: process.env.FB_AUTH_DOMAIN,
  projectId: process.env.FB_PROJECT_ID,
  storageBucket: process.env.FB_STORAGE_BUCKET,
  messagingSenderId: process.env.FB_MESSAGING_SENDER_ID,
  appId: process.env.FB_APP_ID,
};
const hasFirebase = !!fbConfig.apiKey;

const result = esbuild.buildSync({
  entryPoints: ['src/App.jsx'],
  bundle: false, write: false,
  loader: { '.jsx': 'jsx' },
  jsx: 'transform',
  jsxFactory: 'React.createElement',
  jsxFragment: 'React.Fragment',
});

let jsCode = result.outputFiles[0].text
  .replace(/^import\s+.*$/gm, '')
  .replace('export default function App()', 'function App()')
  .replace('export default App;', '');

const outDir = path.join(__dirname, 'dist');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

const firebaseScripts = hasFirebase
  ? '<script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js"></script>' +
    '<script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-auth-compat.js"></script>' +
    '<script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore-compat.js"></script>' +
    '<script>window.FIREBASE_CONFIG=' + JSON.stringify(fbConfig) + ';</script>'
  : '';

const html = '<!DOCTYPE html>\n<html lang="pt-BR">\n<head>\n' +
  '<meta charset="UTF-8">\n' +
  '<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">\n' +
  '<title>SecOps Quest</title>\n' +
  '<link rel="preconnect" href="https://fonts.googleapis.com">\n' +
  '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;800;900&family=Roboto+Mono:wght@400;500;700&display=swap" rel="stylesheet">\n' +
  '<script src="https://unpkg.com/react@18/umd/react.production.min.js"><\/script>\n' +
  '<script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"><\/script>\n' +
  firebaseScripts + '\n' +
  '<style>*{margin:0;padding:0;box-sizing:border-box}body{background:#0a0b0c;-webkit-font-smoothing:antialiased}::-webkit-scrollbar{width:4px}</style>\n' +
  '</head>\n<body>\n<div id="root"></div>\n' +
  '<script>\n' +
  'const { useState, useEffect, useRef } = React;\n' +
  jsCode + '\n' +
  "ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(App));\n" +
  '<\/script>\n</body>\n</html>';

fs.writeFileSync(path.join(outDir, 'index.html'), html);
console.log('Build OK -> ' + Math.round(html.length/1024) + 'KB Firebase:' + hasFirebase);
