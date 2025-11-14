'use client'

import { BookOpen, ArrowRight, Sparkles, Brain, Zap, CheckCircle2 } from 'lucide-react'
import { ButtonLink } from '@/components/ui/ButtonLink'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { ThemeToggle } from '@/components/ThemeToggle'

export default function Home() {
  const features = [
    {
      icon: Brain,
      title: "IA Inteligente",
      description: "Geração automática de conteúdo educacional otimizado por IA"
    },
    {
      icon: Zap,
      title: "Rápido e Eficiente",
      description: "Crie 4 tipos de cartões instantaneamente para cada unidade"
    },
    {
      icon: Sparkles,
      title: "Alta Qualidade",
      description: "Prompts refinados para garantir excelência educacional"
    }
  ]

  const benefits = [
    "Organize disciplinas em Unidades Curriculares",
    "Crie Unidades de Aprendizagem personalizadas",
    "Gere cartões de Teoria, Prática, Caso e Quiz",
    "Refine prompts para melhor qualidade"
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      {/* Navbar */}
      <nav className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-primary p-2">
                <BookOpen className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                AI Curation
              </span>
              <Badge variant="secondary" className="ml-2 hidden sm:inline-flex">
                v1.0
              </Badge>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <ButtonLink href="/dashboard" size="sm">
                Entrar
                <ArrowRight className="ml-1 h-4 w-4" />
              </ButtonLink>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full border bg-secondary/50 px-4 py-1.5 text-sm animate-in fade-in slide-in-from-top-4 duration-700">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="font-medium">Powered by AI</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight animate-in fade-in slide-in-from-bottom-4 duration-1000">
            Crie Conteúdo{" "}
            <span className="bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
              Educacional
            </span>{" "}
            com IA
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200">
            Organize disciplinas, crie unidades de aprendizagem e gere automaticamente cartões educacionais otimizados por inteligência artificial.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
            <ButtonLink href="/dashboard" size="lg" className="w-full sm:w-auto">
              Começar Agora
              <ArrowRight className="ml-2 h-5 w-5" />
            </ButtonLink>
            <ButtonLink href="#features" variant="outline" size="lg" className="w-full sm:w-auto">
              Saiba Mais
            </ButtonLink>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 sm:gap-8 pt-12 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-500">
            <div className="space-y-2">
              <div className="text-3xl sm:text-4xl font-bold text-primary">4</div>
              <div className="text-sm text-muted-foreground">Tipos de Cartões</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl sm:text-4xl font-bold text-primary">AI</div>
              <div className="text-sm text-muted-foreground">Powered</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl sm:text-4xl font-bold text-primary">∞</div>
              <div className="text-sm text-muted-foreground">Possibilidades</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold">
              Por que escolher{" "}
              <span className="text-primary">AI Curation</span>?
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Descubra como nossa plataforma pode transformar a criação de conteúdo educacional
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              >
                <CardContent className="p-6 space-y-4">
                  <div className="rounded-lg bg-primary/10 w-12 h-12 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Benefits */}
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="p-8 md:p-12">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div className="space-y-6">
                  <h3 className="text-2xl sm:text-3xl font-bold">
                    Tudo que você precisa
                  </h3>
                  <ul className="space-y-4">
                    {benefits.map((benefit, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-foreground/90">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                  <ButtonLink href="/dashboard" size="lg" className="mt-4">
                    Começar Gratuitamente
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </ButtonLink>
                </div>
                <div className="hidden md:flex items-center justify-center">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/40 blur-3xl rounded-full"></div>
                    <BookOpen className="relative h-48 w-48 text-primary/40" strokeWidth={1} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <Card className="max-w-4xl mx-auto bg-gradient-to-br from-primary to-primary/80 border-0 text-primary-foreground">
          <CardContent className="p-8 md:p-12 text-center space-y-6">
            <h2 className="text-3xl sm:text-4xl font-bold">
              Pronto para começar?
            </h2>
            <p className="text-lg text-primary-foreground/90 max-w-2xl mx-auto">
              Junte-se a educadores que estão transformando a criação de conteúdo com IA
            </p>
            <ButtonLink
              href="/dashboard"
              size="lg"
              variant="secondary"
              className="mt-4"
            >
              Ir para Dashboard
              <ArrowRight className="ml-2 h-5 w-5" />
            </ButtonLink>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t bg-secondary/30 backdrop-blur">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <span className="font-semibold">AI Curation</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 AI Curation Toolkit. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
