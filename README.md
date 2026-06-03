# 🛡 SecOps Quest

Jogo de aprendizado estilo Duolingo para Google SecOps, YARA-L, UDM e SOAR.

---

## 🚀 Deploy no GitHub Pages (passo a passo)

### 1. Criar repositório no GitHub

1. Acesse **github.com** e clique em **New repository**
2. Nome: `secops-quest`
3. Visibilidade: **Public** (obrigatório para GitHub Pages grátis)
4. ✅ Add a README file: **NÃO** (vai usar o deste projeto)
5. Clique **Create repository**

### 2. Enviar o código

No seu terminal local:

```bash
# Clone o repositório vazio
git clone https://github.com/SEU_USUARIO/secops-quest.git
cd secops-quest

# Copie os arquivos do projeto para cá
# (copie: src/, .github/, package.json, build.js, .gitignore, README.md)

# Primeiro commit
git add .
git commit -m "feat: SecOps Quest v1.0 — initial deploy"
git push origin main
```

### 3. Ativar GitHub Pages

1. No repositório, vá em **Settings** → **Pages**
2. Em **Source**, selecione: **GitHub Actions**
3. Salve

Pronto! O GitHub Actions vai:
- Rodar `npm install`
- Rodar `npm run build` (gera `dist/index.html`)
- Fazer deploy automático para Pages

### 4. Acessar o jogo

```
https://SEU_USUARIO.github.io/secops-quest/
```

O deploy leva ~2 minutos. Acompanhe em **Actions** no repositório.

---

## ✏️ Como editar e fazer melhorias

O código fonte está em **`src/App.jsx`** — um único arquivo JSX com todo o jogo.

### Fluxo de edição:

```bash
# Edite src/App.jsx com seu editor preferido (VSCode recomendado)
# Após salvar:
git add src/App.jsx
git commit -m "feat: descrição da melhoria"
git push origin main
# → GitHub Actions faz deploy automático em ~2 min
```

### Testar localmente antes de publicar:

```bash
# Instalar dependências (só na primeira vez)
npm install

# Compilar para dist/
npm run build

# Servir localmente
npm run preview
# Abra: http://localhost:3000
```

### VSCode recomendado:
- Instale a extensão **ES7+ React/Redux/React-Native snippets**
- Instale **Prettier** para formatação automática

---

## 👑 Modo Admin (para testes)

Acesse com o parâmetro `?admin=secops2025` na URL:

```
https://SEU_USUARIO.github.io/secops-quest/?admin=secops2025
```

**O que o modo admin faz:**
- Todos os 7 módulos aparecem desbloqueados e marcados como concluídos
- Badge `👑 ADMIN` aparece no topo da tela
- Badge `👑 MODO ADMIN ATIVO` aparece no perfil
- Permite testar qualquer módulo, lição ou puzzle sem pré-requisitos
- Progresso real do usuário não é afetado

**Para testar localmente:**
```
http://localhost:3000?admin=secops2025
```

---

## 📁 Estrutura do projeto

```
secops-quest/
├── src/
│   └── App.jsx          ← 🎯 CÓDIGO FONTE PRINCIPAL (edite aqui)
├── .github/
│   └── workflows/
│       └── deploy.yml   ← CI/CD auto-deploy
├── build.js             ← Script de compilação
├── package.json         ← Dependências (só esbuild)
├── .gitignore
└── README.md
```

---

## 🔑 Segredo do admin

O código do admin é: **`secops2025`**

Mude em `src/App.jsx` linha:
```js
.get('admin') === 'secops2025'
```

---

## 📊 Módulos do jogo

| # | Módulo | Conteúdo |
|---|--------|----------|
| 0 | 🏛 Conceitos Fundamentais | 7 lições + 14 questões |
| 1 | 🗺 Arquitetura SecOps | Puzzle drag-drop |
| 2 | 🔬 UDM — Modelo de Dados | 7 seções + 13 event types |
| 3 | 📐 YARA-L Básico | 4 lições + skip challenge |
| 4 | 🎮 Missões de Detecção | 15 missões |
| 5 | 🏆 YARA-L Avançado | 7 lições + 14 questões |
| 6 | 🔌 Fluxos e Onboarding | 8 puzzles de fluxo |
