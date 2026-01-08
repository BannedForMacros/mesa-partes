export interface UsuarioExterno {
  id: number
  dni: string
  email: string
  nombres: string | null
  apellidos: string | null
  telefono: string | null
  created_at: string
  updated_at: string
}

export interface Expediente {
  id: number
  numero_expediente: string
  usuario_externo_id: number
  tipo_documento: string
  cantidad_documentos: number
  cantidad_folios: number
  asunto: string
  estado: 'PENDIENTE' | 'EN_PROCESO' | 'RESUELTO' | 'ARCHIVADO'
  codigo_verificacion: string | null
  codigo_verificacion_expira: string | null
  aceptacion_politicas: boolean
  fecha_aceptacion_politicas: string | null
  created_at: string
  updated_at: string
}

export interface DocumentoAdjunto {
  id: number
  expediente_id: number
  nombre_archivo: string
  ruta_storage: string
  tipo: 'PRINCIPAL' | 'COMPLEMENTARIO'
  tamano_kb: number | null
  mime_type: string | null
  created_at: string
}

export interface Movimiento {
  id: number
  expediente_id: number
  administrador_id: number | null
  tipo_movimiento: string
  descripcion: string
  created_at: string
}

export interface Administrador {
  id: number
  email: string
  nombres: string
  apellidos: string
  rol: 'OPERADOR' | 'SUPERVISOR' | 'ADMIN'
  activo: boolean
  created_at: string
  updated_at: string
}