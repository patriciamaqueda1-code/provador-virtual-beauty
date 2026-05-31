# 💅✂️ Provador Virtual de Salão

App web que usa **IA (Gemini 2.5 Flash Image)** para simular cortes de cabelo e
cores de esmalte **antes** do cliente fazer — direto da câmera do celular.

## ✨ Funcionalidades

### Unhas (Mãos & Pés)
1. Fotografe o **vidro do esmalte** → a IA detecta a cor
2. Fotografe a **mão ou pé** do cliente
3. A IA aplica a **cor real** do esmalte nas unhas, mantendo a mão da pessoa

### Cabelo (Cortes & Cores)
1. Tire até **3 fotos** do rosto/cabelo (mais fotos = rosto mais fiel)
2. Escolha entre **12 cortes** ou envie uma **foto de referência**
3. Descreva em texto livre (cor, comprimento, franja, volume…)
4. A IA aplica o novo corte **preservando 100% do rosto** (FACE_LOCK)
5. Veja o resultado em **Antes / Depois**

## 🏗️ Stack

- **Frontend:** Vite 6 + React 19 + TypeScript + Tailwind CSS v4
- **IA:** Gemini 2.5 Flash Image (`gemini-2.5-flash-image-preview`)
- **Backend:** Vercel Serverless Functions (`/api/*`) — chave protegida no servidor
- **Stateless:** sem login, sem banco, fotos não são armazenadas

## 🔑 Variáveis de ambiente

Copie `.env.example` para `.env`:

```bash
GEMINI_API_KEY=AIza...   # obrigatória — https://aistudio.google.com/apikey
HF_TOKEN=hf_...          # opcional — fallback
```

No Vercel, adicione as mesmas em **Settings → Environment Variables**.

## 🚀 Rodar localmente

```bash
npm install
npm run dev       # http://localhost:5173
```

## 📦 Deploy

```bash
npm run build     # gera dist/
vercel --prod     # ou conecte o repo no dashboard da Vercel
```

> Functions exigem **Node 22.x** (definido em `package.json` → engines).

## 📁 Estrutura

```
api/
  _lib/gemini.ts     # helper de geração de imagem (multi-foto)
  nail-tryon.ts      # endpoint unhas
  hair-tryon.ts      # endpoint cabelo (FACE_LOCK)
src/
  components/
    Home.tsx         # tela inicial
    NailTryOn.tsx    # fluxo de unhas
    HairTryOn.tsx    # fluxo de cabelo
  lib/camera.ts      # câmera + extração de cor
```
