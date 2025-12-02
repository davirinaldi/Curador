export type TipoCartao = 'teoria' | 'pratica' | 'estudo_caso' | 'quiz'

export interface UnidadeCurricular {
  id: string
  titulo: string
  descricao: string
  criado_em: string
  atualizado_em: string
}

export interface UnidadeAprendizagem {
  id: string
  uc_id: string
  titulo: string
  descricao: string
  criado_em: string
  atualizado_em: string
}

export interface Cartao {
  id: string
  ua_id: string
  tipo: TipoCartao
  nivel_turma: string
  publico_alvo: string
  detalhamento: string
  objetivo_atividade: string
  prompt_gerado: PromptGerado | null
  criado_em: string
  atualizado_em: string
}

export interface PromptGerado {
  titulo: string
  objetivo: string
  prompt_completo: string
  ferramenta_recomendada: 'NotebookLM' | 'Google Colab' | 'Gemini'
  instrucoes_uso?: string
  instrucoes_ferramenta?: string
  formato_saida: string
  contexto_adicional?: string
}

export interface ConfiguracaoGamma {
  textMode: 'generate' | 'condense' | 'preserve'
  format: 'presentation' | 'document' | 'social' | 'webpage'
  numCards: number
  cardSplit: 'auto' | 'inputTextBreaks'
  additionalInstructions: string
  exportAs?: 'pdf' | 'pptx'
  textOptions: {
    amount: 'minimal' | 'concise' | 'detailed' | 'comprehensive'
    tone: 'professional' | 'casual' | 'friendly' | 'formal' | 'technical'
    audience: string
    language: string
  }
  imageOptions: {
    source: 'ai-generated' | 'stock' | 'placeholder' | 'none'
    style?: string
  }
  cardOptions: {
    showHeader: boolean
    showFooter: boolean
  }
}

export interface ParametrosCartao {
  nivel_turma: string
  publico_alvo: string
  detalhamento: string
  objetivo_atividade: string
}
