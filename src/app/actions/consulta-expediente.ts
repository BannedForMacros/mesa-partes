/* eslint-disable @typescript-eslint/no-explicit-any */
'use server'

import { createClient } from '../../../lib/supabase/server'
import { consultaExpedienteSchema } from '../../../lib/validations/schemas'

export async function consultarExpediente(formData: FormData) {
  try {
    const supabase = await createClient()

    // Validar datos
    const datos = consultaExpedienteSchema.parse({
      numero_expediente: formData.get('numero_expediente'),
      dni: formData.get('dni'),
    })

    // Buscar expediente por número y DNI
    const { data: expediente, error: expError } = await supabase
      .from('expedientes')
      .select(`
        *,
        usuario_externo:usuarios_externos(dni, nombres, apellidos, email)
      `)
      .eq('numero_expediente', datos.numero_expediente)
      .single()

    if (expError || !expediente) {
      return {
        success: false,
        error: 'No se encontró el expediente con ese número'
      }
    }

    // Verificar que el DNI coincida
    if (expediente.usuario_externo.dni !== datos.dni) {
      return {
        success: false,
        error: 'El DNI no coincide con el expediente'
      }
    }

    // Obtener documentos adjuntos
    const { data: documentos } = await supabase
      .from('documentos_adjuntos')
      .select('*')
      .eq('expediente_id', expediente.id)
      .order('created_at', { ascending: true })

    // Obtener movimientos
    const { data: movimientos } = await supabase
      .from('movimientos')
      .select(`
        *,
        administrador:administradores(nombres, apellidos)
      `)
      .eq('expediente_id', expediente.id)
      .order('created_at', { ascending: false })

    return {
      success: true,
      expediente: {
        ...expediente,
        documentos: documentos || [],
        movimientos: movimientos || []
      }
    }

  } catch (error: any) {
    console.error('Error en consultarExpediente:', error)
    if (error?.errors) {
      return {
        success: false,
        error: error.errors[0]?.message || 'Error de validación'
      }
    }
    return {
      success: false,
      error: 'Error al consultar el expediente'
    }
  }
}