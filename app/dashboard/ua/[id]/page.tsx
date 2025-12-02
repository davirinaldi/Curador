'use client'

import { use, useState, useEffect } from 'react'
import { ArrowLeft, Sparkles, RefreshCw, FileText, Code, Lightbulb, HelpCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ButtonLink } from '@/components/ui/ButtonLink'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { Alert, AlertDescription } from '@/components/ui/Alert'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { ThemeToggle } from '@/components/ThemeToggle'
import { supabase } from '@/lib/supabase/client'
import { otimizarPromptComGemini } from '@/lib/gemini'
import { criarGeracao, aguardarConclusaoGeracao, extrairUrlDownload, fazerDownloadArquivo } from '@/lib/gamma'
import { UnidadeAprendizagem, Cartao, TipoCartao } from '@/lib/types'

const TIPO_CARTAO_CONFIG = {
  teoria: {
    icon: FileText,
    label: 'Teoria',
    color: 'bg-blue-500/10 text-blue-600 border-blue-200',
    description: 'Conteúdo teórico e conceitual'
  },
  pratica: {
    icon: Code,
    label: 'Prática',
    color: 'bg-green-500/10 text-green-600 border-green-200',
    description: 'Exercícios práticos e aplicações'
  },
  estudo_caso: {
    icon: Lightbulb,
    label: 'Estudo de Caso',
    color: 'bg-purple-500/10 text-purple-600 border-purple-200',
    description: 'Casos reais e exemplos práticos'
  },
  quiz: {
    icon: HelpCircle,
    label: 'Quiz',
    color: 'bg-orange-500/10 text-orange-600 border-orange-200',
    description: 'Perguntas e avaliações'
  }
}

export default function UACartoesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [ua, setUa] = useState<UnidadeAprendizagem | null>(null)
  const [cartoes, setCartoes] = useState<Cartao[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [generatingPrompt, setGeneratingPrompt] = useState<string | null>(null)

  // Modal de edição de cartão
  const [showEditModal, setShowEditModal] = useState(false)
  const [cartaoEditando, setCartaoEditando] = useState<Cartao | null>(null)
  const [formCartao, setFormCartao] = useState({
    nivel_turma: '',
    publico_alvo: '',
    detalhamento: '',
    objetivo_atividade: ''
  })

  // Modal de geração de prompt
  const [showGerarPromptModal, setShowGerarPromptModal] = useState(false)
  const [cartaoGerandoPrompt, setCartaoGerandoPrompt] = useState<Cartao | null>(null)
  const [formGerarPrompt, setFormGerarPrompt] = useState({
    nivel_turma: '',
    publico_alvo: '',
    detalhamento: '',
    objetivo_atividade: ''
  })

  // Modal de visualização do prompt gerado
  const [showPromptModal, setShowPromptModal] = useState(false)
  const [cartaoPromptVisualizacao, setCartaoPromptVisualizacao] = useState<Cartao | null>(null)

  // Modal de configuração do Gamma
  const [modalGammaAberto, setModalGammaAberto] = useState(false)
  const [cartaoParaGamma, setCartaoParaGamma] = useState<Cartao | null>(null)
  const [gerandoGamma, setGerandoGamma] = useState(false)
  const [progressoGamma, setProgressoGamma] = useState('')
  const [configGamma, setConfigGamma] = useState({
    textMode: 'generate' as 'generate' | 'condense' | 'preserve',
    format: 'presentation' as 'presentation' | 'document' | 'social' | 'webpage',
    numCards: 15,
    cardSplit: 'auto' as 'auto' | 'inputTextBreaks',
    additionalInstructions: '',
    exportAs: 'pptx' as '' | 'pdf' | 'pptx',
    textAmount: 'detailed' as 'minimal' | 'concise' | 'detailed' | 'comprehensive',
    textTone: 'technical' as 'professional' | 'casual' | 'friendly' | 'formal' | 'technical',
    textAudience: 'Estudantes de Engenharia',
    textLanguage: 'pt-br' as 'pt-br' | 'en' | 'es' | 'fr' | 'de' | 'it' | 'ja' | 'ko' | 'zh-cn' | 'zh-tw',
    imageSource: 'aiGenerated' as 'aiGenerated' | 'webAllImages' | 'webFreeToUse' | 'unsplash' | 'placeholder' | 'noImages'
  })

  useEffect(() => {
    carregarDados()
  }, [id])

  async function carregarDados() {
    try {
      setLoading(true)
      setError(null)

      // Carregar UA
      const { data: uaData, error: uaError } = await supabase
        .from('unidades_aprendizagem')
        .select('*')
        .eq('id', id)
        .single()

      if (uaError) throw uaError
      setUa(uaData)

      // Carregar cartões
      const { data: cartoesData, error: cartoesError } = await supabase
        .from('cartoes')
        .select('*')
        .eq('ua_id', id)
        .order('tipo')

      if (cartoesError) throw cartoesError
      setCartoes(cartoesData || [])

    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      setError('Erro ao carregar dados da Unidade de Aprendizagem')
    } finally {
      setLoading(false)
    }
  }

  function abrirModalGerarPrompt(cartao: Cartao) {
    setCartaoGerandoPrompt(cartao)
    setFormGerarPrompt({
      nivel_turma: cartao.nivel_turma,
      publico_alvo: cartao.publico_alvo,
      detalhamento: cartao.detalhamento,
      objetivo_atividade: cartao.objetivo_atividade
    })
    setShowGerarPromptModal(true)
  }

  function abrirModalPrompt(cartao: Cartao) {
    setCartaoPromptVisualizacao(cartao)
    setShowPromptModal(true)
  }

  async function gerarPromptCartao() {
    if (!cartaoGerandoPrompt) return

    try {
      setGeneratingPrompt(cartaoGerandoPrompt.id)
      setError(null)

      const promptOtimizado = await otimizarPromptComGemini({
        tipo: cartaoGerandoPrompt.tipo as TipoCartao,
        nivel_turma: formGerarPrompt.nivel_turma,
        publico_alvo: formGerarPrompt.publico_alvo,
        detalhamento: formGerarPrompt.detalhamento,
        objetivo_atividade: formGerarPrompt.objetivo_atividade
      })

      // Atualizar cartão no banco
      const { error: updateError } = await supabase
        .from('cartoes')
        .update({
          prompt_gerado: promptOtimizado,
          nivel_turma: formGerarPrompt.nivel_turma,
          publico_alvo: formGerarPrompt.publico_alvo,
          detalhamento: formGerarPrompt.detalhamento,
          objetivo_atividade: formGerarPrompt.objetivo_atividade
        })
        .eq('id', cartaoGerandoPrompt.id)

      if (updateError) throw updateError

      // Fechar modal e recarregar
      setShowGerarPromptModal(false)
      setCartaoGerandoPrompt(null)
      await carregarDados()

    } catch (error) {
      console.error('Erro ao gerar prompt:', error)
      setError('Erro ao gerar prompt. Verifique sua API key do Gemini.')
    } finally {
      setGeneratingPrompt(null)
    }
  }

  async function salvarCartao() {
    if (!cartaoEditando) return

    try {
      setLoading(true)
      setError(null)

      const { error: updateError } = await supabase
        .from('cartoes')
        .update(formCartao)
        .eq('id', cartaoEditando.id)

      if (updateError) throw updateError

      setShowEditModal(false)
      setCartaoEditando(null)
      await carregarDados()

    } catch (error) {
      console.error('Erro ao salvar cartão:', error)
      setError('Erro ao salvar cartão')
    } finally {
      setLoading(false)
    }
  }

  function abrirEdicaoCartao(cartao: Cartao) {
    setCartaoEditando(cartao)
    setFormCartao({
      nivel_turma: cartao.nivel_turma,
      publico_alvo: cartao.publico_alvo,
      detalhamento: cartao.detalhamento,
      objetivo_atividade: cartao.objetivo_atividade
    })
    setShowEditModal(true)
  }

  async function gerarComGamma() {
    if (!cartaoParaGamma?.prompt_gerado) return

    try {
      setGerandoGamma(true)
      setError(null)
      setProgressoGamma('Criando apresentação no Gamma...')

      // Preparar parâmetros para a API do Gamma
      const params = {
        inputText: cartaoParaGamma.prompt_gerado.prompt_completo,
        textMode: configGamma.textMode,
        format: configGamma.format,
        numCards: configGamma.numCards,
        cardSplit: configGamma.cardSplit,
        additionalInstructions: configGamma.additionalInstructions || undefined,
        exportAs: configGamma.exportAs || undefined,
        textOptions: {
          amount: configGamma.textAmount,
          tone: configGamma.textTone,
          audience: configGamma.textAudience,
          language: configGamma.textLanguage
        },
        imageOptions: {
          source: configGamma.imageSource
        }
      }

      // Criar geração no Gamma
      const geracaoResponse = await criarGeracao(params)
      console.log('Geração criada:', geracaoResponse)

      // Se foi solicitada exportação, aguardar conclusão e fazer download
      if (configGamma.exportAs) {
        setProgressoGamma('Aguardando conclusão da geração...')

        // Aguardar 3 segundos antes de começar polling (API pode demorar para registrar)
        await new Promise(resolve => setTimeout(resolve, 3000))

        const statusCompleto = await aguardarConclusaoGeracao(
          geracaoResponse.generationId,
          60, // 60 tentativas
          2000 // intervalo de 2 segundos
        )

        console.log('Status completo:', statusCompleto)

        // Tentar extrair URL de download
        const urlDownload = extrairUrlDownload(statusCompleto, configGamma.exportAs)

        if (urlDownload) {
          setProgressoGamma('Fazendo download do arquivo...')

          const nomeArquivo = `apresentacao-${cartaoParaGamma.id}.${configGamma.exportAs}`
          await fazerDownloadArquivo(urlDownload, nomeArquivo)

          alert(`✅ Apresentação gerada e baixada com sucesso!\n\nArquivo: ${nomeArquivo}\n\nVocê também pode acessar no Gamma: ${statusCompleto.gammaUrl || 'https://gamma.app'}`)
        } else {
          // URL não encontrada - logar resposta completa para debug
          console.warn('URL de download não encontrada na resposta:', statusCompleto)
          alert(`✅ Apresentação gerada com sucesso!\n\nID: ${geracaoResponse.generationId}\n\n⚠️ Não foi possível fazer download automático.\nA URL de download não foi encontrada na resposta.\n\nAbrindo Gamma para você acessar manualmente...`)
          window.open(statusCompleto.gammaUrl || 'https://gamma.app', '_blank')
        }
      } else {
        // Sem exportação - apenas mostrar sucesso
        alert(`✅ Geração iniciada com sucesso!\n\nID: ${geracaoResponse.generationId}\n\nSua apresentação está sendo criada no Gamma.\n\nAbrindo Gamma em nova aba...`)
        window.open('https://gamma.app', '_blank')
      }

      // Fechar modal
      setModalGammaAberto(false)
      setCartaoParaGamma(null)
      setProgressoGamma('')

    } catch (error: any) {
      console.error('Erro ao gerar com Gamma:', error)
      setError(error.message || 'Erro ao gerar apresentação no Gamma. Verifique sua API key.')
      alert('❌ Erro: ' + (error.message || 'Não foi possível gerar a apresentação'))
      setProgressoGamma('')
    } finally {
      setGerandoGamma(false)
    }
  }

  if (loading && !ua) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
          <div className="flex h-16 items-center px-4 gap-4">
            <Skeleton className="h-10 w-32" />
          </div>
        </header>
        <div className="container max-w-6xl mx-auto p-4 md:p-6 space-y-6">
          <Skeleton className="h-12 w-96" />
          <div className="grid md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="flex h-16 items-center justify-between px-4 gap-4">
          <div className="flex items-center gap-3">
            <ButtonLink href="/dashboard" variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </ButtonLink>
          </div>
          <ThemeToggle />
        </div>

        {error && (
          <Alert variant="destructive" className="rounded-none border-x-0 border-t-0">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </header>

      {/* Main Content */}
      <div className="container max-w-6xl mx-auto p-4 md:p-6 space-y-6">
        {/* UA Info */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">{ua?.titulo}</h1>
          {ua?.descricao && (
            <p className="text-muted-foreground">{ua.descricao}</p>
          )}
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {cartoes.length} / 4 cartões
            </Badge>
            {cartoes.filter(c => c.prompt_gerado).length > 0 && (
              <Badge variant="default">
                {cartoes.filter(c => c.prompt_gerado).length} prompts gerados
              </Badge>
            )}
          </div>
        </div>

        {/* Cartões Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {cartoes.length === 0 ? (
            <Card className="md:col-span-2 border-dashed">
              <CardContent className="p-12 text-center space-y-4">
                <Sparkles className="h-16 w-16 mx-auto text-muted-foreground/50" />
                <div className="space-y-2">
                  <p className="font-medium">Nenhum cartão criado ainda</p>
                  <p className="text-sm text-muted-foreground">
                    Os cartões são criados automaticamente quando você cria uma UA
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            cartoes.map((cartao) => {
              const config = TIPO_CARTAO_CONFIG[cartao.tipo as TipoCartao]
              const Icon = config.icon

              return (
                <Card key={cartao.id} className="hover:shadow-lg transition-all">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${config.color}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <CardTitle className="text-xl">{config.label}</CardTitle>
                          <CardDescription className="text-sm">
                            {config.description}
                          </CardDescription>
                        </div>
                      </div>
                      {cartao.prompt_gerado && (
                        <Badge variant="default" className="shrink-0">
                          <Sparkles className="h-3 w-3 mr-1" />
                          Gerado
                        </Badge>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Informações do Cartão */}
                    <div className="space-y-3 text-sm">
                      <div>
                        <span className="font-medium text-muted-foreground">Nível:</span>
                        <p className="mt-1">{cartao.nivel_turma || 'Não definido'}</p>
                      </div>
                      <div>
                        <span className="font-medium text-muted-foreground">Público:</span>
                        <p className="mt-1">{cartao.publico_alvo || 'Não definido'}</p>
                      </div>
                      <div>
                        <span className="font-medium text-muted-foreground">Objetivo:</span>
                        <p className="mt-1 line-clamp-2">{cartao.objetivo_atividade || 'Não definido'}</p>
                      </div>
                    </div>

                    {/* Prompt Gerado - Preview */}
                    {cartao.prompt_gerado && (
                      <div className="pt-3 border-t space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold text-muted-foreground uppercase">
                            Prompt Gerado com IA
                          </p>
                          <Badge variant="outline" className="text-xs">
                            {cartao.prompt_gerado.ferramenta_recomendada}
                          </Badge>
                        </div>
                        <div className="bg-muted/50 rounded-md p-3 space-y-2 text-xs">
                          <div>
                            <span className="font-semibold text-primary">Título:</span>
                            <p className="mt-1 line-clamp-1">{cartao.prompt_gerado.titulo}</p>
                          </div>
                          <div>
                            <span className="font-semibold text-primary">Objetivo:</span>
                            <p className="mt-1 line-clamp-2">{cartao.prompt_gerado.objetivo}</p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => abrirModalPrompt(cartao)}
                            className="w-full mt-2 h-8 text-xs"
                          >
                            📋 Ver Prompt Completo
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Ações */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => abrirEdicaoCartao(cartao)}
                        className="flex-1"
                      >
                        Editar
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => abrirModalGerarPrompt(cartao)}
                        className="flex-1"
                      >
                        {cartao.prompt_gerado ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Regenerar
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4 mr-2" />
                            Gerar Prompt
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      </div>

      {/* Modal de Edição */}
      <Modal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        title={`Editar Cartão - ${cartaoEditando ? TIPO_CARTAO_CONFIG[cartaoEditando.tipo as TipoCartao].label : ''}`}
        description="Atualize as informações do cartão"
      >
        <div className="space-y-4">
          <Input
            label="Nível da Turma *"
            placeholder="Ex: 3º ano de Engenharia Civil, Mestrado em Engenharia Mecânica"
            value={formCartao.nivel_turma}
            onChange={(e) => setFormCartao({ ...formCartao, nivel_turma: e.target.value })}
          />
          <Input
            label="Público Alvo *"
            placeholder="Ex: Estudantes de Engenharia Elétrica, Engenheiros recém-formados"
            value={formCartao.publico_alvo}
            onChange={(e) => setFormCartao({ ...formCartao, publico_alvo: e.target.value })}
          />
          <Input
            label="Nível de Detalhamento da Resposta da IA *"
            placeholder="Ex: Explicação detalhada com equações, exemplos práticos e simulações"
            value={formCartao.detalhamento}
            onChange={(e) => setFormCartao({ ...formCartao, detalhamento: e.target.value })}
          />
          <Textarea
            label="Objetivo da Atividade *"
            placeholder="Ex: Desenvolver projeto de análise estrutural utilizando método dos elementos finitos"
            rows={3}
            value={formCartao.objetivo_atividade}
            onChange={(e) => setFormCartao({ ...formCartao, objetivo_atividade: e.target.value })}
          />

          <div className="flex gap-3 pt-4">
            <Button onClick={salvarCartao} isLoading={loading} className="flex-1">
              Salvar
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowEditModal(false)
                setCartaoEditando(null)
              }}
              className="flex-1"
            >
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal de Gerar Prompt com IA */}
      <Modal
        open={showGerarPromptModal}
        onOpenChange={setShowGerarPromptModal}
        title={
          <div className="flex items-center gap-3">
            {cartaoGerandoPrompt && (
              <>
                <div className={`p-2 rounded-lg ${TIPO_CARTAO_CONFIG[cartaoGerandoPrompt.tipo as TipoCartao].color}`}>
                  {(() => {
                    const Icon = TIPO_CARTAO_CONFIG[cartaoGerandoPrompt.tipo as TipoCartao].icon
                    return <Icon className="h-5 w-5" />
                  })()}
                </div>
                <span>Gerar Prompt - {TIPO_CARTAO_CONFIG[cartaoGerandoPrompt.tipo as TipoCartao].label}</span>
              </>
            )}
          </div>
        }
        description="Revise os dados do cartão antes de gerar o prompt otimizado com IA"
      >
        <div className="space-y-4">
          <Alert>
            <Sparkles className="h-4 w-4" />
            <AlertDescription>
              A IA Gemini 2.5 Flash irá gerar um prompt educacional otimizado baseado nas informações abaixo.
            </AlertDescription>
          </Alert>

          <Input
            label="Nível da Turma *"
            placeholder="Ex: 3º ano de Engenharia Civil, Mestrado em Engenharia Mecânica"
            value={formGerarPrompt.nivel_turma}
            onChange={(e) => setFormGerarPrompt({ ...formGerarPrompt, nivel_turma: e.target.value })}
          />
          <Input
            label="Público Alvo *"
            placeholder="Ex: Estudantes de Engenharia Elétrica, Engenheiros recém-formados"
            value={formGerarPrompt.publico_alvo}
            onChange={(e) => setFormGerarPrompt({ ...formGerarPrompt, publico_alvo: e.target.value })}
          />
          <Input
            label="Nível de Detalhamento da Resposta da IA *"
            placeholder="Ex: Explicação detalhada com equações, exemplos práticos e simulações"
            value={formGerarPrompt.detalhamento}
            onChange={(e) => setFormGerarPrompt({ ...formGerarPrompt, detalhamento: e.target.value })}
          />
          <Textarea
            label="Objetivo da Atividade *"
            placeholder="Ex: Desenvolver projeto de análise estrutural utilizando método dos elementos finitos"
            rows={3}
            value={formGerarPrompt.objetivo_atividade}
            onChange={(e) => setFormGerarPrompt({ ...formGerarPrompt, objetivo_atividade: e.target.value })}
          />

          <div className="flex gap-3 pt-4">
            <Button
              onClick={gerarPromptCartao}
              isLoading={generatingPrompt === cartaoGerandoPrompt?.id}
              disabled={!formGerarPrompt.nivel_turma || !formGerarPrompt.publico_alvo || !formGerarPrompt.detalhamento || !formGerarPrompt.objetivo_atividade}
              className="flex-1"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Gerar Prompt com IA
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowGerarPromptModal(false)
                setCartaoGerandoPrompt(null)
              }}
              disabled={generatingPrompt === cartaoGerandoPrompt?.id}
              className="flex-1"
            >
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal de Visualização do Prompt Gerado */}
      <Modal
        open={showPromptModal}
        onOpenChange={setShowPromptModal}
        title={
          <div className="flex items-center gap-3">
            {cartaoPromptVisualizacao && (
              <>
                <Sparkles className="h-5 w-5 text-primary" />
                <span>Prompt Gerado - {TIPO_CARTAO_CONFIG[cartaoPromptVisualizacao.tipo as TipoCartao].label}</span>
              </>
            )}
          </div>
        }
        description="Prompt educacional otimizado gerado pela IA"
        className="max-w-4xl max-h-[90vh] overflow-y-auto"
      >
        {cartaoPromptVisualizacao?.prompt_gerado && (
          <div className="space-y-6">
            <Alert>
              <Sparkles className="h-4 w-4" />
              <AlertDescription>
                <div className="flex items-center justify-between">
                  <span>Gerado pela IA Gemini 2.5 Flash</span>
                  <Badge variant="outline" className="ml-2">
                    {cartaoPromptVisualizacao.prompt_gerado.ferramenta_recomendada}
                  </Badge>
                </div>
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div>
                <label className="font-semibold text-sm text-primary">Título da Atividade:</label>
                <p className="mt-1 p-3 bg-muted/50 rounded-md">
                  {cartaoPromptVisualizacao.prompt_gerado.titulo}
                </p>
              </div>

              <div>
                <label className="font-semibold text-sm text-primary">Objetivo:</label>
                <p className="mt-1 p-3 bg-muted/50 rounded-md">
                  {cartaoPromptVisualizacao.prompt_gerado.objetivo}
                </p>
              </div>

              <div>
                <label className="font-semibold text-sm text-primary flex items-center justify-between">
                  <span>Prompt Completo:</span>
                  <span className={`text-xs font-normal ${
                    cartaoPromptVisualizacao.prompt_gerado.ferramenta_recomendada === 'Google Colab' &&
                    cartaoPromptVisualizacao.prompt_gerado.prompt_completo.length > 2000
                      ? 'text-red-600 font-semibold'
                      : 'text-muted-foreground'
                  }`}>
                    {cartaoPromptVisualizacao.prompt_gerado.prompt_completo.length} caracteres
                    {cartaoPromptVisualizacao.prompt_gerado.ferramenta_recomendada === 'Google Colab' && (
                      <span className="ml-1">/ 2000</span>
                    )}
                  </span>
                </label>
                {cartaoPromptVisualizacao.prompt_gerado.ferramenta_recomendada === 'Google Colab' &&
                 cartaoPromptVisualizacao.prompt_gerado.prompt_completo.length > 2000 && (
                  <Alert className="mt-2 border-red-200 bg-red-50 dark:bg-red-950/20">
                    <AlertDescription className="text-red-800 dark:text-red-200 text-xs">
                      ⚠️ Aviso: Este prompt excede o limite de 2000 caracteres do Google Colab e pode ser rejeitado.
                      Considere gerar novamente ou editar o prompt.
                    </AlertDescription>
                  </Alert>
                )}
                <div className="mt-1 bg-muted/30 rounded-md border">
                  <div className="p-3 max-h-64 overflow-y-auto">
                    <p className="whitespace-pre-wrap font-mono text-sm">
                      {cartaoPromptVisualizacao.prompt_gerado.prompt_completo}
                    </p>
                  </div>
                  <div className="border-t p-3 bg-muted/20 space-y-2">
                    <Button
                      variant="primary"
                      onClick={() => {
                        if (cartaoPromptVisualizacao?.prompt_gerado) {
                          navigator.clipboard.writeText(cartaoPromptVisualizacao.prompt_gerado.prompt_completo)
                          alert('Prompt copiado! Cole na ferramenta: ' + cartaoPromptVisualizacao.prompt_gerado.ferramenta_recomendada)
                        }
                      }}
                      className="w-full"
                    >
                      📋 Copiar Prompt Completo
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setModalGammaAberto(true)
                        setCartaoParaGamma(cartaoPromptVisualizacao)
                      }}
                      className="w-full"
                    >
                      ✨ Gerar Apresentação com Gamma
                    </Button>
                  </div>
                </div>
              </div>

              <div>
                <label className="font-semibold text-sm text-primary flex items-center gap-2">
                  <Lightbulb className="h-4 w-4" />
                  Como Usar Este Prompt:
                </label>
                <div className="mt-2 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      1
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-blue-900 dark:text-blue-100 leading-relaxed">
                        <strong>Abra a ferramenta:</strong> {cartaoPromptVisualizacao.prompt_gerado.ferramenta_recomendada}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 mt-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      2
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-green-900 dark:text-green-100 leading-relaxed">
                        <strong>Cole o prompt:</strong> Copie o prompt completo acima e cole na ferramenta
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 mt-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      3
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-purple-900 dark:text-purple-100 leading-relaxed">
                        <strong>Execute:</strong> {cartaoPromptVisualizacao.prompt_gerado.instrucoes_ferramenta ||
                         cartaoPromptVisualizacao.prompt_gerado.instrucoes_uso ||
                         'Pressione Enter ou execute para obter o conteúdo educacional otimizado'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-white/50 dark:bg-black/20 rounded-md border border-blue-300 dark:border-blue-700">
                    <p className="text-xs text-blue-800 dark:text-blue-200 flex items-center gap-2">
                      <Sparkles className="h-3 w-3" />
                      <span><strong>Dica:</strong> Este prompt foi otimizado pela IA para gerar conteúdo educacional de alta qualidade!</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setShowPromptModal(false)
                  setCartaoPromptVisualizacao(null)
                }}
                className="flex-1"
              >
                Fechar
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal de Configuração do Gamma */}
      <Modal
        open={modalGammaAberto}
        onOpenChange={setModalGammaAberto}
        title="Gerar Apresentação com Gamma"
      >
        {cartaoParaGamma?.prompt_gerado && (
          <div className="flex flex-col max-h-[80vh]">
            <Alert className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 flex-shrink-0">
              <AlertDescription className="text-sm">
                Configure as opções básicas para gerar sua apresentação
              </AlertDescription>
            </Alert>

            <div className="space-y-4 overflow-y-auto flex-1 pr-2 mt-4">
              {/* Número de Slides */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Número de Slides ({configGamma.numCards})
                </label>
                <input
                  type="range"
                  min="5"
                  max="30"
                  value={configGamma.numCards}
                  onChange={(e) => setConfigGamma({ ...configGamma, numCards: parseInt(e.target.value) })}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Recomendado: 10-20 slides para uma aula
                </p>
              </div>

              {/* Quantidade de Conteúdo */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Quantidade de Conteúdo
                </label>
                <select
                  value={configGamma.textAmount}
                  onChange={(e) => setConfigGamma({ ...configGamma, textAmount: e.target.value as any })}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="concise">Conciso - Pontos principais</option>
                  <option value="detailed">Detalhado - Conteúdo completo</option>
                  <option value="comprehensive">Abrangente - Muito detalhado</option>
                </select>
              </div>

              {/* Imagens */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Imagens
                </label>
                <select
                  value={configGamma.imageSource}
                  onChange={(e) => setConfigGamma({ ...configGamma, imageSource: e.target.value as any })}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="aiGenerated">Geradas por IA</option>
                  <option value="webFreeToUse">Imagens livres para uso</option>
                  <option value="unsplash">Unsplash (Fotos profissionais)</option>
                  <option value="noImages">Sem imagens</option>
                </select>
              </div>

              {/* Exportar */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Download automático
                </label>
                <select
                  value={configGamma.exportAs}
                  onChange={(e) => setConfigGamma({ ...configGamma, exportAs: e.target.value as any })}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="">Apenas visualizar no Gamma</option>
                  <option value="pptx">Baixar PowerPoint (.pptx)</option>
                  <option value="pdf">Baixar PDF</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t mt-4 flex-shrink-0 bg-background">
              <Button
                variant="outline"
                onClick={() => {
                  setModalGammaAberto(false)
                  setCartaoParaGamma(null)
                }}
                className="flex-1"
                disabled={gerandoGamma}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={gerarComGamma}
                className="flex-1"
                disabled={gerandoGamma}
              >
                {gerandoGamma ? (progressoGamma || 'Gerando...') : '✨ Gerar no Gamma'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
