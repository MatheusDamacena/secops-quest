// build.js — gera dist/index.html
// A config Firebase é lida de variáveis de ambiente (GitHub Secrets no CI,
// ou arquivo .env.local no desenvolvimento local). NUNCA fica no código fonte.

const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

// 1. Tentar carregar .env.local para desenvolvimento
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8')
    .split('\n')
    .filter(l => l.trim() && !l.startsWith('#'))
    .forEach(l => {
      const [k, ...v] = l.split('=');
      if (k && v.length) process.env[k.trim()] = v.join('=').trim();
    });
  console.log('📁 Usando config de .env.local');
}

// 2. Ler config Firebase das variáveis de ambiente
const fbConfig = {
  apiKey:            process.env.FB_API_KEY,
  authDomain:        process.env.FB_AUTH_DOMAIN,
  projectId:         process.env.FB_PROJECT_ID,
  storageBucket:     process.env.FB_STORAGE_BUCKET,
  messagingSenderId: process.env.FB_MESSAGING_SENDER_ID,
  appId:             process.env.FB_APP_ID,
};

const hasFirebase = !!fbConfig.apiKey;
if (hasFirebase) {
  console.log(`🔥 Firebase configurado (projeto: ${fbConfig.projectId})`);
} else {
  console.log('⚠️  Firebase não configurado — build em modo local-only');
}

// 3. Compilar JSX
const result = esbuild.buildSync({
  entryPoints: ['src/App.jsx'],
  bundle: false,
  write: false,
  loader: { '.jsx': 'jsx' },
  jsx: 'transform',
  jsxFactory: 'React.createElement',
  jsxFragment: 'React.Fragment',
});

const jsCode = result.outputFiles[0].text;

// 4. Gerar HTML
const outDir = path.join(__dirname, 'dist');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

const firebaseScripts = hasFirebase ? `
  <!-- Firebase SDKs -->
  <script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-auth-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore-compat.js"></script>
  <!-- Config injetada em build-time pelo CI/CD — não está no código fonte -->
  <script>window.FIREBASE_CONFIG = ${JSON.stringify(fbConfig)};</script>` : '';

const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
  <meta name="description" content="SecOps Quest — Aprenda Google SecOps estilo Duolingo">
  <title>SecOps Quest</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;800;900&family=Roboto+Mono:wght@400;500;700&display=swap" rel="stylesheet">
  <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  ${firebaseScripts}
  <style>*{margin:0;padding:0;box-sizing:border-box}body{background:#0a0b0c;-webkit-font-smoothing:antialiased}::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:rgba(255,255,255,.08);border-radius:2px}</style>
</head>
<body>
  <div id="root"></div>
  <script>
    ${jsCode}
    ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(App));
  </script>
</body>
</html>`;

const outFile = path.join(outDir, 'index.html');
fs.writeFileSync(outFile, html);
const kb = Math.round(html.length / 1024);
console.log(`✅ Build concluído → dist/index.html (${kb} KB) [Firebase: ${hasFirebase ? '✅' : '❌'}]`);
