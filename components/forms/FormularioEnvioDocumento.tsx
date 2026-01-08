'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CheckCircle, AlertCircle, FileText } from 'lucide-react'
import { datosPersonalesSchema, codigoVerificacionSchema, datosExpedienteSchema } from '../../lib/validations/schemas'
import { enviarCodigoVerificacion, validarCodigo, crearExpediente } from '@/app/actions/envio-documento'

export default function FormularioEnvioDocumento() {
  const [step, setStep] = useState<string>('datos-personales')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [dni, setDni] = useState('')
  const [email, setEmail] = useState('')
  const [numeroExpediente, setNumeroExpediente] = useState('')

  // ============================================
  // PASO 1: Datos Personales
  // ============================================
  const formDatosPersonales = useForm({
    resolver: zodResolver(datosPersonalesSchema),
    defaultValues: {
      dni: '',
      email: '',
      nombres: '',
      apellidos: '',
      telefono: '',
    }
  })

  const handleEnviarCodigo = async (data: z.infer<typeof datosPersonalesSchema>) => {
    setLoading(true)
    setError(null)

    const formData = new FormData()
    Object.entries(data).forEach(([key, value]) => {
      formData.append(key, value || '')
    })

    const result = await enviarCodigoVerificacion(formData)

    if (result.success) {
      setDni(data.dni)
      setEmail(data.email)
      setSuccess(result.message || null)
      setStep('verificar-codigo')
    } else {
      setError(result.error || 'Error al enviar código')
    }

    setLoading(false)
  }

  // ============================================
  // PASO 2: Verificar Código
  // ============================================
  const formCodigo = useForm({
    resolver: zodResolver(codigoVerificacionSchema),
    defaultValues: { codigo: '' }
  })

  const handleValidarCodigo = async (data: z.infer<typeof codigoVerificacionSchema>) => {
    setLoading(true)
    setError(null)

    const result = await validarCodigo(dni, data.codigo)

    if (result.success) {
      setSuccess(result.message || null)
      setStep('datos-expediente')
    } else {
      setError(result.error || 'Código inválido')
    }

    setLoading(false)
  }

  // ============================================
  // PASO 3: Datos del Expediente
  // ============================================
  const [archivoPrincipal, setArchivoPrincipal] = useState<File | null>(null)
  const [archivosComplementarios, setArchivosComplementarios] = useState<File[]>([])
  const [aceptaPoliticas, setAceptaPoliticas] = useState(false)

  const formExpediente = useForm({
    resolver: zodResolver(datosExpedienteSchema),
    defaultValues: {
      tipo_documento: '',
      cantidad_documentos: 1,
      cantidad_folios: 1,
      asunto: '',
      aceptacion_politicas: false,
    }
  })

  const handleCrearExpediente = async (data: z.infer<typeof datosExpedienteSchema>) => {
    if (!archivoPrincipal) {
      setError('Debes adjuntar el documento principal')
      return
    }

    setLoading(true)
    setError(null)

    const formData = new FormData()
    formData.append('dni', dni)
    formData.append('tipo_documento', data.tipo_documento)
    formData.append('cantidad_documentos', data.cantidad_documentos.toString())
    formData.append('cantidad_folios', data.cantidad_folios.toString())
    formData.append('asunto', data.asunto)
    formData.append('aceptacion_politicas', 'true')
    formData.append('archivo_principal', archivoPrincipal)
    
    archivosComplementarios.forEach(archivo => {
      formData.append('archivos_complementarios', archivo)
    })

    const result = await crearExpediente(formData)

    if (result.success) {
      setNumeroExpediente(result.numero_expediente || '')
      setStep('exito')
    } else {
      setError(result.error || 'Error al crear expediente')
    }

    setLoading(false)
  }

  // ============================================
  // RENDERIZADO
  // ============================================
  return (
    <div className="space-y-4">
      {/* Indicador de Pasos */}
      <div className="flex items-center justify-center gap-2 mb-6">
        <StepIndicator active={step === 'datos-personales'} completed={step !== 'datos-personales'} number={1} />
        <div className="w-12 h-0.5 bg-gray-300" />
        <StepIndicator active={step === 'verificar-codigo'} completed={step === 'datos-expediente' || step === 'exito'} number={2} />
        <div className="w-12 h-0.5 bg-gray-300" />
        <StepIndicator active={step === 'datos-expediente'} completed={step === 'exito'} number={3} />
      </div>

      {/* Alertas */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && step !== 'exito' && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {/* PASO 1: Datos Personales */}
      {step === 'datos-personales' && (
        <Card>
          <CardHeader>
            <CardTitle>Paso 1: Identificación</CardTitle>
            <CardDescription>Ingresa tus datos personales para comenzar</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={formDatosPersonales.handleSubmit(handleEnviarCodigo)} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dni">DNI *</Label>
                  <Input
                    id="dni"
                    maxLength={8}
                    placeholder="12345678"
                    {...formDatosPersonales.register('dni')}
                  />
                  {formDatosPersonales.formState.errors.dni && (
                    <p className="text-sm text-red-600">{formDatosPersonales.formState.errors.dni.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="correo@ejemplo.com"
                    {...formDatosPersonales.register('email')}
                  />
                  {formDatosPersonales.formState.errors.email && (
                    <p className="text-sm text-red-600">{formDatosPersonales.formState.errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nombres">Nombres *</Label>
                  <Input
                    id="nombres"
                    placeholder="Juan Carlos"
                    {...formDatosPersonales.register('nombres')}
                  />
                  {formDatosPersonales.formState.errors.nombres && (
                    <p className="text-sm text-red-600">{formDatosPersonales.formState.errors.nombres.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="apellidos">Apellidos *</Label>
                  <Input
                    id="apellidos"
                    placeholder="Pérez García"
                    {...formDatosPersonales.register('apellidos')}
                  />
                  {formDatosPersonales.formState.errors.apellidos && (
                    <p className="text-sm text-red-600">{formDatosPersonales.formState.errors.apellidos.message}</p>
                  )}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="telefono">Teléfono (Opcional)</Label>
                  <Input
                    id="telefono"
                    placeholder="999888777"
                    {...formDatosPersonales.register('telefono')}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando código...
                  </>
                ) : (
                  'Enviar Código de Verificación'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* PASO 2: Verificar Código */}
      {step === 'verificar-codigo' && (
        <Card>
          <CardHeader>
            <CardTitle>Paso 2: Verificación de Email</CardTitle>
            <CardDescription>
              Hemos enviado un código de 6 dígitos a <strong>{email}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={formCodigo.handleSubmit(handleValidarCodigo)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="codigo">Código de Verificación</Label>
                <Input
                  id="codigo"
                  maxLength={6}
                  placeholder="123456"
                  className="text-center text-2xl font-mono tracking-widest"
                  {...formCodigo.register('codigo')}
                />
                {formCodigo.formState.errors.codigo && (
                  <p className="text-sm text-red-600">{formCodigo.formState.errors.codigo.message}</p>
                )}
                <p className="text-xs text-gray-500">El código expira en 10 minutos</p>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep('datos-personales')}
                  className="flex-1"
                >
                  Volver
                </Button>
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verificando...
                    </>
                  ) : (
                    'Verificar Código'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* PASO 3: Datos del Expediente + Políticas */}
      {step === 'datos-expediente' && (
        <Card>
          <CardHeader>
            <CardTitle>Paso 3: Datos del Documento</CardTitle>
            <CardDescription>Completa la información de tu documento</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={formExpediente.handleSubmit(handleCrearExpediente)} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="tipo_documento">Tipo de Documento *</Label>
                  <Select onValueChange={(value) => formExpediente.setValue('tipo_documento', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona el tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Solicitud">Solicitud</SelectItem>
                      <SelectItem value="Reclamo">Reclamo</SelectItem>
                      <SelectItem value="Queja">Queja</SelectItem>
                      <SelectItem value="Sugerencia">Sugerencia</SelectItem>
                      <SelectItem value="Recurso de Reconsideración">Recurso de Reconsideración</SelectItem>
                      <SelectItem value="Recurso de Apelación">Recurso de Apelación</SelectItem>
                      <SelectItem value="Otro">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                  {formExpediente.formState.errors.tipo_documento && (
                    <p className="text-sm text-red-600">{formExpediente.formState.errors.tipo_documento.message}</p>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cantidad_documentos">Cantidad de Documentos *</Label>
                    <Input
                      id="cantidad_documentos"
                      type="number"
                      min={1}
                      defaultValue={1}
                      {...formExpediente.register('cantidad_documentos', { valueAsNumber: true })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cantidad_folios">Cantidad de Folios *</Label>
                    <Input
                      id="cantidad_folios"
                      type="number"
                      min={1}
                      defaultValue={1}
                      {...formExpediente.register('cantidad_folios', { valueAsNumber: true })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="asunto">Asunto *</Label>
                  <Textarea
                    id="asunto"
                    placeholder="Describe brevemente el motivo de tu documento..."
                    rows={4}
                    {...formExpediente.register('asunto')}
                  />
                  {formExpediente.formState.errors.asunto && (
                    <p className="text-sm text-red-600">{formExpediente.formState.errors.asunto.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="archivo_principal">Documento Principal * (Máx. 50MB)</Label>
                  <Input
                    id="archivo_principal"
                    type="file"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={(e) => setArchivoPrincipal(e.target.files?.[0] || null)}
                  />
                  {archivoPrincipal && (
                    <p className="text-sm text-green-600 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      {archivoPrincipal.name} ({(archivoPrincipal.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="archivos_complementarios">Documentos Complementarios (Opcional)</Label>
                  <Input
                    id="archivos_complementarios"
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={(e) => setArchivosComplementarios(Array.from(e.target.files || []))}
                  />
                  {archivosComplementarios.length > 0 && (
                    <p className="text-sm text-gray-600">
                      {archivosComplementarios.length} archivo(s) seleccionado(s)
                    </p>
                  )}
                </div>
              </div>

              {/* POLÍTICAS DE PRIVACIDAD Y CONSENTIMIENTO */}
              <Card className="border-blue-200 bg-blue-50">
                <CardHeader>
                  <CardTitle className="text-lg">Consentimiento y Protección de Datos Personales</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm text-gray-700 space-y-3 max-h-60 overflow-y-auto p-4 bg-white rounded border">
                    <p className="font-semibold">POLÍTICA DE PRIVACIDAD Y PROTECCIÓN DE DATOS PERSONALES</p>
                    
                    <p>En cumplimiento de la <strong>Ley N° 29733 - Ley de Protección de Datos Personales</strong> y su Reglamento aprobado por Decreto Supremo N° 003-2013-JUS, la entidad garantiza la protección de sus datos personales.</p>
                    
                    <p className="font-semibold">1. FINALIDAD DEL TRATAMIENTO</p>
                    <p>Sus datos personales serán utilizados exclusivamente para:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Registro y tramitación de su documento en mesa de partes</li>
                      <li>Seguimiento y notificaciones sobre el estado de su expediente</li>
                      <li>Comunicaciones oficiales relacionadas con su solicitud</li>
                      <li>Cumplimiento de obligaciones legales y administrativas</li>
                    </ul>

                    <p className="font-semibold">2. DATOS QUE SE RECOPILAN</p>
                    <p>Se recopilan los siguientes datos: DNI, nombres, apellidos, correo electrónico, teléfono (opcional), documentos adjuntos y toda información relacionada con su expediente.</p>

                    <p className="font-semibold">3. ALMACENAMIENTO Y SEGURIDAD</p>
                    <p>Sus datos serán almacenados en servidores seguros con medidas técnicas y organizativas para proteger su confidencialidad, integridad y disponibilidad.</p>

                    <p className="font-semibold">4. PLAZO DE CONSERVACIÓN</p>
                    <p>Los datos se conservarán durante el tiempo necesario para la tramitación del expediente y conforme a los plazos legales establecidos para la conservación de documentos administrativos.</p>

                    <p className="font-semibold">5. DERECHOS DEL TITULAR</p>
                    <p>Usted tiene derecho a:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Acceder a sus datos personales</li>
                      <li>Rectificar datos inexactos o incompletos</li>
                      <li>Cancelar sus datos cuando corresponda</li>
                      <li>Oponerse al tratamiento de sus datos</li>
                      <li>Revocar su consentimiento en cualquier momento</li>
                    </ul>

                    <p className="font-semibold">6. CONFIDENCIALIDAD</p>
                    <p>Sus datos no serán compartidos con terceros sin su consentimiento expreso, salvo obligación legal o requerimiento de autoridad competente.</p>

                    <p className="font-semibold">7. CONSENTIMIENTO</p>
                    <p>Al aceptar estos términos, usted otorga su consentimiento libre, previo, expreso e informado para el tratamiento de sus datos personales conforme a lo establecido en esta política.</p>

                    <p className="text-xs text-gray-500 mt-4">Última actualización: Enero 2025</p>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-white rounded border-2 border-blue-300">
                    <input
                      type="checkbox"
                      id="aceptacion_politicas"
                      checked={aceptaPoliticas}
                      onChange={(e) => {
                        setAceptaPoliticas(e.target.checked)
                        formExpediente.setValue('aceptacion_politicas', e.target.checked)
                      }}
                      className="mt-1 w-5 h-5"
                    />
                    <label htmlFor="aceptacion_politicas" className="text-sm cursor-pointer">
                      <span className="font-semibold">He leído y acepto</span> la Política de Privacidad y Protección de Datos Personales. 
                      Autorizo el tratamiento de mis datos personales para los fines descritos y declaro que la información proporcionada es verídica.
                    </label>
                  </div>

                  {formExpediente.formState.errors.aceptacion_politicas && (
                    <p className="text-sm text-red-600">{formExpediente.formState.errors.aceptacion_politicas.message}</p>
                  )}
                </CardContent>
              </Card>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep('verificar-codigo')}
                  className="flex-1"
                >
                  Volver
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1" 
                  size="lg" 
                  disabled={loading || !aceptaPoliticas || !archivoPrincipal}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creando Expediente...
                    </>
                  ) : (
                    'Enviar Documento'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* PASO 4: Éxito */}
      {step === 'exito' && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-green-900">¡Expediente Creado Exitosamente!</h2>
            <p className="text-gray-700">Tu documento ha sido recibido correctamente</p>
            
            <div className="bg-white p-6 rounded-lg border-2 border-green-300">
              <p className="text-sm text-gray-600 mb-2">Número de Expediente:</p>
              <p className="text-3xl font-bold text-green-600 font-mono tracking-wider">{numeroExpediente}</p>
            </div>

            <Alert>
              <AlertDescription>
                <strong>Importante:</strong> Guarda este número para consultar el estado de tu trámite. 
                También recibirás un email de confirmación.
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => window.location.href = '/'} className="flex-1">
                Volver al Inicio
              </Button>
              <Button onClick={() => window.location.href = '/consultar'} className="flex-1">
                Consultar Expediente
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Componente auxiliar para indicador de pasos
function StepIndicator({ active, completed, number }: { active: boolean; completed: boolean; number: number }) {
  return (
    <div className={`
      w-10 h-10 rounded-full flex items-center justify-center font-bold
      ${completed ? 'bg-green-600 text-white' : active ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'}
    `}>
      {completed ? <CheckCircle className="w-5 h-5" /> : number}
    </div>
  )
}