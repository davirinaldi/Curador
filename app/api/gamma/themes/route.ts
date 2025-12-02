import { NextResponse } from 'next/server'
import axios from 'axios'

const GAMMA_API_KEY = process.env.NEXT_PUBLIC_GAMMA_API_KEY
const GAMMA_API_BASE_URL = 'https://public-api.gamma.app/v1.0'

export async function GET() {
  try {
    if (!GAMMA_API_KEY) {
      return NextResponse.json(
        { error: 'API key do Gamma não configurada' },
        { status: 500 }
      )
    }

    const response = await axios.get(
      `${GAMMA_API_BASE_URL}/themes`,
      {
        headers: {
          'X-API-KEY': GAMMA_API_KEY
        }
      }
    )

    return NextResponse.json(response.data)

  } catch (error) {
    console.error('Erro ao buscar temas do Gamma:', error)
    return NextResponse.json(
      { themes: [] },
      { status: 200 }
    )
  }
}
