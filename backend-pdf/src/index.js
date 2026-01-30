import express from 'express'
import cors from 'cors'
import multer from 'multer'
import { PDFParse } from 'pdf-parse'
import { parsePlanoEnsino, gerarUAsDaEmenta } from './pdfParser.js'

const app = express()
const PORT = process.env.PORT || 3001

// Configuração do multer para upload de arquivos
const storage = multer.memoryStorage()
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true)
    } else {
      cb(new Error('Apenas arquivos PDF são permitidos'))
    }
 

// Middlewares - CORS configurado para aceitar múltiplas origens
const allowedOrigins = [
  'http://localhost:3000',
  'https://curador-rho.vercel.app',
  process.env.FRONTEND_URL
].filter(Boolean)

app.use(cors({
  origin: function(origin, callback) {
    // Permite requisições sem origin (Postman, curl, etc) ou de origens permitidas
    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      callback(null, true)
    } else {
      callback(null, true) // Por enquanto, permite tudo para facilitar
    }
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}))
app.use(express.json())

// Health check
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'PDF Parser Backend - Curador de Conteúdo Educacional',
    version: '1.0.0'
  })
})

// Endpoint para processar PDF
app.post('/parse-pdf', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Nenhum arquivo PDF fornecido'
      })
    }

    console.log(`📄 Processando PDF: ${req.file.originalname} (${req.file.size} bytes)`)

    // Configura o worker do PDF.js para Node.js
    PDFParse.setWorker()

    // Extrai texto do PDF
    const parser = new PDFParse({
      data: req.file.buffer,
      useNodeCanvas: true
    })

    const textResult = await parser.getText()
    const pdfText = textResult.text
    await parser.destroy()

    console.log(`✅ Texto extraído: ${pdfText.length} caracteres`)

    // Parse do texto para extrair informações estruturadas
    const planoData = parsePlanoEnsino(pdfText)

    // Gera UAs automaticamente da ementa
    const uas = gerarUAsDaEmenta(planoData.ementa)

    console.log(`✅ PDF processado: ${planoData.titulo}`)
    console.log(`   - ${planoData.topicos_geradores.length} tópicos geradores`)
    console.log(`   - ${uas.length} UAs geradas`)

    res.json({
      success: true,
      data: {
        unidade_curricular: planoData,
        unidades_aprendizagem: uas
      }
    })
  } catch (error) {
    console.error('❌ Erro ao processar PDF:', error)
    res.status(500).json({
      success: false,
      error: 'Erro ao processar o arquivo PDF: ' + error.message
    })
  }
})

// Error handler
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'Arquivo muito grande. Tamanho máximo: 10MB'
      })
    }
  }

  console.error('Erro não tratado:', error)
  res.status(500).json({
    success: false,
    error: error.message || 'Erro interno do servidor'
  })
})

app.listen(PORT, () => {
  console.log(`🚀 PDF Parser Backend rodando na porta ${PORT}`)
  console.log(`📍 Health check: http://localhost:${PORT}`)
  console.log(`📄 Endpoint PDF: http://localhost:${PORT}/parse-pdf`)
})
