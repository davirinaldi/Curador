import axios from 'axios'



export interface GammaGenerationResponse {
  generationId: string
}

export interface GammaStatusResponse {
  status: 'pending' | 'completed' | 'failed'
  gammaUrl?: string
  exportUrl?: string
  pdfUrl?: string
  pptxUrl?: string
  downloadUrl?: string
  exportUrls?: {
    pdf?: string
    pptx?: string
  }
  error?: string
}

/**
 * Cria uma nova geração no Gamma (via API Route)
 */
export async function criarGeracao(params: GammaGenerationParams): Promise<GammaGenerationResponse> {
  // Validar inputText (limite de ~400,000 caracteres)
  if (params.inputText.length > 400000) {
    throw new Error('O texto de entrada excede o limite de 400,000 caracteres')
  }

  // Validar additionalInstructions se fornecido
  if (params.additionalInstructions && params.additionalInstructions.length > 2000) {
    throw new Error('As instruções adicionais não podem exceder 2000 caracteres')
  }

  // Validar numCards baseado no plano (assumindo Pro)
  if (params.numCards && (params.numCards < 1 || params.numCards > 60)) {
    console.warn('numCards ajustado para o limite do plano Pro (1-60)')
    params.numCards = Math.min(Math.max(params.numCards, 1), 60)
  }

  try {
    const response = await axios.post('/api/gamma/create', params, {
      timeout: 30000
    })

    return response.data
  } catch (error: any) {
    console.error('Erro ao criar geração no Gamma:', error)

    if (error.response?.data?.error) {
      throw new Error(error.response.data.error)
    }

    throw new Error('Erro ao criar geração no Gamma. Tente novamente.')
  }
}

/**
 * Verifica o status de uma geração (via API Route)
 */
export async function verificarStatusGeracao(generationId: string): Promise<GammaStatusResponse> {
  try {
    const response = await axios.get(`/api/gamma/status/${generationId}`, {
      timeout: 10000
    })

    return response.data
  } catch (error: any) {
    console.error('Erro ao verificar status no Gamma:', error)

    if (error.response?.data?.error) {
      throw new Error(error.response.data.error)
    }

    throw new Error('Erro ao verificar status da geração')
  }
}

/**
 * Aguarda a conclusão de uma geração (polling)
 */
export async function aguardarConclusaoGeracao(
  generationId: string,
  maxTentativas: number = 30,
  intervalo: number = 2000
): Promise<GammaStatusResponse> {
  for (let i = 0; i < maxTentativas; i++) {
    const status = await verificarStatusGeracao(generationId)

    if (status.status === 'completed') {
      return status
    }

    if (status.status === 'failed') {
      throw new Error(`Geração falhou: ${status.error || 'Erro desconhecido'}`)
    }

    // Aguardar antes da próxima verificação
    await new Promise(resolve => setTimeout(resolve, intervalo))
  }

  throw new Error('Timeout: A geração está demorando muito. Verifique manualmente.')
}

/**
 * Busca temas disponíveis no workspace (via API Route)
 */
export async function buscarTemas(): Promise<any[]> {
  try {
    const response = await axios.get('/api/gamma/themes')
    return response.data.themes || []
  } catch (error) {
    console.error('Erro ao buscar temas do Gamma:', error)
    return []
  }
}

/**
 * Extrai URL de download da resposta de status
 */
export function extrairUrlDownload(statusResponse: GammaStatusResponse, formato?: 'pdf' | 'pptx'): string | null {
  // Tentar múltiplos campos possíveis
  if (formato === 'pdf') {
    return statusResponse.pdfUrl ||
           statusResponse.exportUrls?.pdf ||
           statusResponse.exportUrl ||
           null
  }

  if (formato === 'pptx') {
    return statusResponse.pptxUrl ||
           statusResponse.exportUrls?.pptx ||
           statusResponse.exportUrl ||
           null
  }

  // Tentar URLs genéricas
  return statusResponse.exportUrl ||
         statusResponse.downloadUrl ||
         statusResponse.pdfUrl ||
         statusResponse.pptxUrl ||
         statusResponse.exportUrls?.pdf ||
         statusResponse.exportUrls?.pptx ||
         null
}

/**
 * Faz download de um arquivo através de URL (via proxy para evitar CORS)
 */
export async function fazerDownloadArquivo(url: string, nomeArquivo: string): Promise<void> {
  try {
    // Fazer download via API Route (proxy para evitar CORS)
    const response = await axios.post('/api/gamma/download', {
      url,
      filename: nomeArquivo
    }, {
      responseType: 'blob',
      timeout: 60000 // 1 minuto para download
    })

    // Criar um link temporário para download
    const blob = new Blob([response.data])
    const downloadUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = nomeArquivo
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(downloadUrl)
  } catch (error: any) {
    console.error('Erro ao fazer download do arquivo:', error)
    throw new Error('Erro ao fazer download do arquivo. Tente acessar via Gamma.')
  }
}
