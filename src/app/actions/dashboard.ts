'use server'

import { createClient } from '../../../lib/supabase/server'

export async function obtenerEstadisticas() {
  try {
    const supabase = await createClient()

    // Total de expedientes
    const { count: totalExpedientes } = await supabase
      .from('expedientes')
      .select('*', { count: 'exact', head: true })

    // Expedientes pendientes
    const { count: pendientes } = await supabase
      .from('expedientes')
      .select('*', { count: 'exact', head: true })
      .eq('estado', 'PENDIENTE')

    // Total de usuarios
    const { count: totalUsuarios } = await supabase
      .from('usuarios_externos')
      .select('*', { count: 'exact', head: true })

    return {
      totalExpedientes: totalExpedientes || 0,
      pendientes: pendientes || 0,
      totalUsuarios: totalUsuarios || 0,
    }
  } catch (error) {
    console.error('Error en obtenerEstadisticas:', error)
    return {
      totalExpedientes: 0,
      pendientes: 0,
      totalUsuarios: 0,
    }
  }
}

export async function obtenerExpedientesRecientes() {
  try {
    const supabase = await createClient()

    const { data: expedientes, error } = await supabase
      .from('expedientes')
      .select(`
        *,
        usuario_externo:usuarios_externos(
          nombres,
          apellidos,
          dni
        )
      `)
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) throw error

    return expedientes || []
  } catch (error) {
    console.error('Error en obtenerExpedientesRecientes:', error)
    return []
  }
}