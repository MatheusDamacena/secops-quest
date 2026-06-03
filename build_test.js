const esbuild = require('/tmp/node_modules/esbuild');
const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, 'dist');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

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
const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<title>SecOps Quest</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;800;900&family=Roboto+Mono:wght@400;500;700&display=swap" rel="stylesheet">
<script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
<script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
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

fs.writeFileSync(path.join(outDir, 'index.html'), html);
console.log('Build: ' + Math.round(html.length/1024) + ' KB → dist/index.html');
