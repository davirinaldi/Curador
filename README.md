# AI Curation Toolkit - Engenharia

Ferramenta de curação de conteúdo educacional para cursos de Engenharia com otimização por IA (Gemini).

## 🚀 Características

- ✨ **Criar Unidades Curriculares (UC)** - Organize suas disciplinas de engenharia
- 📚 **Criar Unidades de Aprendizagem (UA)** - Estruture o conteúdo dentro das UCs
- 🎯 **Geração Automática de 4 Cartões** - Ao criar uma UA, 4 cartões são criados automaticamente:
  - 📖 **Teoria** - Material teórico completo com equações e conceitos de engenharia
  - 💻 **Prática** - Exercícios práticos com resolução passo a passo
  - 💡 **Estudo de Caso** - Casos reais da indústria e academia
  - ❓ **Quiz** - Questionários avaliativos com gabarito comentado
- 🤖 **Prompts Prontos para Google Tools** - IA gera prompts detalhados prontos para copiar e colar em:
  - **NotebookLM** - Para conteúdo teórico e estudos de caso
  - **Gemini** - Para geração de conteúdo educacional
  - **Google Colab** - Para exercícios práticos com código Python
- ✏️ **Editar Cartões** - Personalize nível, público-alvo, detalhamento da resposta e objetivos
- 🔄 **Regenerar Prompts** - Gere novos prompts otimizados a qualquer momento
- 📋 **Copiar Prompts** - Botão de cópia rápida para usar nas ferramentas Google
- 🎨 **Design Moderno** - Interface com Tailwind CSS e componentes shadcn/ui
- 🌓 **Dark/Light Mode** - Alterne entre temas claro e escuro
- 📱 **100% Responsivo** - Funciona perfeitamente em desktop, tablet e mobile
- ⚡ **Performance Otimizada** - Loading states, skeletons e transições suaves

## 📋 Pré-requisitos

- Node.js 18+
- npm ou yarn
- Conta Supabase
- API Key do Gemini

## 🔧 Instalação

1. Clone o repositório
```bash
git clone <seu-repositorio>
cd ai-curation-toolkit
```

2. Instale as dependências
```bash
npm install
```

3. Configure as variáveis de ambiente
```bash
cp .env.example .env.local
```

Preencha o `.env.local` com suas credenciais:
```
NEXT_PUBLIC_SUPABASE_URL=sua_url_aqui
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_aqui
NEXT_PUBLIC_GEMINI_API_KEY=sua_chave_aqui
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

4. Configure o banco de dados Supabase

Execute o SQL em seu projeto Supabase:

```sql
-- Tabela de Unidades Curriculares
CREATE TABLE unidades_curriculares (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo VARCHAR(255) NOT NULL,
  descricao TEXT,
  criado_em TIMESTAMP DEFAULT now(),
  atualizado_em TIMESTAMP DEFAULT now()
);

-- Tabela de Unidades de Aprendizagem
CREATE TABLE unidades_aprendizagem (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  uc_id UUID NOT NULL REFERENCES unidades_curriculares(id) ON DELETE CASCADE,
  titulo VARCHAR(255) NOT NULL,
  descricao TEXT,
  criado_em TIMESTAMP DEFAULT now(),
  atualizado_em TIMESTAMP DEFAULT now()
);

-- Tabela de Cartões
CREATE TABLE cartoes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ua_id UUID NOT NULL REFERENCES unidades_aprendizagem(id) ON DELETE CASCADE,
  tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('teoria', 'pratica', 'estudo_caso', 'quiz')),
  nivel_turma VARCHAR(255) NOT NULL,
  publico_alvo VARCHAR(255) NOT NULL,
  detalhamento VARCHAR(255) NOT NULL,
  objetivo_atividade TEXT NOT NULL,
  prompt_gerado JSONB,
  criado_em TIMESTAMP DEFAULT now(),
  atualizado_em TIMESTAMP DEFAULT now()
);

-- Índices
CREATE INDEX idx_ua_uc ON unidades_aprendizagem(uc_id);
CREATE INDEX idx_cartao_ua ON cartoes(ua_id);
```

5. Inicie o servidor de desenvolvimento
```bash
npm run dev
```

Acesse http://localhost:3000

## 📁 Estrutura do Projeto

```
ai-curation-toolkit/
├── app/
│   ├── dashboard/          # Páginas do dashboard
│   ├── layout.tsx          # Layout principal
│   ├── page.tsx            # Home/Landing page
│   └── globals.css         # Estilos globais
├── components/
│   └── ui/                 # Componentes reutilizáveis
├── lib/
│   ├── supabase/           # Cliente Supabase
│   ├── gemini.ts           # Integração com Gemini
│   ├── types.ts            # Tipos TypeScript
│   └── utils.ts            # Funções utilitárias
├── .env.example            # Exemplo de variáveis de ambiente
├── next.config.js          # Configuração do Next.js
├── tailwind.config.ts      # Configuração do Tailwind
└── tsconfig.json           # Configuração do TypeScript
```

## 🎨 Tecnologias Utilizadas

- **Frontend**: Next.js 15 + React 19 + TypeScript
- **Styling**: Tailwind CSS + Glassmorphism
- **Database**: Supabase (PostgreSQL)
- **IA**: Gemini API
- **UI Components**: shadcn/ui inspired

## 🚀 Deploy na Vercel

1. Push seu código para o GitHub
2. Acesse https://vercel.com
3. Conecte seu repositório
4. Configure as variáveis de ambiente
5. Deploy!

## 📝 Licença

MIT

## 👨‍💻 Autor

Desenvolvido com ❤️ para fins educacionais
