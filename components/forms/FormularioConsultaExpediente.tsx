'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Loader2, Search, AlertCircle, FileText, Download, Clock } from 'lucide-react'
import { consultaExpedienteSchema } from '../../lib/validations/schemas'
import { consultarExpediente } from '@/app/actions/consulta-expediente'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

type ExpedienteData = {
  id: number
  numero_expediente: string
  tipo_documento: string
  cantidad_documentos: number
  cantidad_folios: number
  asunto: string
  estado: string
  created_at: string
  usuario_externo: {
    dni: string
    nombres: string
    apellidos: string
    email: string
  }
  documentos: Array<{
    id: number
    nombre_archivo: string
    tipo: string
    tamano_kb: number
    created_at: string
  }>
  movimientos: Array<{
    id: number
    tipo_movimiento: string
    descripcion: string
    created_at: string
    administrador: {
      nombres: string
      apellidos: string
    } | null
  }>
}

export default function FormularioConsultaExpediente() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [expediente, setExpediente] = useState<ExpedienteData | null>(null)

  const form = useForm({
    resolver: zodResolver(consultaExpedienteSchema),
    defaultValues: {
      numero_expediente: '',
      dni: '',
    }
  })

  const handleConsultar = async (data: z.infer<typeof consultaExpedienteSchema>) => {
    setLoading(true)
    setError('')
    setExpediente(null)

    const formData = new FormData()
    formData.append('numero_expediente', data.numero_expediente.toUpperCase())
    formData.append('dni', data.dni)

    const result = await consultarExpediente(formData)

    if (result.success && result.expediente) {
      setExpediente(result.expediente as ExpedienteData)
    } else {
      setError(result.error || 'Error al consultar')
    }

    setLoading(false)
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
    <div className="space-y-6">
      {/* Formulario de Búsqueda */}
      <Card>
        <CardHeader>
          <CardTitle>Consulta tu Expediente</CardTitle>
          <CardDescription>
            Ingresa tu número de expediente y DNI para ver el estado
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(handleConsultar)} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="numero_expediente">Número de Expediente</Label>
                <Input
                  id="numero_expediente"
                  placeholder="EXP-2025-0001"
                  className="uppercase"
                  {...form.register('numero_expediente')}
                />
                {form.formState.errors.numero_expediente && (
                  <p className="text-sm text-red-600">{form.formState.errors.numero_expediente.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="dni">DNI</Label>
                <Input
                  id="dni"
                  placeholder="12345678"
                  maxLength={8}
                  {...form.register('dni')}
                />
                {form.formState.errors.dni && (
                  <p className="text-sm text-red-600">{form.formState.errors.dni.message}</p>
                )}
              </div>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Consultando...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Consultar Expediente
                </>
              )}
            </Button>
          </form>

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Resultado de la Consulta */}
      {expediente && (
        <div className="space-y-6">
          {/* Información General */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl font-mono">{expediente.numero_expediente}</CardTitle>
                  <CardDescription>Expediente creado el {format(new Date(expediente.created_at), "d 'de' MMMM 'de' yyyy", { locale: es })}</CardDescription>
                </div>
                <Badge className={getEstadoBadge(expediente.estado)}>
                  {expediente.estado.replace('_', ' ')}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Tipo de Documento</p>
                  <p className="font-medium">{expediente.tipo_documento}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Remitente</p>
                  <p className="font-medium">{expediente.usuario_externo.nombres} {expediente.usuario_externo.apellidos}</p>
                  <p className="text-sm text-gray-500">DNI: {expediente.usuario_externo.dni}</p>
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

              <div>
                <p className="text-sm text-gray-500 mb-1">Asunto</p>
                <p className="text-sm">{expediente.asunto}</p>
              </div>
            </CardContent>
          </Card>

          {/* Documentos Adjuntos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Documentos Adjuntos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {expediente.documentos.length > 0 ? (
                <div className="space-y-2">
                  {expediente.documentos.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-blue-600" />
                        <div>
                          <p className="font-medium text-sm">{doc.nombre_archivo}</p>
                          <p className="text-xs text-gray-500">
                            {doc.tipo} • {(doc.tamano_kb / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No hay documentos adjuntos</p>
              )}
            </CardContent>
          </Card>

          {/* Línea de Tiempo - Movimientos */}
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
                  {expediente.movimientos.map((mov, index) => (
                    <div key={mov.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 bg-blue-600 rounded-full" />
                        {index < expediente.movimientos.length - 1 && (
                          <div className="w-0.5 h-full bg-gray-300 mt-2" />
                        )}
                      </div>
                      <div className="flex-1 pb-6">
                        <div className="flex items-start justify-between mb-1">
                          <p className="font-semibold">{mov.tipo_movimiento}</p>
                          <p className="text-xs text-gray-500">
                            {format(new Date(mov.created_at), "d MMM yyyy, HH:mm", { locale: es })}
                          </p>
                        </div>
                        <p className="text-sm text-gray-600">{mov.descripcion}</p>
                        {mov.administrador && (
                          <p className="text-xs text-gray-500 mt-1">
                            Por: {mov.administrador.nombres} {mov.administrador.apellidos}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No hay movimientos registrados</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}