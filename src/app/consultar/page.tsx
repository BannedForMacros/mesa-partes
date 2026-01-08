import FormularioConsultaExpediente from '../../../components/forms/FormularioConsultaExpediente'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'

export default function ConsultarPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-blue-900">
            Consultar Expediente
          </h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <FormularioConsultaExpediente />

        <Card className="mt-6 border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-2 text-amber-900">¿No encuentras tu expediente?</h3>
            <ul className="text-sm text-amber-800 space-y-1">
              <li>• Verifica que el número de expediente esté escrito correctamente</li>
              <li>• Asegúrate de usar el mismo DNI con el que enviaste el documento</li>
              <li>• Si acabas de enviar tu documento, espera unos minutos</li>
              <li>• El formato del expediente es: EXP-2025-0001</li>
            </ul>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}