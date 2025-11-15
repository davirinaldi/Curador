'use client'

import { useState } from 'react'
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react'
import { Button } from './ui/Button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/Card'
import { Alert, AlertDescription } from './ui/Alert'
import { supabase } from '@/lib/supabase/client'

interface PlanoEnsinoData {
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

interface UnidadeAprendizagem {
  titulo: string
  descricao: string
}

export function ImportarPDF() {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [saving, setSaving] = useState(false)
  const [parsedData, setParsedData] = useState<{
    unidade_curricular: PlanoEnsinoData
    unidades_aprendizagem: UnidadeAprendizagem[]
  } | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile)
      setError(null)
      setSuccess(false)
      setParsedData(null)
    } else {
      setError('Por favor, selecione um arquivo PDF válido')
      setFile(null)
    }
  }

  const handleUpload = async () => {
    if (!file) {
      setError('Selecione um arquivo PDF primeiro')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      // Envia o PDF para a API backend externa
      const formData = new FormData()
      formData.append('pdf', file)

      const apiUrl = process.env.NEXT_PUBLIC_PDF_API_URL || 'http://localhost:3001'
      const response = await fetch(`${apiUrl}/parse-pdf`, {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Erro ao processar PDF')
      }

      setParsedData(result.data)
      setSuccess(true)
    } catch (err: any) {
      console.error('Erro:', err)
      setError(err.message || 'Erro ao processar o arquivo PDF')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveToDatabase = async () => {
    if (!parsedData || saving) return

    setSaving(true)
    setLoading(true)
    setError(null)

    try {
      const uc = parsedData.unidade_curricular

      // Insere a Unidade Curricular
      const { data: ucData, error: ucError } = await supabase
        .from('unidades_curriculares')
        .insert({
          titulo: uc.titulo,
          descricao: uc.ementa,
          periodo_letivo: uc.periodo_letivo,
          carga_horaria: uc.carga_horaria,
          cursos: uc.cursos,
          topicos_geradores: uc.topicos_geradores,
          metas_compreensao: uc.metas_compreensao,
          desempenho_compreensao: uc.desempenho_compreensao,
          ementa: uc.ementa,
          certificacao: uc.certificacao,
          competencias: uc.competencias,
          bibliografia_basica: uc.bibliografia_basica,
          bibliografia_complementar: uc.bibliografia_complementar,
          conteudo_programatico: uc.conteudo_programatico
        })
        .select()
        .single()

      if (ucError) throw ucError

      // Insere as Unidades de Aprendizagem
      const uasToInsert = parsedData.unidades_aprendizagem.map(ua => ({
        uc_id: ucData.id,
        titulo: ua.titulo,
        descricao: ua.descricao
      }))

      const { data: uasData, error: uasError } = await supabase
        .from('unidades_aprendizagem')
        .insert(uasToInsert)
        .select()

      if (uasError) throw uasError

      // Para cada UA, cria os 4 cartões
      const cartoesToInsert = uasData.flatMap(ua => [
        {
          ua_id: ua.id,
          tipo: 'teoria',
          nivel_turma: uc.periodo_letivo || '',
          publico_alvo: uc.cursos.join(', ') || '',
          detalhamento: 'Explicação detalhada com conceitos e exemplos',
          objetivo_atividade: ua.titulo
        },
        {
          ua_id: ua.id,
          tipo: 'pratica',
          nivel_turma: uc.periodo_letivo || '',
          publico_alvo: uc.cursos.join(', ') || '',
          detalhamento: 'Exercício prático com aplicações reais',
          objetivo_atividade: ua.titulo
        },
        {
          ua_id: ua.id,
          tipo: 'estudo_caso',
          nivel_turma: uc.periodo_letivo || '',
          publico_alvo: uc.cursos.join(', ') || '',
          detalhamento: 'Caso real de aplicação do conceito',
          objetivo_atividade: ua.titulo
        },
        {
          ua_id: ua.id,
          tipo: 'quiz',
          nivel_turma: uc.periodo_letivo || '',
          publico_alvo: uc.cursos.join(', ') || '',
          detalhamento: 'Questões para avaliação de conhecimento',
          objetivo_atividade: ua.titulo
        }
      ])

      const { error: cartoesError } = await supabase
        .from('cartoes')
        .insert(cartoesToInsert)

      if (cartoesError) throw cartoesError

      alert(`UC "${uc.titulo}" importada com sucesso!\n${uasData.length} UAs e ${cartoesToInsert.length} cartões criados.`)

      // Limpa o estado
      setFile(null)
      setParsedData(null)
      setSuccess(false)

      // Recarrega a página para mostrar as novas UCs
      window.location.reload()
    } catch (err: any) {
      console.error('Erro ao salvar no banco:', err)
      setError(err.message || 'Erro ao salvar no banco de dados')
    } finally {
      setLoading(false)
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Importar Plano de Ensino (PDF)
        </CardTitle>
        <CardDescription>
          Faça upload de um PDF de Plano de Ensino para criar automaticamente a UC, UAs e cartões
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Input de arquivo */}
        <div className="flex items-center gap-4">
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            disabled={loading}
            className="flex-1 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 file:cursor-pointer"
          />
          {file && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="h-4 w-4" />
              {file.name}
            </div>
          )}
        </div>

        {/* Botão de processar */}
        <Button
          onClick={handleUpload}
          disabled={!file || loading}
          isLoading={loading && !parsedData}
          className="w-full"
        >
          {loading && !parsedData ? 'Processando PDF...' : 'Processar PDF'}
        </Button>

        {/* Mensagens de erro/sucesso */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && parsedData && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              PDF processado com sucesso! Revise os dados abaixo antes de salvar.
            </AlertDescription>
          </Alert>
        )}

        {/* Preview dos dados extraídos */}
        {parsedData && (
          <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
            <div>
              <h3 className="font-semibold text-lg">{parsedData.unidade_curricular.titulo}</h3>
              <p className="text-sm text-muted-foreground">
                {parsedData.unidade_curricular.periodo_letivo} • {parsedData.unidade_curricular.carga_horaria}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium mb-2">
                Unidades de Aprendizagem: {parsedData.unidades_aprendizagem.length}
              </p>
              <ul className="text-sm space-y-1 list-disc list-inside">
                {parsedData.unidades_aprendizagem.slice(0, 5).map((ua, i) => (
                  <li key={i} className="text-muted-foreground">{ua.titulo}</li>
                ))}
                {parsedData.unidades_aprendizagem.length > 5 && (
                  <li className="text-muted-foreground">
                    ... e mais {parsedData.unidades_aprendizagem.length - 5}
                  </li>
                )}
              </ul>
            </div>

            <Button
              onClick={handleSaveToDatabase}
              isLoading={saving}
              disabled={saving}
              className="w-full"
              variant="primary"
            >
              {saving ? 'Salvando...' : 'Salvar no Banco de Dados'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
