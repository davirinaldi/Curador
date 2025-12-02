import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

const GAMMA_API_KEY = process.env.NEXT_PUBLIC_GAMMA_API_KEY
const GAMMA_API_BASE_URL = 'https://public-api.gamma.app/v1.0'

export async function POST(request: NextRequest) {
  try {
    if (!GAMMA_API_KEY) {
      return NextResponse.json(
        { error: 'API key do Gamma não configurada' },
        { status: 500 }
      )
    }

    const body = await request.json()

    // Validar inputText (limite de ~400,000 caracteres)
    if (body.inputText && body.inputText.length > 400000) {
      return NextResponse.json(
        { error: 'O texto de entrada excede o limite de 400,000 caracteres' },
        { status: 400 }
      )
    }

    // Validar additionalInstructions se fornecido
    if (body.additionalInstructions && body.additionalInstructions.length > 2000) {
      return NextResponse.json(
        { error: 'As instruções adicionais não podem exceder 2000 caracteres' },
        { status: 400 }
      )
    }

    console.log('Criando geração no Gamma com parâmetros:', body)

    const response = await axios.post(
      `${GAMMA_API_BASE_URL}/generations`,
      body,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': GAMMA_API_KEY
        },
        timeout: 30000
      }
    )

    console.log('Resposta da criação:', response.data)

    return NextResponse.json(response.data)

  } catch (error: any) {
    console.error('Erro ao criar geração no Gamma:', error)

    if (error.response) {
      const status = error.response.status

      if (status === 401) {
        return NextResponse.json(
          { error: 'API key do Gamma inválida ou sem permissão' },
          { status: 401 }
        )
      } else if (status === 429) {
        return NextResponse.json(
          { error: 'Limite de requisições excedido. Aguarde alguns minutos.' },
          { status: 429 }
        )
      } else if (status === 400) {
        return NextResponse.json(
          { error: error.response.data?.message || 'Parâmetros inválidos' },
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Erro ao criar geração no Gamma' },
      { status: 500 }
    )
  }
}
