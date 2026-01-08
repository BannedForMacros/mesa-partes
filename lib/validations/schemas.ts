import { z } from 'zod'

// Validación de DNI peruano (8 dígitos)
export const dniSchema = z
  .string()
  .length(8, 'El DNI debe tener 8 dígitos')
  .regex(/^\d+$/, 'El DNI solo debe contener números')

// Validación de email
export const emailSchema = z
  .string()
  .email('Email inválido')
  .toLowerCase()

// Schema para datos personales
export const datosPersonalesSchema = z.object({
  dni: dniSchema,
  email: emailSchema,
  nombres: z.string().min(2, 'Nombres es requerido'),
  apellidos: z.string().min(2, 'Apellidos es requerido'),
  telefono: z.string().optional(),
})

// Schema para código de verificación
export const codigoVerificacionSchema = z.object({
  codigo: z.string().length(6, 'El código debe tener 6 dígitos'),
})

// Schema para datos del expediente
export const datosExpedienteSchema = z.object({
  tipo_documento: z.string().min(1, 'Seleccione un tipo de documento'),
  cantidad_documentos: z.number().min(1, 'Mínimo 1 documento'),
  cantidad_folios: z.number().min(1, 'Mínimo 1 folio'),
  asunto: z.string().min(10, 'El asunto debe tener al menos 10 caracteres'),
  aceptacion_politicas: z.boolean().refine((val) => val === true, {
    message: 'Debe aceptar las políticas de privacidad',
  }),
})

// Schema para consulta de expediente
export const consultaExpedienteSchema = z.object({
  numero_expediente: z.string().min(1, 'Ingrese el número de expediente'),
  dni: dniSchema,
})