/**
 * Parser de PDFs de Planos de Ensino
 * Extrai informações estruturadas de planos de ensino em PDF
 */

export interface PlanoEnsinoData {
  titulo: string
  periodo_letivo: string
  carga_horaria: string
  cursos: string[]
  topicos_geradores: string[]
  metas_compreensao: string[]
  desempenho_compreensao: string
  ementa: string
  certificacao: string
  competencias: string[]
  bibliografia_basica: string[]
  bibliografia_complementar: string[]
  conteudo_programatico: string
}

/**
 * Extrai texto entre dois delimitadores
 */
function extractSection(text: string, startMarker: string, endMarker?: string): string {
  const startIndex = text.indexOf(startMarker)
  if (startIndex === -1) return ''

  const textAfterStart = text.substring(startIndex + startMarker.length)

  if (!endMarker) {
    return textAfterStart.trim()
  }

  const endIndex = textAfterStart.indexOf(endMarker)
  if (endIndex === -1) {
    return textAfterStart.trim()
  }

  return textAfterStart.substring(0, endIndex).trim()
}

/**
 * Divide texto em itens de lista
 */
function extractListItems(text: string): string[] {
  if (!text) return []

  // Remove espaços em branco excessivos e quebras de linha
  const cleaned = text
    .replace(/\s+/g, ' ')
    .trim()

  // Divide por ponto e vírgula ou quebra de parágrafo
  const items = cleaned
    .split(/;|\n\n/)
    .map(item => item.trim())
    .filter(item => item.length > 10) // Remove itens muito curtos

  return items
}

/**
 * Extrai referências bibliográficas
 */
function extractBibliography(text: string): string[] {
  if (!text) return []

  // Procura por padrões de referências (autor em maiúsculas seguido de ponto)
  const references: string[] = []
  const lines = text.split('\n')
  let currentRef = ''

  for (const line of lines) {
    const trimmed = line.trim()

    // Linha começa com autor (maiúsculas + vírgula ou ponto)
    if (/^[A-ZÀÁÂÃÄÇÈÉÊËÌÍÎÏÒÓÔÕÖÙÚÛÜ][A-ZÀÁÂÃÄÇÈÉÊËÌÍÎÏÒÓÔÕÖÙÚÛÜ\s]+[,;.]/.test(trimmed)) {
      if (currentRef) {
        references.push(currentRef.trim())
      }
      currentRef = trimmed
    } else if (currentRef && trimmed) {
      currentRef += ' ' + trimmed
    }
  }

  if (currentRef) {
    references.push(currentRef.trim())
  }

  return references.filter(ref => ref.length > 20)
}

/**
 * Parse do texto do PDF em estrutura de dados
 */
export function parsePlanoEnsino(pdfText: string): PlanoEnsinoData {
  // Normaliza texto removendo caracteres especiais de formatação
  const normalizedText = pdfText
    .replace(/\r/g, '')
    .replace(/\t/g, ' ')
    .replace(/\s+/g, ' ')

  // Extrai título da UC
  const tituloMatch = normalizedText.match(/UNIDADE CURRICULAR:\s*([^\(]+)\s*\(/)
  const titulo = tituloMatch ? tituloMatch[1].trim() : ''

  // Extrai período e carga horária
  const periodoMatch = normalizedText.match(/Período letivo\s*Carga horária\s*(\d{4}\/\d+)\s*(\d+h)/)
  const periodo_letivo = periodoMatch ? periodoMatch[1] : ''
  const carga_horaria = periodoMatch ? periodoMatch[2] : ''

  // Extrai cursos
  const cursosText = extractSection(normalizedText, 'Cursos', 'Tópicos geradores')
  const cursos = cursosText
    .split(',')
    .map(c => c.trim())
    .filter(c => c.length > 5)

  // Extrai tópicos geradores
  const topicosText = extractSection(normalizedText, 'Tópicos geradores', 'Metas de compreensão')
  const topicos_geradores = extractListItems(topicosText)

  // Extrai metas de compreensão
  const metasText = extractSection(normalizedText, 'Metas de compreensão', 'Desempenho de compreensão')
  const metas_compreensao = extractListItems(metasText)

  // Extrai desempenho de compreensão
  const desempenho_compreensao = extractSection(normalizedText, 'Desempenho de compreensão', 'Avaliação')

  // Extrai ementa
  const ementa = extractSection(normalizedText, 'Ementa', 'Certificação')

  // Extrai certificação
  const certificacao = extractSection(normalizedText, 'Certificação', 'Competências')

  // Extrai competências
  const competenciasText = extractSection(normalizedText, 'Competências', 'Bibliografia')
  const competencias = extractListItems(competenciasText)

  // Extrai bibliografia básica
  const bibBasicaText = extractSection(normalizedText, 'Bibliografia básica', 'Bibliografia complementar')
  const bibliografia_basica = extractBibliography(bibBasicaText)

  // Extrai bibliografia complementar
  const bibComplementarText = extractSection(normalizedText, 'Bibliografia complementar', 'Conteúdo programático')
  const bibliografia_complementar = extractBibliography(bibComplementarText)

  // Extrai conteúdo programático
  const conteudo_programatico = extractSection(normalizedText, 'Conteúdo programático')

  return {
    titulo,
    periodo_letivo,
    carga_horaria,
    cursos,
    topicos_geradores,
    metas_compreensao,
    desempenho_compreensao,
    ementa,
    certificacao,
    competencias,
    bibliografia_basica,
    bibliografia_complementar,
    conteudo_programatico
  }
}

/**
 * Gera UAs automaticamente a partir dos tópicos geradores
 */
export function gerarUAsDosTopicos(topicos: string[], metas: string[]) {
  return topicos.map((topico, index) => ({
    titulo: topico,
    descricao: metas[index] || metas[0] || 'Meta de compreensão relacionada ao tópico'
  }))
}

/**
 * Gera UAs automaticamente a partir da ementa
 */
export function gerarUAsDaEmenta(ementa: string) {
  if (!ementa || typeof ementa !== 'string') {
    return []
  }

  // Divide a ementa por pontos (.) e limpa os itens
  const topicosEmenta = ementa
    .split('.')
    .map(topico => topico.trim())
    .filter(topico => topico.length > 3 && !topico.toLowerCase().includes('certificação'))

  // Gera UAs baseadas nos tópicos da ementa
  return topicosEmenta.map((topico) => ({
    titulo: topico,
    descricao: 'Conteúdo relacionado ao tema da ementa'
  }))
}
