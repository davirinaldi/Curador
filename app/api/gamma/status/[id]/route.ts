import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

const GAMMA_API_KEY = process.env.NEXT_PUBLIC_GAMMA_API_KEY
const GAMMA_API_BASE_URL = 'https://public-api.gamma.app/v1.0'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!GAMMA_API_KEY) {
      return NextResponse.json(
        { error: 'API key do Gamma não configurada' },
        { status: 500 }
      )
    }

    const { id: generationId } = await params

    console.log('Verificando status da geração:', generationId)

    const response = await axios.get(
      `${GAMMA_API_BASE_URL}/generations/${generationId}`,
      {
        headers: {
          'X-API-KEY': GAMMA_API_KEY
        },
        timeout: 10000
      }
    )

    console.log('Resposta da API Gamma:', response.data)

    return NextResponse.json(response.data)

  } catch (error: any) {
    console.error('Erro ao verificar status no Gamma:', error)
    console.error('Status code:', error.response?.status)
    console.error('Response data:', error.response?.data)

    if (error.response?.status === 404) {
      return NextResponse.json(
        { error: 'Geração não encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Erro ao verificar status da geração' },
      { status: 500 }
    )
  }
}
