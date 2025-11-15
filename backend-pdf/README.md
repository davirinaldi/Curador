# PDF Parser Backend

Backend para processamento de PDFs de Planos de Ensino do projeto Curador de Conteúdo Educacional.

## Funcionalidades

- Recebe PDFs de Planos de Ensino via upload
- Extrai texto usando pdf-parse
- Parseia informações estruturadas (UC, UAs, tópicos, metas, etc.)
- Retorna JSON estruturado para o frontend

## Tecnologias

- Node.js (ESM)
- Express
- pdf-parse
- multer (upload de arquivos)
- cors

## Instalação

```bash
npm install
```

## Desenvolvimento Local

```bash
npm run dev
```

O servidor rodará em `http://localhost:3001`

## Produção

```bash
npm start
```

## Deploy na Railway

1. Crie um novo projeto na Railway
2. Conecte este repositório
3. Configure as variáveis de ambiente:
   - `PORT` (Railway define automaticamente)
   - `FRONTEND_URL` (URL do frontend em produção, ex: https://curador.vercel.app)
4. Deploy automático será feito

## API

### POST /parse-pdf

Processa um arquivo PDF e retorna dados estruturados.

**Request:**
- Content-Type: `multipart/form-data`
- Campo: `pdf` (arquivo PDF)

**Response:**
```json
{
  "success": true,
  "data": {
    "unidade_curricular": {
      "titulo": "...",
      "periodo_letivo": "2025/1",
      "carga_horaria": "160h",
      "cursos": ["..."],
      "topicos_geradores": ["..."],
      "metas_compreensao": ["..."],
      ...
    },
    "unidades_aprendizagem": [
      {
        "titulo": "...",
        "descricao": "..."
      }
    ]
  }
}
```

**Limites:**
- Tamanho máximo do arquivo: 10MB
- Apenas arquivos PDF

## Variáveis de Ambiente

- `PORT`: Porta do servidor (padrão: 3001)
- `FRONTEND_URL`: URL do frontend para CORS (padrão: *)
