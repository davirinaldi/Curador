import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

export async function POST(request: NextRequest) {
  try {
    const { url, filename } = await request.json()

    if (!url) {
      return NextResponse.json(
        { error: 'URL não fornecida' },
        { status: 400 }
      )
    }

    console.log('Fazendo download do arquivo:', url)

    // Fazer download do arquivo via servidor (evita CORS)
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 60000
    })

    console.log('Download concluído, tamanho:', response.data.byteLength)

    // Detectar content-type
    const contentType = response.headers['content-type'] ||
                       (filename?.endsWith('.pdf') ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.presentationml.presentation')

    // Retornar o arquivo diretamente
    return new NextResponse(response.data, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename || 'download'}"`,
        'Content-Length': response.data.byteLength.toString()
      }
    })

  } catch (error: any) {
    console.error('Erro ao fazer download:', error)
    return NextResponse.json(
      { error: 'Erro ao fazer download do arquivo' },
      { status: 500 }
    )
  }
}
