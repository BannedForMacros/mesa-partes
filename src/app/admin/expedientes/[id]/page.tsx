/* eslint-disable @typescript-eslint/no-explicit-any */
import { auth } from '../../../../../lib/auth/auth'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'
import { ArrowLeft, FileText, Download, Clock, User } from 'lucide-react'
import { createClient } from '../../../../../lib/supabase/server'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import FormularioAgregarMovimiento from '../../../../../components/forms/FormularioAgregarMovimiento'

async function obtenerDetalleExpediente(id: string) {
  const supabase = await createClient()

  const { data: expediente, error } = await supabase
    .from('expedientes')
    .select(`
      *,
      usuario_externo:usuarios_externos(*)
    `)
    .eq('id', id)
    .single()

  if (error || !expediente) {
    return null
  }

  const { data: documentos } = await supabase
    .from('documentos_adjuntos')
    .select('*')
    .eq('expediente_id', id)
    .order('created_at', { ascending: true })

  const { data: movimientos } = await supabase
    .from('movimientos')
    .select(`
      *,
      administrador:administradores(nombres, apellidos)
    `)
    .eq('expediente_id', id)
    .order('created_at', { ascending: false })

  return {
    ...expediente,
    documentos: documentos || [],
    movimientos: movimientos || []
  }
}

export default async function DetalleExpedientePage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const session = await auth()

  if (!session?.user?.email) { // Verificamos que tenga email
    redirect('/admin/login')
  }

  // --- NUEVA LÓGICA: OBTENER ID DEL ADMINISTRADOR ---
  const supabase = await createClient()
  
  // Buscamos en la tabla 'administradores' usando el email de la sesión
  const { data: adminData } = await supabase
    .from('administradores')
    .select('id')
    .eq('email', session.user.email)
    .single()

  // Si no encontramos al admin en la tabla, adminId será undefined
  const adminIdReal = adminData?.id 
  
  if (!adminIdReal) {
    // Opcional: Redirigir si el usuario está logueado pero no existe en la tabla de admins
    console.error("El usuario logueado no tiene registro en la tabla administradores")
  }
  // --------------------------------------------------

  const { id } = await params
  const expediente = await obtenerDetalleExpediente(id)

  if (!expediente) {
    redirect('/admin/expedientes')
  }

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
            <Link href="/admin/expedientes">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Button>
            </Link>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900 font-mono">
                  {expediente.numero_expediente}
                </h1>
                <Badge className={getEstadoBadge(expediente.estado)}>
                  {expediente.estado.replace('_', ' ')}
                </Badge>
              </div>
              <p className="text-sm text-gray-600">
                Creado el {format(new Date(expediente.created_at), "d 'de' MMMM 'de' yyyy, HH:mm", { locale: es })}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Columna Izquierda */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Información del Expediente</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Tipo de Documento</p>
                    <p className="font-medium">{expediente.tipo_documento}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Estado</p>
                    <Badge className={getEstadoBadge(expediente.estado)}>
                      {expediente.estado.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Cantidad de Documentos</p>
                    <p className="font-medium">{expediente.cantidad_documentos}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Cantidad de Folios</p>
                    <p className="font-medium">{expediente.cantidad_folios}</p>
                  </div>
                </div>
                <Separator />
                <div>
                  <p className="text-sm text-gray-500 mb-1">Asunto</p>
                  <p className="text-sm">{expediente.asunto}</p>
                </div>
                <Separator />
                <div>
                  <p className="text-sm text-gray-500 mb-2">Remitente</p>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {expediente.usuario_externo.nombres} {expediente.usuario_externo.apellidos}
                      </p>
                      <p className="text-sm text-gray-600">DNI: {expediente.usuario_externo.dni}</p>
                      <p className="text-sm text-gray-600">{expediente.usuario_externo.email}</p>
                      {expediente.usuario_externo.telefono && (
                        <p className="text-sm text-gray-600">Tel: {expediente.usuario_externo.telefono}</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Documentos Adjuntos ({expediente.documentos.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {expediente.documentos.length > 0 ? (
                  <div className="space-y-2">
                    {expediente.documentos.map((doc: any) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <FileText className="w-5 h-5 text-blue-600" />
                          <div>
                            <p className="font-medium text-sm">{doc.nombre_archivo}</p>
                            <div className="flex items-center gap-3 text-xs text-gray-500">
                              <span className="font-medium text-blue-600">{doc.tipo}</span>
                              <span>•</span>
                              <span>{(doc.tamano_kb / 1024).toFixed(2)} MB</span>
                              <span>•</span>
                              <span>{format(new Date(doc.created_at), "d MMM yyyy", { locale: es })}</span>
                            </div>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No hay documentos adjuntos
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Columna Derecha */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Agregar Movimiento</CardTitle>
                <CardDescription>Registra una nueva acción en el expediente</CardDescription>
              </CardHeader>
              <CardContent>
                {adminIdReal ? (
                   /* AQUI PASAMOS EL ID CORRECTO */
                  <FormularioAgregarMovimiento 
                    expedienteId={expediente.id} 
                    adminId={adminIdReal} 
                  />
                ) : (
                  <div className="text-red-500 text-sm p-2 bg-red-50 rounded">
                    Error: Tu usuario no está registrado como administrador.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Historial de Movimientos
                </CardTitle>
              </CardHeader>
              <CardContent>
                {expediente.movimientos.length > 0 ? (
                  <div className="space-y-4">
                    {expediente.movimientos.map((mov: any, index: number) => (
                      <div key={mov.id} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className="w-2.5 h-2.5 bg-blue-600 rounded-full mt-1.5" />
                          {index < expediente.movimientos.length - 1 && (
                            <div className="w-0.5 h-full bg-gray-300 my-1" />
                          )}
                        </div>
                        <div className="flex-1 pb-4">
                          <div className="mb-1">
                            <p className="font-semibold text-sm">{mov.tipo_movimiento}</p>
                            <p className="text-xs text-gray-500">
                              {format(new Date(mov.created_at), "d MMM yyyy, HH:mm", { locale: es })}
                            </p>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">{mov.descripcion}</p>
                          {mov.administrador && (
                            <p className="text-xs text-gray-500">
                              Por: {mov.administrador.nombres} {mov.administrador.apellidos}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No hay movimientos registrados
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}