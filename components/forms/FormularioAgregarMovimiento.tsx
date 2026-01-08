'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react'
import { agregarMovimiento, cambiarEstadoExpediente } from '../../src/app/actions/movimientos'

interface Props {
  expedienteId: number
  adminId: number
}

export default function FormularioAgregarMovimiento({ expedienteId, adminId }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [tipoMovimiento, setTipoMovimiento] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [cambiarEstado, setCambiarEstado] = useState(false)
  const [nuevoEstado, setNuevoEstado] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!adminId || adminId === 0) {
      setError('Error crítico: No se ha identificado al usuario administrador. Recarga la página.')
      return
    }
    
    if (!tipoMovimiento || !descripcion.trim()) {
      setError('Todos los campos son requeridos')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    const formData = new FormData()
    formData.append('expediente_id', expedienteId.toString())
    formData.append('administrador_id', adminId.toString())
    formData.append('tipo_movimiento', tipoMovimiento)
    formData.append('descripcion', descripcion)

    const result = await agregarMovimiento(formData)

    if (result.success) {
      // Si se seleccionó cambiar estado, actualizarlo
      if (cambiarEstado && nuevoEstado) {
        await cambiarEstadoExpediente(expedienteId, nuevoEstado)
      }

      setSuccess('Movimiento registrado exitosamente')
      setTipoMovimiento('')
      setDescripcion('')
      setCambiarEstado(false)
      setNuevoEstado('')
      
      // Recargar página para mostrar el nuevo movimiento
      setTimeout(() => {
        router.refresh()
        setSuccess('')
      }, 1500)
    } else {
      setError(result.error || 'Error al registrar movimiento')
    }

    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="tipo_movimiento">Tipo de Movimiento *</Label>
        <Select value={tipoMovimiento} onValueChange={setTipoMovimiento}>
          <SelectTrigger>
            <SelectValue placeholder="Selecciona tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="RECIBIDO_CONFORME">Recibido Conforme</SelectItem>
            <SelectItem value="EN_REVISION">En Revisión</SelectItem>
            <SelectItem value="DERIVADO">Derivado</SelectItem>
            <SelectItem value="OBSERVADO">Observado</SelectItem>
            <SelectItem value="SUBSANADO">Subsanado</SelectItem>
            <SelectItem value="RESOLUCION_EMITIDA">Resolución Emitida</SelectItem>
            <SelectItem value="NOTIFICADO">Notificado</SelectItem>
            <SelectItem value="ARCHIVADO">Archivado</SelectItem>
            <SelectItem value="OTRO">Otro</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="descripcion">Descripción *</Label>
        <Textarea
          id="descripcion"
          placeholder="Describe el movimiento realizado..."
          rows={3}
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="cambiar_estado"
          checked={cambiarEstado}
          onChange={(e) => setCambiarEstado(e.target.checked)}
          className="w-4 h-4"
        />
        <Label htmlFor="cambiar_estado" className="cursor-pointer">
          Cambiar estado del expediente
        </Label>
      </div>

      {cambiarEstado && (
        <div className="space-y-2">
          <Label htmlFor="nuevo_estado">Nuevo Estado</Label>
          <Select value={nuevoEstado} onValueChange={setNuevoEstado}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PENDIENTE">Pendiente</SelectItem>
              <SelectItem value="EN_PROCESO">En Proceso</SelectItem>
              <SelectItem value="RESUELTO">Resuelto</SelectItem>
              <SelectItem value="ARCHIVADO">Archivado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Registrando...
          </>
        ) : (
          'Registrar Movimiento'
        )}
      </Button>
    </form>
  )
}