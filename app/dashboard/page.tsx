'use client'

import { useState, useEffect } from 'react'
import { Plus, BookOpen, Trash2, Menu, X, Eye } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ButtonLink } from '@/components/ui/ButtonLink'
import { Card, CardContent } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Modal } from '@/components/ui/Modal'
import { Alert, AlertDescription } from '@/components/ui/Alert'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { ThemeToggle } from '@/components/ThemeToggle'
import { ImportarPDF } from '@/components/ImportarPDF'
import { supabase } from '@/lib/supabase/client'
import { UnidadeCurricular, UnidadeAprendizagem } from '@/lib/types'

export default function Dashboard() {
  const [ucs, setUcs] = useState<UnidadeCurricular[]>([])
  const [uas, setUas] = useState<UnidadeAprendizagem[]>([])
  const [ucSelecionada, setUcSelecionada] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Modal states
  const [showCreateUCModal, setShowCreateUCModal] = useState(false)
  const [showCreateUAModal, setShowCreateUAModal] = useState(false)
  const [novaUC, setNovaUC] = useState({ titulo: '', descricao: '' })
  const [novaUA, setNovaUA] = useState({ titulo: '', descricao: '' })

  // Inicializa sidebar baseado no tamanho da tela (apenas no cliente)
  useEffect(() => {
    setSidebarOpen(window.innerWidth >= 768)
  }, [])

  useEffect(() => {
    carregarUCs()
  }, [])

  useEffect(() => {
    if (ucSelecionada) {
      carregarUAs(ucSelecionada)
    } else {
      setUas([])
    }
  }, [ucSelecionada])

  async function carregarUCs() {
    try {
      setError(null)
      setLoading(true)
      const { data, error: err } = await supabase
        .from('unidades_curriculares')
        .select('*')
        .order('criado_em', { ascending: false })

      if (err) throw err
      setUcs(data || [])
    } catch (error) {
      console.error('Erro ao carregar UCs:', error)
      setError('Erro ao carregar Unidades Curriculares')
    } finally {
      setLoading(false)
    }
  }

  async function carregarUAs(ucId: string) {
    try {
      setError(null)
      const { data, error: err } = await supabase
        .from('unidades_aprendizagem')
        .select('*')
        .eq('uc_id', ucId)
        .order('criado_em', { ascending: false })

      if (err) throw err
      setUas(data || [])
    } catch (error) {
      console.error('Erro ao carregar UAs:', error)
      setError('Erro ao carregar Unidades de Aprendizagem')
    }
  }

  async function criarUC() {
    if (!novaUC.titulo.trim()) {
      setError('Por favor, preencha o título da UC')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const { error: err } = await supabase
        .from('unidades_curriculares')
        .insert([
          {
            titulo: novaUC.titulo,
            descricao: novaUC.descricao
          }
        ])
        .select()

      if (err) throw err

      setNovaUC({ titulo: '', descricao: '' })
      setShowCreateUCModal(false)
      await carregarUCs()
    } catch (error) {
      console.error('Erro ao criar UC:', error)
      setError('Erro ao criar Unidade Curricular')
    } finally {
      setLoading(false)
    }
  }

  async function deletarUC(ucId: string) {
    if (!confirm('Tem certeza que deseja deletar esta UC? Todas as UAs e Cartões relacionados serão deletados.')) {
      return
    }

    setLoading(true)
    setError(null)
    try {
      // O Supabase deve ter CASCADE configurado, mas vamos garantir deletando manualmente
      // 1. Buscar todas as UAs da UC
      const { data: uasData } = await supabase
        .from('unidades_aprendizagem')
        .select('id')
        .eq('uc_id', ucId)

      if (uasData && uasData.length > 0) {
        const uaIds = uasData.map(ua => ua.id)

        // 2. Deletar todos os cartões dessas UAs
        await supabase
          .from('cartoes')
          .delete()
          .in('ua_id', uaIds)

        // 3. Deletar todas as UAs
        await supabase
          .from('unidades_aprendizagem')
          .delete()
          .eq('uc_id', ucId)
      }

      // 4. Deletar a UC
      const { error: err } = await supabase
        .from('unidades_curriculares')
        .delete()
        .eq('id', ucId)

      if (err) throw err

      // Atualiza a lista e limpa seleção se necessário
      if (ucSelecionada === ucId) {
        setUcSelecionada(null)
      }
      await carregarUCs()
    } catch (error) {
      console.error('Erro ao deletar UC:', error)
      setError('Erro ao deletar Unidade Curricular')
    } finally {
      setLoading(false)
    }
  }

  async function criarUA() {
    if (!ucSelecionada) {
      setError('Selecione uma UC primeiro')
      return
    }

    if (!novaUA.titulo.trim()) {
      setError('Por favor, preencha o título da UA')
      return
    }

    setLoading(true)
    setError(null)
    try {
      // Criar UA
      const { data: uaData, error: err } = await supabase
        .from('unidades_aprendizagem')
        .insert([
          {
            uc_id: ucSelecionada,
            titulo: novaUA.titulo,
            descricao: novaUA.descricao
          }
        ])
        .select()
        .single()

      if (err) throw err

      // Criar 4 cartões automaticamente
      const tiposCartao = ['teoria', 'pratica', 'estudo_caso', 'quiz']
      const cartoesParaCriar = tiposCartao.map(tipo => ({
        ua_id: uaData.id,
        tipo: tipo,
        nivel_turma: 'A definir',
        publico_alvo: 'A definir',
        detalhamento: novaUA.titulo,
        objetivo_atividade: `Atividade de ${tipo} para ${novaUA.titulo}`
      }))

      const { error: cartoesError } = await supabase
        .from('cartoes')
        .insert(cartoesParaCriar)

      if (cartoesError) {
        console.error('Erro ao criar cartões:', cartoesError)
        // Não falha a operação, apenas loga o erro
      }

      setNovaUA({ titulo: '', descricao: '' })
      setShowCreateUAModal(false)
      await carregarUAs(ucSelecionada)
    } catch (error) {
      console.error('Erro ao criar UA:', error)
      setError('Erro ao criar Unidade de Aprendizagem')
    } finally {
      setLoading(false)
    }
  }

  async function deletarUA(id: string) {
    if (!confirm('Tem certeza que deseja deletar esta UA e seus cartões?')) {
      return
    }

    try {
      setError(null)
      const { error: err } = await supabase
        .from('unidades_aprendizagem')
        .delete()
        .eq('id', id)

      if (err) throw err

      if (ucSelecionada) {
        await carregarUAs(ucSelecionada)
      }
    } catch (error) {
      console.error('Erro ao deletar UA:', error)
      setError('Erro ao deletar Unidade de Aprendizagem')
    }
  }

  const ucAtual = ucs.find(uc => uc.id === ucSelecionada)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center justify-between px-4 gap-4">
          <div className="flex items-center gap-3 flex-1">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-primary p-1.5">
                <BookOpen className="h-4 w-4 text-primary-foreground" />
              </div>
              <h1 className="text-lg font-bold">Dashboard</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button
              size="sm"
              onClick={() => setShowCreateUCModal(true)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Nova UC</span>
            </Button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="rounded-none border-x-0 border-t-0">
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setError(null)}
                className="h-auto p-0 hover:bg-transparent"
              >
                <X className="h-4 w-4" />
              </Button>
            </AlertDescription>
          </Alert>
        )}
      </header>

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Sidebar Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside className={`
          fixed md:relative top-0 left-0 z-40 h-full
          w-72 border-r bg-background transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
          <div className="flex flex-col h-full">
            <div className="p-4 border-b">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Unidades Curriculares
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))
              ) : ucs.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Nenhuma UC criada
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCreateUCModal(true)}
                    className="mt-3"
                  >
                    Criar Primeira
                  </Button>
                </div>
              ) : (
                ucs.map((uc) => (
                  <div
                    key={uc.id}
                    className={`
                      relative w-full rounded-lg border transition-all
                      ${ucSelecionada === uc.id
                        ? 'bg-primary/10 border-primary text-foreground shadow-sm'
                        : 'bg-card border-border hover:bg-accent hover:border-accent-foreground/20'
                      }
                    `}
                  >
                    <button
                      onClick={() => {
                        setUcSelecionada(uc.id)
                        if (window.innerWidth < 768) setSidebarOpen(false)
                      }}
                      className="w-full text-left p-4 pr-12"
                    >
                      <p className="font-medium truncate">{uc.titulo}</p>
                      {uc.descricao && (
                        <p className="text-xs text-muted-foreground truncate mt-1">
                          {uc.descricao}
                        </p>
                      )}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        deletarUC(uc.id)
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                      title="Deletar UC"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          {ucAtual ? (
            <div className="container max-w-5xl mx-auto p-4 md:p-6 space-y-6">
              {/* UC Header */}
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">{ucAtual.titulo}</h2>
                {ucAtual.descricao && (
                  <p className="text-muted-foreground">{ucAtual.descricao}</p>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Unidades
                      </p>
                      <p className="text-3xl font-bold">{uas.length}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Cartões
                      </p>
                      <p className="text-3xl font-bold">{uas.length * 4}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* CTA Button */}
              <div>
                <Button
                  onClick={() => setShowCreateUAModal(true)}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Criar Unidade de Aprendizagem
                </Button>
              </div>

              {/* UAs List */}
              <div className="space-y-4">
                {uas.length === 0 ? (
                  <Card className="border-dashed">
                    <CardContent className="p-12 text-center space-y-4">
                      <BookOpen className="h-16 w-16 mx-auto text-muted-foreground/50" />
                      <div className="space-y-2">
                        <p className="font-medium">Nenhuma Unidade de Aprendizagem</p>
                        <p className="text-sm text-muted-foreground">
                          Crie sua primeira unidade de aprendizagem para começar
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => setShowCreateUAModal(true)}
                      >
                        Criar Primeira UA
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  uas.map((ua) => (
                    <Card key={ua.id} className="group hover:shadow-md transition-all">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <h3 className="text-lg font-semibold">{ua.titulo}</h3>
                                <Badge variant="secondary">4 cartões</Badge>
                              </div>
                              {ua.descricao && (
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {ua.descricao}
                                </p>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <ButtonLink
                                href={`/dashboard/ua/${ua.id}`}
                                variant="outline"
                                size="sm"
                                className="gap-2"
                              >
                                <Eye className="h-4 w-4" />
                                Ver Cartões
                              </ButtonLink>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deletarUA(ua.id)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            aria-label="Deletar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="container max-w-3xl mx-auto p-4 md:p-6 space-y-6">
              <div className="text-center space-y-4">
                <BookOpen className="h-20 w-20 mx-auto text-muted-foreground/50" />
                <div className="space-y-2">
                  <p className="text-xl font-medium">Nenhuma UC selecionada</p>
                  <p className="text-muted-foreground">
                    Importe um Plano de Ensino (PDF) ou crie uma UC manualmente
                  </p>
                </div>
              </div>

              <ImportarPDF />

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Ou
                  </span>
                </div>
              </div>

              <div className="flex justify-center">
                <Button onClick={() => setShowCreateUCModal(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Criar UC Manualmente
                </Button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modal Criar UC */}
      <Modal
        open={showCreateUCModal}
        onOpenChange={setShowCreateUCModal}
        title="Criar Unidade Curricular"
        description="Defina o título e descrição da UC"
      >
        <div className="space-y-4">
          <Input
            label="Título da UC *"
            placeholder="Ex: Resistência dos Materiais, Cálculo Diferencial e Integral"
            value={novaUC.titulo}
            onChange={(e) => setNovaUC({ ...novaUC, titulo: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && criarUC()}
          />
          <Textarea
            label="Descrição"
            placeholder="Descrição da disciplina de engenharia"
            rows={3}
            value={novaUC.descricao}
            onChange={(e) => setNovaUC({ ...novaUC, descricao: e.target.value })}
          />
          <div className="flex gap-3 pt-4">
            <Button
              onClick={criarUC}
              isLoading={loading}
              className="flex-1"
            >
              Criar
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateUCModal(false)
                setNovaUC({ titulo: '', descricao: '' })
                setError(null)
              }}
              className="flex-1"
            >
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Criar UA */}
      <Modal
        open={showCreateUAModal}
        onOpenChange={setShowCreateUAModal}
        title="Criar Unidade de Aprendizagem"
        description={`Em: ${ucAtual?.titulo || ''}`}
      >
        <div className="space-y-4">
          <Input
            label="Título da UA *"
            placeholder="Ex: Análise de Vigas, Transformadas de Laplace"
            value={novaUA.titulo}
            onChange={(e) => setNovaUA({ ...novaUA, titulo: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && criarUA()}
          />
          <Textarea
            label="Descrição"
            placeholder="Descrição do tópico da aula"
            rows={3}
            value={novaUA.descricao}
            onChange={(e) => setNovaUA({ ...novaUA, descricao: e.target.value })}
          />
          <div className="flex gap-3 pt-4">
            <Button
              onClick={criarUA}
              isLoading={loading}
              className="flex-1"
            >
              Criar
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateUAModal(false)
                setNovaUA({ titulo: '', descricao: '' })
                setError(null)
              }}
              className="flex-1"
            >
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
