/* eslint-disable @typescript-eslint/no-explicit-any */
'use server'

import { createClient } from '../../../lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function agregarMovimiento(formData: FormData) {
  try {
    const supabase = await createClient()

    const datos = {
      expediente_id: parseInt(formData.get('expediente_id') as string),
      administrador_id: parseInt(formData.get('administrador_id') as string),
      tipo_movimiento: formData.get('tipo_movimiento') as string,
      descripcion: formData.get('descripcion') as string,
    }

    const { error } = await supabase
      .from('movimientos')
      .insert(datos)

    if (error) throw error

    revalidatePath(`/admin/expedientes/${datos.expediente_id}`)

    return { success: true }
  } catch (error: any) {
    console.error('Error en agregarMovimiento:', error)
    return { success: false, error: 'Error al registrar movimiento' }
  }
}

export async function cambiarEstadoExpediente(expedienteId: number, nuevoEstado: string) {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('expedientes')
      .update({ estado: nuevoEstado })
      .eq('id', expedienteId)

    if (error) throw error

    revalidatePath(`/admin/expedientes/${expedienteId}`)

    return { success: true }
  } catch (error: any) {
    console.error('Error en cambiarEstadoExpediente:', error)
    return { success: false, error: 'Error al cambiar estado' }
  }
}