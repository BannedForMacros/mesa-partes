import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Search, Shield } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-blue-900">
            Herramientas de Trazabilidad
          </h1>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Gestión de Documentos Simple y Rápida
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Envía y consulta tus documentos de manera digital. Sin filas, sin complicaciones.
          </p>
        </div>

        {/* Acciones Principales */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-16">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <CardTitle>Enviar Documento</CardTitle>
              <CardDescription>
                Presenta tu solicitud, reclamo o documento de manera digital
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/enviar-documento">
                <Button className="w-full" size="lg">
                  Comenzar Envío
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Search className="w-6 h-6 text-green-600" />
              </div>
              <CardTitle>Consultar Expediente</CardTitle>
              <CardDescription>
                Revisa el estado de tu documento con tu número de expediente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/consultar">
                <Button variant="outline" className="w-full" size="lg">
                  Consultar Estado
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Características */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="font-semibold mb-2">100% Seguro</h3>
            <p className="text-sm text-gray-600">
              Tus documentos están protegidos y encriptados
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="font-semibold mb-2">Fácil de Usar</h3>
            <p className="text-sm text-gray-600">
              Proceso simple en pocos pasos
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="font-semibold mb-2">Seguimiento en Tiempo Real</h3>
            <p className="text-sm text-gray-600">
              Consulta el estado cuando quieras
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white/80 backdrop-blur-sm mt-16">
        <div className="container mx-auto px-4 py-6 text-center text-gray-600">
          <p>© 2025 Mesa de Partes Virtual. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  )
}