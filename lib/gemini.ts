import axios from 'axios'

const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY

export interface ParametrosCartao {
  tipo: 'teoria' | 'pratica' | 'estudo_caso' | 'quiz'
  nivel_turma: string
  publico_alvo: string
  detalhamento: string
  objetivo_atividade: string
}

// Configuração de ferramentas por tipo de cartão
const FERRAMENTAS_CONFIG = {
  teoria: {
    ferramenta: 'NotebookLM' as const,
    justificativa: 'Para conteúdo teórico extenso com conceitos complexos, equações e referências',
    formato_ideal: 'Texto estruturado com seções, equações LaTeX e referências bibliográficas'
  },
  pratica: {
    ferramenta: 'Google Colab' as const,
    justificativa: 'Para exercícios práticos com código, simulações e análises interativas',
    formato_ideal: 'Notebooks Jupyter com células de código Python, visualizações e markdown explicativo'
  },
  estudo_caso: {
    ferramenta: 'NotebookLM' as const,
    justificativa: 'Para análise profunda de casos reais com múltiplas fontes e contexto detalhado',
    formato_ideal: 'Análise estruturada com contexto, problema, solução e conclusões'
  },
  quiz: {
    ferramenta: 'Gemini' as const,
    justificativa: 'Para geração rápida de questões objetivas e avaliativas',
    formato_ideal: 'Lista de questões com alternativas, gabarito e justificativas'
  }
}

// Templates de prompts especializados por tipo
const PROMPT_TEMPLATES = {
  teoria: {
    estrutura: `
CONTEXTO PEDAGÓGICO:
- Disciplina: Engenharia
- Nível: {nivel_turma}
- Público: {publico_alvo}
- Detalhamento: {detalhamento}

OBJETIVO DE APRENDIZAGEM:
{objetivo_atividade}

TAREFA:
Crie um material teórico completo e didático que aborde os conceitos fundamentais, equações relevantes,
aplicações práticas e normas técnicas relacionadas ao objetivo acima.

ESTRUTURA OBRIGATÓRIA:
1. Introdução - Contextualização do tema (2-3 parágrafos)
2. Fundamentação Teórica - Conceitos principais com equações e definições
3. Aplicações em Engenharia - Casos práticos e exemplos reais
4. Normas e Padrões Técnicos - Normas ABNT, ISO ou outras relevantes
5. Exercícios de Fixação - 3-5 questões conceituais
6. Referências Bibliográficas - Fontes acadêmicas atualizadas

REQUISITOS DE QUALIDADE:
- Use linguagem técnica precisa, mas acessível ao nível especificado
- Inclua equações em formato LaTeX quando necessário
- Cite normas técnicas relevantes (ABNT, ISO, IEEE, etc.)
- Forneça exemplos numéricos resolvidos
- Relacione teoria com aplicações práticas da engenharia
- Extensão: 800-1200 palavras`,

    instrucoes_uso: `
1. Copie o prompt completo abaixo
2. Acesse NotebookLM (https://notebooklm.google.com)
3. Crie um novo notebook ou abra um existente
4. Cole o prompt no campo de texto
5. A IA gerará um material teórico estruturado e completo
6. Você pode fazer perguntas adicionais para aprofundar conceitos específicos`
  },

  pratica: {
    estrutura: `
CONTEXTO PEDAGÓGICO:
- Disciplina: Engenharia
- Nível: {nivel_turma}
- Público: {publico_alvo}
- Detalhamento: {detalhamento}

OBJETIVO DE APRENDIZAGEM:
{objetivo_atividade}

TAREFA:
Crie um exercício prático completo com código Python executável, incluindo simulações,
análises numéricas e visualizações que permitam ao aluno aplicar os conceitos teóricos.

ESTRUTURA OBRIGATÓRIA:
1. Introdução ao Problema - Descrição clara do desafio prático
2. Fundamentos Teóricos - Breve revisão dos conceitos necessários
3. Implementação em Python:
   - Setup e importação de bibliotecas (numpy, matplotlib, pandas, scipy)
   - Código comentado e modular
   - Validação de resultados
4. Análise de Resultados - Interpretação técnica dos outputs
5. Visualizações - Gráficos e plots relevantes
6. Exercícios Complementares - Variações do problema para prática

REQUISITOS TÉCNICOS:
- Use Python 3.x com bibliotecas padrão de engenharia (NumPy, SciPy, Matplotlib, Pandas)
- Código deve ser executável no Google Colab
- Inclua células markdown para explicações
- Forneça dados de exemplo ou geração de dados sintéticos
- Comente o código de forma didática
- Adicione verificações de sanidade e validações
- Extensão: 400-700 palavras + código`,

    instrucoes_uso: `
1. Copie o prompt completo abaixo
2. Acesse Google Colab (https://colab.research.google.com)
3. Crie um novo notebook
4. Cole o prompt em uma célula de texto (markdown)
5. Execute as células de código geradas
6. A IA criará um exercício prático executável com simulações e análises
7. Você pode modificar parâmetros e explorar variações do problema`
  },

  estudo_caso: {
    estrutura: `
CONTEXTO PEDAGÓGICO:
- Disciplina: Engenharia
- Nível: {nivel_turma}
- Público: {publico_alvo}
- Detalhamento: {detalhamento}

OBJETIVO DE APRENDIZAGEM:
{objetivo_atividade}

TAREFA:
Desenvolva um estudo de caso completo baseado em uma situação real de engenharia,
incluindo contexto, problema, análise técnica, solução proposta e lições aprendidas.

ESTRUTURA OBRIGATÓRIA:
1. Contexto do Caso - Empresa, projeto, setor e desafios
2. Definição do Problema - Descrição técnica clara do desafio
3. Análise Técnica:
   - Dados relevantes e especificações
   - Restrições e limitações
   - Normas aplicáveis
4. Metodologia de Solução - Abordagens e ferramentas utilizadas
5. Resultados Obtidos - Soluções implementadas com métricas
6. Discussão Crítica - Análise de trade-offs e alternativas
7. Lições Aprendidas - Insights para aplicação futura
8. Questões para Reflexão - 4-6 questões analíticas

REQUISITOS DE QUALIDADE:
- Baseie-se em casos reais ou realistas da engenharia
- Inclua dados quantitativos e especificações técnicas
- Cite normas, códigos e regulamentações aplicáveis
- Apresente múltiplas perspectivas de solução
- Relacione com tendências atuais da engenharia
- Extensão: 900-1500 palavras`,

    instrucoes_uso: `
1. Copie o prompt completo abaixo
2. Acesse NotebookLM (https://notebooklm.google.com)
3. Crie um novo notebook
4. Cole o prompt no campo de texto
5. Opcionalmente, adicione fontes externas (artigos, papers, normas técnicas)
6. A IA gerará um estudo de caso detalhado e realista
7. Use as questões de reflexão para promover discussões em sala de aula`
  },

  quiz: {
    estrutura: `
CONTEXTO PEDAGÓGICO:
- Disciplina: Engenharia
- Nível: {nivel_turma}
- Público: {publico_alvo}
- Detalhamento: {detalhamento}

OBJETIVO DE APRENDIZAGEM:
{objetivo_atividade}

TAREFA:
Crie um questionário avaliativo completo com questões de múltipla escolha, verdadeiro/falso
e questões discursivas curtas para avaliar a compreensão do objetivo de aprendizagem.

ESTRUTURA OBRIGATÓRIA:
1. Questões de Múltipla Escolha (8-10 questões):
   - Uma alternativa correta e 4 distratores plausíveis
   - Nível progressivo de dificuldade (básico → intermediário → avançado)
   - Inclua cálculos, aplicações práticas e conceitos teóricos

2. Questões Verdadeiro/Falso (5-7 questões):
   - Afirmações claras sobre conceitos fundamentais
   - Justificativa da resposta correta

3. Questões Discursivas Curtas (3-4 questões):
   - Respostas esperadas de 3-5 linhas
   - Foco em aplicação e análise crítica

4. Gabarito Comentado:
   - Resposta correta
   - Justificativa técnica detalhada
   - Referências aos conceitos relacionados

REQUISITOS DE QUALIDADE:
- Questões devem testar compreensão, aplicação e análise (não apenas memorização)
- Use terminologia técnica precisa
- Inclua questões com cálculos práticos quando aplicável
- Evite pegadinhas ou ambiguidades
- Forneça feedback formativo nas justificativas
- Total: 16-21 questões`,

    instrucoes_uso: `
1. Copie o prompt completo abaixo
2. Acesse Gemini (https://gemini.google.com) ou cole direto no campo abaixo
3. Cole o prompt e execute
4. A IA gerará um questionário completo com gabarito
5. Revise as questões e ajuste conforme necessário
6. Você pode pedir variações ou questões adicionais sobre tópicos específicos`
  }
}

/**
 * Otimiza e gera um prompt educacional usando o Gemini AI
 * Escolhe automaticamente a melhor ferramenta (NotebookLM, Colab ou Gemini)
 */
export async function otimizarPromptComGemini(
  request: ParametrosCartao
): Promise<any> {
  // Validar API key
  if (!GEMINI_API_KEY) {
    throw new Error('API key do Gemini não configurada. Adicione NEXT_PUBLIC_GEMINI_API_KEY no arquivo .env.local')
  }

  // Validar parâmetros obrigatórios
  validarParametros(request)

  const prompt = construirPromptParaGemini(request)

  // Retry com backoff exponencial
  const maxTentativas = 3
  let tentativa = 0

  while (tentativa < maxTentativas) {
    try {
      const response = await axios.post(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
        {
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 8192,
            responseMimeType: 'application/json'
          }
        },
        {
          params: {
            key: GEMINI_API_KEY
          },
          timeout: 30000 // 30 segundos de timeout
        }
      )

      // Validar estrutura da resposta
      validarRespostaAPI(response)

      const candidate = response.data.candidates[0]
      const textoResposta = candidate.content.parts[0].text

      if (!textoResposta) {
        throw new Error('Texto vazio na resposta do Gemini')
      }

      return extrairPromptGerado(textoResposta)
    } catch (error: any) {
      tentativa++

      // Se for erro 429 (rate limit) e ainda temos tentativas, aguarda e tenta novamente
      if (error.response?.status === 429 && tentativa < maxTentativas) {
        const aguardar = Math.pow(2, tentativa) * 1000 // Backoff exponencial: 2s, 4s, 8s
        console.warn(`Rate limit atingido. Aguardando ${aguardar/1000}s antes da tentativa ${tentativa + 1}/${maxTentativas}...`)
        await new Promise(resolve => setTimeout(resolve, aguardar))
        continue
      }

      // Para outros erros ou se esgotou as tentativas
      console.error('Erro ao otimizar prompt com Gemini:', error)
      tratarErrosAPI(error, tentativa, maxTentativas)
    }
  }

  throw new Error('Número máximo de tentativas excedido')
}

/**
 * Valida os parâmetros de entrada
 */
function validarParametros(request: ParametrosCartao): void {
  const { tipo, nivel_turma, publico_alvo, detalhamento, objetivo_atividade } = request

  if (!tipo || !['teoria', 'pratica', 'estudo_caso', 'quiz'].includes(tipo)) {
    throw new Error('Tipo de cartão inválido')
  }

  if (!nivel_turma?.trim()) {
    throw new Error('Nível da turma é obrigatório')
  }

  if (!publico_alvo?.trim()) {
    throw new Error('Público alvo é obrigatório')
  }

  if (!detalhamento?.trim()) {
    throw new Error('Detalhamento é obrigatório')
  }

  if (!objetivo_atividade?.trim()) {
    throw new Error('Objetivo da atividade é obrigatório')
  }
}

/**
 * Valida a resposta da API
 */
function validarRespostaAPI(response: any): void {
  if (!response.data) {
    throw new Error('Resposta vazia da API Gemini')
  }

  if (!response.data.candidates || response.data.candidates.length === 0) {
    console.error('Resposta completa do Gemini:', JSON.stringify(response.data, null, 2))
    throw new Error('Nenhum candidato retornado pela API Gemini. Possível problema com a API key ou filtro de segurança.')
  }

  const candidate = response.data.candidates[0]

  if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
    console.error('Candidato sem conteúdo:', JSON.stringify(candidate, null, 2))
    throw new Error('Conteúdo vazio retornado pela API Gemini')
  }
}

/**
 * Trata erros da API com mensagens específicas
 */
function tratarErrosAPI(error: any, tentativa?: number, maxTentativas?: number): never {
  if (error.response) {
    console.error('Resposta de erro da API:', error.response.data)

    if (error.response.status === 400) {
      throw new Error('Erro na API Gemini: Requisição inválida. Verifique sua API key.')
    } else if (error.response.status === 429) {
      const mensagem = tentativa && maxTentativas
        ? `Limite de requisições excedido após ${tentativa} tentativas. Aguarde alguns minutos antes de tentar novamente.`
        : 'Limite de requisições excedido. Aguarde alguns minutos.'
      throw new Error(mensagem)
    } else if (error.response.status === 401 || error.response.status === 403) {
      throw new Error('API key do Gemini inválida ou sem permissão.')
    }
  }

  throw error
}

/**
 * Constrói o prompt meta que será enviado ao Gemini
 * O Gemini receberá este prompt e gerará o prompt educacional final
 */
function construirPromptParaGemini(request: ParametrosCartao): string {
  const { tipo, nivel_turma, publico_alvo, detalhamento, objetivo_atividade } = request

  const config = FERRAMENTAS_CONFIG[tipo]
  const template = PROMPT_TEMPLATES[tipo]

  // Substitui as variáveis no template
  const promptBase = template.estrutura
    .replace('{nivel_turma}', nivel_turma)
    .replace('{publico_alvo}', publico_alvo)
    .replace('{detalhamento}', detalhamento)
    .replace('{objetivo_atividade}', objetivo_atividade)

  return `Você é um assistente especializado em criar prompts educacionais de alta qualidade para professores de engenharia.

CONTEXTO DA SOLICITAÇÃO:
Tipo de Material: ${tipo.toUpperCase().replace('_', ' ')}
Ferramenta Destino: ${config.ferramenta}
Justificativa: ${config.justificativa}

INFORMAÇÕES PEDAGÓGICAS:
- Nível da turma: ${nivel_turma}
- Público alvo: ${publico_alvo}
- Detalhamento esperado: ${detalhamento}
- Objetivo da atividade: ${objetivo_atividade}

SUA TAREFA:
Crie um prompt educacional COMPLETO e PRONTO PARA USO que o professor possa copiar e colar diretamente na ferramenta ${config.ferramenta}.

O prompt deve seguir este template especializado:

${promptBase}

FORMATO DE SAÍDA (JSON):
{
  "titulo": "Título conciso e descritivo do material (máximo 80 caracteres)",
  "objetivo": "Objetivo de aprendizagem claro e mensurável usando taxonomia de Bloom",
  "prompt_completo": "O prompt educacional completo, pronto para copiar e colar, incluindo TODA a estrutura acima preenchida adequadamente. Este campo deve conter o prompt inteiro que o professor usará.",
  "ferramenta_recomendada": "${config.ferramenta}",
  "instrucoes_uso": "${template.instrucoes_uso.trim().replace(/\n/g, ' ').replace(/"/g, '\\"')}",
  "formato_saida": "${config.formato_ideal}",
  "contexto_adicional": "Dicas extras para o professor maximizar o uso do material gerado"
}

REGRAS CRÍTICAS:
1. O campo "prompt_completo" deve ser um prompt COMPLETO, auto-suficiente e direto
2. Não use caracteres especiais que quebrem JSON (aspas duplas devem ser escapadas)
3. Seja específico para engenharia: mencione equações, normas, aplicações práticas
4. Use linguagem imperativa e direta no prompt_completo
5. O prompt deve gerar conteúdo com ${detalhamento}
6. Retorne APENAS o JSON válido, sem markdown, sem explicações adicionais

IMPORTANTE: O "prompt_completo" será copiado e colado diretamente pelo professor. Garanta que ele seja claro, completo e gere o material educacional esperado.`
}

/**
 * Extrai e valida o JSON do prompt gerado
 */
export function extrairPromptGerado(resposta: string): Record<string, any> {
  try {
    // Estratégia 1: Parse direto após limpeza básica
    let jsonString = resposta.trim()

    // Remove blocos de código markdown
    jsonString = jsonString.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')

    const parsed = JSON.parse(jsonString)

    // Validar campos obrigatórios
    validarCamposPrompt(parsed)

    return parsed
  } catch (error1) {
    try {
      // Estratégia 2: Extrair JSON do texto
      const jsonMatch = resposta.match(/\{[\s\S]*\}/g)

      if (!jsonMatch || jsonMatch.length === 0) {
        throw new Error('Nenhum JSON encontrado na resposta')
      }

      // Pega o maior JSON encontrado
      const maiorJson = jsonMatch.reduce((a, b) => a.length > b.length ? a : b)

      // Limpeza e normalização
      let jsonLimpo = maiorJson
        .replace(/\\\\/g, '\\')
        .replace(/\\n/g, ' ')
        .replace(/\\t/g, ' ')
        .replace(/\\r/g, '')
        .replace(/[\u0000-\u001F]+/g, '')
        .replace(/\s+/g, ' ')

      const parsed = JSON.parse(jsonLimpo)
      validarCamposPrompt(parsed)

      return parsed
    } catch (error2) {
      // Estratégia 3: Reconstrução manual
      return reconstruirJSONManualmente(resposta)
    }
  }
}

/**
 * Valida se os campos obrigatórios estão presentes
 */
function validarCamposPrompt(obj: any): void {
  const camposObrigatorios = ['titulo', 'objetivo', 'prompt_completo', 'ferramenta_recomendada', 'formato_saida']

  for (const campo of camposObrigatorios) {
    if (!obj[campo]) {
      console.warn(`Campo obrigatório ausente: ${campo}`)
    }
  }
}

/**
 * Tenta reconstruir o JSON manualmente quando o parse falha
 */
function reconstruirJSONManualmente(resposta: string): Record<string, any> {
  try {
    console.warn('Tentando reconstrução manual do JSON...')

    // Extrai campos com regex
    const titulo = extrairCampo(resposta, 'titulo') || 'Material Educacional'
    const objetivo = extrairCampo(resposta, 'objetivo') || 'Desenvolver competências técnicas'
    const ferramenta = extrairCampo(resposta, 'ferramenta_recomendada') || 'Gemini'
    const formato = extrairCampo(resposta, 'formato_saida') || 'Texto estruturado'
    const instrucoes = extrairCampo(resposta, 'instrucoes_uso') || 'Cole o prompt na ferramenta e execute'
    const contexto = extrairCampo(resposta, 'contexto_adicional') || ''

    // Extração especial para prompt_completo (campo mais complexo)
    let promptCompleto = 'Erro ao extrair prompt'

    // Tenta extrair até o próximo campo
    const match = resposta.match(/"prompt_completo"\s*:\s*"([\s\S]*?)"\s*,\s*"(?:ferramenta_recomendada|formato_saida|instrucoes_uso)"/)
    if (match) {
      promptCompleto = match[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\')
    } else {
      // Fallback: extrai qualquer texto após prompt_completo
      const match2 = resposta.match(/"prompt_completo"\s*:\s*"([^"]*(?:\\"[^"]*)*)"/)
      if (match2) {
        promptCompleto = match2[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\')
      }
    }

    const jsonReconstruido = {
      titulo,
      objetivo,
      prompt_completo: promptCompleto,
      ferramenta_recomendada: ferramenta,
      instrucoes_uso: instrucoes,
      formato_saida: formato,
      contexto_adicional: contexto
    }

    console.log('JSON reconstruído com sucesso')
    return jsonReconstruido
  } catch (error) {
    console.error('Erro fatal ao processar resposta do Gemini')
    console.error('Resposta completa:', resposta.substring(0, 1000))
    console.error('Erro:', error)

    throw new Error('Não foi possível processar a resposta do Gemini. A IA pode ter retornado um formato inválido. Tente novamente.')
  }
}

/**
 * Extrai um campo específico usando regex
 */
function extrairCampo(texto: string, nomeCampo: string): string {
  const regex = new RegExp(`"${nomeCampo}"\\s*:\\s*"([^"]*(?:\\\\"[^"]*)*)"`)
  const match = texto.match(regex)
  return match ? match[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\') : ''
}
