import { createClient } from '../../lib/supabase/server'

export async function generarNumeroExpediente(): Promise<string> {
  const supabase = await createClient()
  const año = new Date().getFullYear()
  
  // Obtener el último número del año
  const { data } = await supabase
    .from('expedientes')
    .select('numero_expediente')
    .like('numero_expediente', `EXP-${año}-%`)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  let numero = 1
  
  if (data?.numero_expediente) {
    const ultimoNum = parseInt(data.numero_expediente.split('-')[2])
    numero = ultimoNum + 1
  }

  return `EXP-${año}-${String(numero).padStart(4, '0')}`
}