/* eslint-disable @typescript-eslint/no-explicit-any */
import { auth } from '../../../../lib/auth/auth'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { ArrowLeft, FileText } from 'lucide-react'
import { createClient } from '../../../../lib/supabase/server'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

async function obtenerTodosExpedientes() {
  const supabase = await createClient()

  const { data: expedientes, error } = await supabase
    .from('expedientes')
    .select(`
      *,
      usuario_externo:usuarios_externos(
        nombres,
        apellidos,
        dni,
        email
      )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error:', error)
    return []
  }

  return expedientes || []
}

export default async function ExpedientesPage() {
  // AGREGAR ESTA VERIFICACIÓN
  const session = await auth()

  if (!session) {
    redirect('/admin/login')
  }

  const expedientes = await obtenerTodosExpedientes()

  const getEstadoBadge = (estado: string) => {
    const estilos: Record<string, string> = {
      PENDIENTE: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      EN_PROCESO: 'bg-blue-100 text-blue-800 border-blue-300',
      RESUELTO: 'bg-green-100 text-green-800 border-green-300',
      ARCHIVADO: 'bg-gray-100 text-gray-800 border-gray-300',
    }
    return estilos[estado] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/admin/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Todos los Expedientes</h1>
              <p className="text-sm text-gray-600">{expedientes.length} expedientes en total</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Lista de Expedientes</CardTitle>
            <CardDescription>Gestiona y revisa todos los expedientes</CardDescription>
          </CardHeader>
          <CardContent>
            {expedientes.length > 0 ? (
              <div className="space-y-3">
                {expedientes.map((exp: any) => (
                  <Link
                    key={exp.id}
                    href={`/admin/expedientes/${exp.id}`}
                    className="block p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <p className="font-mono font-semibold text-blue-600">
                            {exp.numero_expediente}
                          </p>
                          <Badge className={getEstadoBadge(exp.estado)}>
                            {exp.estado.replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className="text-sm font-medium mb-1">{exp.tipo_documento}</p>
                        <p className="text-sm text-gray-600 line-clamp-2 mb-2">{exp.asunto}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>
                            Por: {exp.usuario_externo.nombres} {exp.usuario_externo.apellidos}
                          </span>
                          <span>DNI: {exp.usuario_externo.dni}</span>
                          <span>{exp.cantidad_folios} folios</span>
                        </div>
                      </div>
                      <div className="text-right text-xs text-gray-500">
                        {format(new Date(exp.created_at), "d MMM yyyy, HH:mm", { locale: es })}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No hay expedientes registrados</p>
                <p className="text-sm">Los expedientes aparecerán aquí una vez que se envíen</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}