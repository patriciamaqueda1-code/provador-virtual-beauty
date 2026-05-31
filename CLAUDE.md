# Provador Virtual Salão — Projeto ISOLADO

> Micro-app standalone do **Provador Virtual de Salão de Beleza**.
> NÃO mistura com Agentop, Sorteio, Spotlog ou qualquer outro projeto.

## O que é

App web (Vite + React + TS) que usa IA (Gemini 2.5 Flash Image) para:

1. **Unhas (Mãos & Pés):** cliente fotografa o vidro do esmalte + a mão/pé →
   IA aplica a cor exata do esmalte nas unhas da pessoa, mantendo a mão real.
2. **Cabelo:** cliente fotografa o rosto/cabelo + escolhe um corte (ou envia
   foto de referência) + descreve em texto → IA aplica o novo corte mantendo
   **100% da fisionomia/rosto** da pessoa.

## Infra (preencher ao conectar)

| Item | Valor |
|---|---|
| Pasta | `C:\Users\user\Downloads\provador virtual salão` |
| Stack | Vite 6 + React 19 + TypeScript + Tailwind v4 |
| IA | Gemini 2.5 Flash Image (`gemini-2.5-flash-image-preview`) |
| Fallback IA | HuggingFace FLUX.1-Kontext (opcional) |
| Backend | Vercel Serverless Functions (`/api/*`) — chave NUNCA no bundle |
| Supabase | (nenhum — app é stateless, sem login) |
| Vercel projeto | (a definir no primeiro deploy) |
| GitHub | (a definir) |

## Env vars (Vercel + .env local)

```
GEMINI_API_KEY=AIza...        # obrigatória — aistudio.google.com/apikey
HF_TOKEN=hf_...               # opcional — fallback FLUX.1-Kontext
```

> ⚠️ A chave fica SÓ no servidor (sem prefixo VITE_). O frontend chama
> `/api/nail-tryon` e `/api/hair-tryon` que proxyam pro Gemini.

## Regras

- **App stateless:** nada de banco, login ou dados pessoais persistidos.
  As fotos vão pro endpoint, geram a imagem e voltam — não armazenamos nada.
- **FACE_LOCK no cabelo:** o prompt SEMPRE força preservação total do rosto.
  Só o cabelo muda. Nunca alterar feições, tom de pele, olhos, etc.
- **Cor real no esmalte:** mandar a foto do vidro como imagem de referência
  (não só o hex) — a IA reproduz cor + acabamento (glitter/matte/cremoso).
- **Deploy:** `vercel --prod`. Functions precisam Node 22.x (engines no package.json).
