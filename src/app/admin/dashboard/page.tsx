/* eslint-disable @typescript-eslint/no-explicit-any */
import { auth, signOut } from '../../../../lib/auth/auth'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { FileText, LogOut, Users, Clock } from 'lucide-react'
import { obtenerEstadisticas, obtenerExpedientesRecientes } from '@/app/actions/dashboard'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default async function DashboardPage() {
  const session = await auth()

  if (!session) {
    redirect('/admin/login')
  }

  const estadisticas = await obtenerEstadisticas()
  const expedientesRecientes = await obtenerExpedientesRecientes()

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
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Panel de Administración</h1>
            <p className="text-sm text-gray-600">
              Bienvenido, {session.user?.name}
            </p>
          </div>
          <form
            action={async () => {
              'use server'
              await signOut({ redirectTo: '/admin/login' })
            }}
          >
            <Button type="submit" variant="outline">
              <LogOut className="w-4 h-4 mr-2" />
              Cerrar Sesión
            </Button>
          </form>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Expedientes</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{estadisticas.totalExpedientes}</div>
              <p className="text-xs text-muted-foreground">Registrados en el sistema</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{estadisticas.pendientes}</div>
              <p className="text-xs text-muted-foreground">Esperando revisión</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Usuarios</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{estadisticas.totalUsuarios}</div>
              <p className="text-xs text-muted-foreground">Registrados</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Expedientes Recientes</CardTitle>
                <CardDescription>Últimos 10 expedientes recibidos</CardDescription>
              </div>
              <Link href="/admin/expedientes">
                <Button>Ver Todos</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {expedientesRecientes.length > 0 ? (
              <div className="space-y-4">
                {expedientesRecientes.map((exp: any) => (
                  <Link
                    key={exp.id}
                    href={`/admin/expedientes/${exp.id}`}
                    className="block p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <p className="font-mono font-semibold text-blue-600">
                            {exp.numero_expediente}
                          </p>
                          <Badge className={getEstadoBadge(exp.estado)}>
                            {exp.estado.replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className="text-sm font-medium">{exp.tipo_documento}</p>
                        <p className="text-sm text-gray-600 line-clamp-1">{exp.asunto}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Por: {exp.usuario_externo.nombres} {exp.usuario_externo.apellidos}
                        </p>
                      </div>
                      <div className="text-right text-xs text-gray-500">
                        {format(new Date(exp.created_at), "d MMM yyyy", { locale: es })}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No hay expedientes registrados</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}