# 🚀 Guia de Deploy - Curador de Conteúdo Educacional

Este guia explica como fazer o deploy completo do projeto na Vercel (frontend + backend).

## 📋 Pré-requisitos

- Conta na [Vercel](https://vercel.com)
- Conta no [Supabase](https://supabase.com) (já criada)
- Conta no [GitHub](https://github.com) (repositório já criado)
- Ter aplicado as migrations no Supabase

---

## 🗄️ Passo 1: Aplicar Migrations no Supabase

Antes de fazer deploy, garanta que o banco de dados está atualizado.

### 1.1. Acesse o Supabase
- URL: https://mljqopnuppdkcdjluiam.supabase.co
- Vá em **SQL Editor**

### 1.2. Execute as Migrations

**Migration 002 - Campos da UC:**
```sql
ALTER TABLE unidades_curriculares
ADD COLUMN IF NOT EXISTS periodo_letivo TEXT,
ADD COLUMN IF NOT EXISTS carga_horaria TEXT,
ADD COLUMN IF NOT EXISTS cursos TEXT[],
ADD COLUMN IF NOT EXISTS topicos_geradores TEXT[],
ADD COLUMN IF NOT EXISTS metas_compreensao TEXT[],
ADD COLUMN IF NOT EXISTS desempenho_compreensao TEXT,
ADD COLUMN IF NOT EXISTS ementa TEXT,
ADD COLUMN IF NOT EXISTS certificacao TEXT,
ADD COLUMN IF NOT EXISTS competencias TEXT[],
ADD COLUMN IF NOT EXISTS bibliografia_basica TEXT[],
ADD COLUMN IF NOT EXISTS bibliografia_complementar TEXT[],
ADD COLUMN IF NOT EXISTS conteudo_programatico TEXT;

CREATE INDEX IF NOT EXISTS idx_uc_periodo ON unidades_curriculares(periodo_letivo);
CREATE INDEX IF NOT EXISTS idx_uc_titulo ON unidades_curriculares USING gin(to_tsvector('portuguese', titulo));
```

**Migration 003 - Ajustar Tamanhos dos Campos:**
```sql
ALTER TABLE cartoes
ALTER COLUMN detalhamento TYPE TEXT,
ALTER COLUMN objetivo_atividade TYPE TEXT,
ALTER COLUMN nivel_turma TYPE VARCHAR(100),
ALTER COLUMN publico_alvo TYPE TEXT;
```

---

## 📦 Passo 2: Preparar o Código para Deploy

### 2.1. Commit e Push do Código

```bash
# No diretório raiz do projeto
git add .
git commit -m "feat: adiciona backend PDF parser e funcionalidade de importação

- Backend Express separado para processar PDFs
- Parser otimizado para extrair dados de Planos de Ensino
- Componente de importação com proteção contra duplicação
- Botão de deletar UC com cascade
- Correção de hydration mismatch"

git push origin main
```

---

## 🌐 Passo 3: Deploy do Frontend na Vercel

### 3.1. Acessar Vercel
1. Acesse https://vercel.com
2. Faça login
3. Clique em **Add New** → **Project**

### 3.2. Importar Repositório
1. Selecione seu repositório do GitHub: `davirinaldi/Curador`
2. Clique em **Import**

### 3.3. Configurar o Projeto
- **Framework Preset**: Next.js
- **Root Directory**: `.` (raiz do projeto)
- **Build Command**: `npm run build`
- **Output Directory**: `.next`

### 3.4. Configurar Variáveis de Ambiente

Clique em **Environment Variables** e adicione:

```env
NEXT_PUBLIC_SUPABASE_URL=https://mljqopnuppdkcdjluiam.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1sanFvcG51cHBka2Nkamx1aWFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwODYyMDEsImV4cCI6MjA3ODY2MjIwMX0.Z5Vq0cEdHBU5yOibpgC0GPz7qLS573FFJ6eF1FT4fT8
NEXT_PUBLIC_GEMINI_API_KEY=AIzaSyBe1St_e9ZKmSUEvGfCI27MOUJWckFOmxQ
NEXT_PUBLIC_APP_URL=https://seu-projeto.vercel.app
NEXT_PUBLIC_PDF_API_URL=https://seu-backend-pdf.vercel.app
```

> ⚠️ **Importante**: Você preencherá `NEXT_PUBLIC_PDF_API_URL` depois de fazer deploy do backend.

### 3.5. Deploy
1. Clique em **Deploy**
2. Aguarde o build completar
3. Anote a URL gerada (ex: `https://curador-xxx.vercel.app`)

---

## 🔧 Passo 4: Deploy do Backend PDF na Vercel

### 4.1. Criar Novo Projeto na Vercel
1. Na Vercel, clique em **Add New** → **Project**
2. Selecione o mesmo repositório: `davirinaldi/Curador`
3. Clique em **Import**

### 4.2. Configurar o Backend
- **Framework Preset**: Other
- **Root Directory**: `backend-pdf` ⚠️ **IMPORTANTE**
- **Build Command**: `npm install`
- **Output Directory**: deixe vazio
- **Install Command**: `npm install`

### 4.3. Configurar Variáveis de Ambiente

```env
FRONTEND_URL=https://curador-xxx.vercel.app
```

(Substitua pela URL do frontend do Passo 3.5)

### 4.4. Criar arquivo `vercel.json` no Backend

Antes de fazer deploy, você precisa criar um arquivo de configuração:

```bash
# Ainda não precisa fazer isso agora, vou criar o arquivo para você
```

Crie o arquivo `backend-pdf/vercel.json`:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "src/index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "src/index.js"
    }
  ]
}
```

### 4.5. Commit e Push

```bash
# Depois de criar o vercel.json
git add backend-pdf/vercel.json
git commit -m "chore: adiciona configuração Vercel para backend PDF"
git push origin main
```

### 4.6. Deploy
1. Clique em **Deploy**
2. Aguarde o build completar
3. Anote a URL gerada (ex: `https://curador-backend-xxx.vercel.app`)

---

## 🔗 Passo 5: Conectar Frontend e Backend

### 5.1. Atualizar Variável de Ambiente do Frontend

1. Volte ao projeto do **frontend** na Vercel
2. Vá em **Settings** → **Environment Variables**
3. Edite `NEXT_PUBLIC_PDF_API_URL`
4. Coloque a URL do backend (ex: `https://curador-backend-xxx.vercel.app`)
5. Clique em **Save**

### 5.2. Fazer Redeploy do Frontend

1. Vá em **Deployments**
2. Clique nos 3 pontinhos do último deploy
3. Clique em **Redeploy**
4. Aguarde o build completar

---

## ✅ Passo 6: Testar o Deploy

### 6.1. Teste o Backend
Acesse: `https://seu-backend-pdf.vercel.app`

Você deve ver:
```json
{
  "status": "ok",
  "message": "PDF Parser Backend - Curador de Conteúdo Educacional",
  "version": "1.0.0"
}
```

### 6.2. Teste o Frontend
1. Acesse: `https://seu-projeto.vercel.app`
2. Faça login/crie uma conta
3. Vá no Dashboard
4. Tente criar uma UC manualmente
5. Tente importar um PDF

### 6.3. Teste a Importação de PDF
1. No Dashboard, clique em "Importar PDF"
2. Faça upload do PDF de teste
3. Verifique se os dados são extraídos corretamente
4. Clique em "Salvar no Banco de Dados"
5. Verifique se a UC foi criada

### 6.4. Teste o Botão de Deletar
1. Clique no ícone de lixeira ao lado de uma UC
2. Confirme a exclusão
3. Verifique se a UC foi removida

---

## 🔐 Passo 7: Configurar CORS no Backend (se necessário)

Se tiver problemas de CORS, atualize o backend para aceitar a URL do frontend:

No arquivo `backend-pdf/src/index.js`, a configuração de CORS já está usando a variável de ambiente:

```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}))
```

---

## 📊 Resumo das URLs

Após o deploy completo, você terá:

| Serviço | URL | Descrição |
|---------|-----|-----------|
| Frontend | `https://curador-xxx.vercel.app` | Interface do usuário |
| Backend PDF | `https://curador-backend-xxx.vercel.app` | API de processamento de PDF |
| Supabase | `https://mljqopnuppdkcdjluiam.supabase.co` | Banco de dados |

---

## 🐛 Troubleshooting

### Erro: "Cannot find module"
- Verifique se o `Root Directory` do backend está configurado como `backend-pdf`
- Verifique se o arquivo `vercel.json` está na pasta `backend-pdf`

### Erro: CORS
- Verifique se a variável `FRONTEND_URL` está configurada no backend
- Verifique se a URL está correta (sem `/` no final)

### Erro: "PDF API URL not defined"
- Verifique se `NEXT_PUBLIC_PDF_API_URL` está configurada no frontend
- Faça redeploy do frontend após adicionar a variável

### Erro: "Failed to fetch"
- Verifique se o backend está rodando (acesse a URL diretamente)
- Verifique os logs do backend na Vercel

---

## 🎉 Pronto!

Seu projeto está no ar! Agora você pode:

- ✅ Importar PDFs de Planos de Ensino
- ✅ Criar e gerenciar UCs manualmente
- ✅ Criar UAs e Cartões
- ✅ Otimizar prompts com Gemini AI
- ✅ Deletar UCs com cascade

---

## 📝 Próximos Passos (Opcional)

1. **Configurar domínio customizado** na Vercel
2. **Adicionar analytics** (Vercel Analytics)
3. **Configurar CI/CD** para deploy automático
4. **Adicionar testes automatizados**
5. **Configurar monitoramento** de erros (Sentry)

---

**Desenvolvido com Claude Code** 🤖
