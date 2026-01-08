/* eslint-disable @typescript-eslint/no-explicit-any */
'use server'

import { createClient } from '../../../lib/supabase/server'
import { datosPersonalesSchema, codigoVerificacionSchema, datosExpedienteSchema } from '../../../lib/validations/schemas'
import { generarNumeroExpediente } from '../../../lib/utils/generar-expediente'
import { Resend } from 'resend'


const resend = new Resend(process.env.RESEND_API_KEY!)

// ============================================
// PASO 1: Validar DNI y Email, enviar código
// ============================================
export async function enviarCodigoVerificacion(formData: FormData) {
  try {
    const supabase = await createClient()
    
    // Validar datos
    const datos = datosPersonalesSchema.parse({
      dni: formData.get('dni'),
      email: formData.get('email'),
      nombres: formData.get('nombres'),
      apellidos: formData.get('apellidos'),
      telefono: formData.get('telefono') || null,
    })

    // Generar código de 6 dígitos
    const codigo = Math.floor(100000 + Math.random() * 900000).toString()
    const expiracion = new Date(Date.now() + 10 * 60 * 1000) // 10 minutos

    // Buscar usuario existente
    const { data: usuarioExistente } = await supabase
      .from('usuarios_externos')
      .select('*')
      .eq('dni', datos.dni)
      .single()

    if (usuarioExistente) {
      // Actualizar datos y código
      const { error } = await supabase
        .from('usuarios_externos')
        .update({
          email: datos.email,
          nombres: datos.nombres,
          apellidos: datos.apellidos,
          telefono: datos.telefono,
          codigo_verificacion: codigo,
          codigo_verificacion_expira: expiracion.toISOString(),
          email_verificado: false,
        })
        .eq('id', usuarioExistente.id)

      if (error) throw error
    } else {
      // Crear nuevo usuario
      const { error } = await supabase
        .from('usuarios_externos')
        .insert({
          dni: datos.dni,
          email: datos.email,
          nombres: datos.nombres,
          apellidos: datos.apellidos,
          telefono: datos.telefono,
          codigo_verificacion: codigo,
          codigo_verificacion_expira: expiracion.toISOString(),
          email_verificado: false,
        })

      if (error) throw error
    }

    // Enviar email con código
    const { error: emailError } = await resend.emails.send({
      from: 'Mesa de Partes <onboarding@resend.dev>', // Cambiar en producción
      to: datos.email,
      subject: 'Código de Verificación - Mesa de Partes Virtual',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1e40af; margin: 0;">Mesa de Partes Virtual</h1>
          </div>
          
          <h2 style="color: #1e40af;">Código de Verificación</h2>
          <p>Hola <strong>${datos.nombres} ${datos.apellidos}</strong>,</p>
          <p>Has iniciado el proceso de envío de documento a mesa de partes.</p>
          <p>Tu código de verificación es:</p>
          
          <div style="background: #eff6ff; padding: 30px; text-align: center; border-radius: 8px; margin: 30px 0; border: 2px solid #1e40af;">
            <h1 style="color: #1e40af; font-size: 48px; margin: 0; letter-spacing: 10px; font-family: monospace;">${codigo}</h1>
          </div>
          
          <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
            <p style="color: #dc2626; font-weight: bold; margin: 0;">⏰ Este código expira en 10 minutos</p>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            Si no solicitaste este código, puedes ignorar este mensaje de forma segura.
          </p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          
          <p style="color: #9ca3af; font-size: 12px; text-align: center;">
            Mesa de Partes Virtual - Sistema de Gestión de Documentos<br>
            Este es un correo automático, por favor no responder.
          </p>
        </div>
      `,
    })

    if (emailError) {
      console.error('Error al enviar email:', emailError)
      throw new Error('Error al enviar el código por email')
    }

    return { 
      success: true, 
      message: 'Código enviado a tu correo electrónico',
      dni: datos.dni,
      email: datos.email 
    }

    } catch (error: any) {
        console.error('Error en enviarCodigoVerificacion:', error)
        if (error?.errors) {
            return { 
            success: false, 
            error: error.errors[0]?.message || 'Error de validación'
            }
        }
        return { 
            success: false, 
            error: 'Error al enviar el código. Por favor, intenta nuevamente.' 
        }
    }
}

// ============================================
// PASO 2: Validar código ingresado
// ============================================
export async function validarCodigo(dni: string, codigo: string) {
  try {
    const supabase = await createClient()
    
    const validacion = codigoVerificacionSchema.parse({ codigo })
    
    // Buscar usuario con el DNI y código
    const { data: usuario, error } = await supabase
      .from('usuarios_externos')
      .select('*')
      .eq('dni', dni)
      .eq('codigo_verificacion', validacion.codigo)
      .single()

    if (error || !usuario) {
      return { 
        success: false, 
        error: 'Código inválido o incorrecto' 
      }
    }

    // Verificar si el código expiró
    const ahora = new Date()
    const expiracion = new Date(usuario.codigo_verificacion_expira)

    if (ahora > expiracion) {
      return { 
        success: false, 
        error: 'El código ha expirado. Solicita uno nuevo.' 
      }
    }

    // Marcar email como verificado
    await supabase
      .from('usuarios_externos')
      .update({ 
        email_verificado: true,
        codigo_verificacion: null, // Limpiar código usado
        codigo_verificacion_expira: null 
      })
      .eq('id', usuario.id)

    return { 
      success: true, 
      message: 'Código validado correctamente',
      verificado: true,
      usuario_id: usuario.id 
    }

  } catch (error) {
    console.error('Error en validarCodigo:', error)
    return { 
      success: false, 
      error: 'Error al validar el código' 
    }
  }
}

// ============================================
// PASO 3: Crear expediente y subir documentos
// ============================================
export async function crearExpediente(formData: FormData) {
  try {
    const supabase = await createClient()

    // Obtener datos del formulario
    const dni = formData.get('dni') as string
    const datos = datosExpedienteSchema.parse({
      tipo_documento: formData.get('tipo_documento'),
      cantidad_documentos: Number(formData.get('cantidad_documentos')),
      cantidad_folios: Number(formData.get('cantidad_folios')),
      asunto: formData.get('asunto'),
      aceptacion_politicas: formData.get('aceptacion_politicas') === 'true',
    })

    // Verificar que el usuario haya verificado su email
    const { data: usuario, error: usuarioError } = await supabase
      .from('usuarios_externos')
      .select('*')
      .eq('dni', dni)
      .eq('email_verificado', true)
      .single()

    if (usuarioError || !usuario) {
      return {
        success: false,
        error: 'Debes verificar tu email primero'
      }
    }

    // Generar número de expediente
    const numeroExpediente = await generarNumeroExpediente()

    // Crear expediente
    const { data: expediente, error: expError } = await supabase
      .from('expedientes')
      .insert({
        numero_expediente: numeroExpediente,
        usuario_externo_id: usuario.id,
        tipo_documento: datos.tipo_documento,
        cantidad_documentos: datos.cantidad_documentos,
        cantidad_folios: datos.cantidad_folios,
        asunto: datos.asunto,
        estado: 'PENDIENTE',
        aceptacion_politicas: datos.aceptacion_politicas,
        fecha_aceptacion_politicas: new Date().toISOString(),
      })
      .select()
      .single()

    if (expError || !expediente) {
      console.error('Error al crear expediente:', expError)
      throw new Error('Error al crear el expediente')
    }

    // Subir archivo principal
    const archivoPrincipal = formData.get('archivo_principal') as File
    if (archivoPrincipal && archivoPrincipal.size > 0) {
      const rutaPrincipal = `${numeroExpediente}/principal_${Date.now()}_${archivoPrincipal.name}`
      
      const { error: uploadError } = await supabase.storage
        .from('documentos-expedientes')
        .upload(rutaPrincipal, archivoPrincipal)

      if (uploadError) {
        console.error('Error al subir archivo:', uploadError)
        throw new Error('Error al subir el archivo principal')
      }

      // Guardar referencia en base de datos
      await supabase
        .from('documentos_adjuntos')
        .insert({
          expediente_id: expediente.id,
          nombre_archivo: archivoPrincipal.name,
          ruta_storage: rutaPrincipal,
          tipo: 'PRINCIPAL',
          tamano_kb: Math.round(archivoPrincipal.size / 1024),
          mime_type: archivoPrincipal.type,
        })
    }

    // Subir archivos complementarios (si existen)
    const archivosComplementarios = formData.getAll('archivos_complementarios') as File[]
    for (const archivo of archivosComplementarios) {
      if (archivo && archivo.size > 0) {
        const rutaComplementario = `${numeroExpediente}/complementario_${Date.now()}_${archivo.name}`
        
        const { error: uploadError } = await supabase.storage
          .from('documentos-expedientes')
          .upload(rutaComplementario, archivo)

        if (!uploadError) {
          await supabase
            .from('documentos_adjuntos')
            .insert({
              expediente_id: expediente.id,
              nombre_archivo: archivo.name,
              ruta_storage: rutaComplementario,
              tipo: 'COMPLEMENTARIO',
              tamano_kb: Math.round(archivo.size / 1024),
              mime_type: archivo.type,
            })
        }
      }
    }

    // Registrar primer movimiento
    await supabase
      .from('movimientos')
      .insert({
        expediente_id: expediente.id,
        administrador_id: null,
        tipo_movimiento: 'CREADO',
        descripcion: `Expediente creado por el ciudadano ${usuario.nombres} ${usuario.apellidos} (DNI: ${usuario.dni})`,
      })

    // Enviar email de confirmación
    await resend.emails.send({
      from: 'Mesa de Partes <onboarding@resend.dev>',
      to: usuario.email,
      subject: `Expediente Creado: ${numeroExpediente}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #059669;">✓ Expediente Creado Exitosamente</h1>
          
          <p>Hola <strong>${usuario.nombres} ${usuario.apellidos}</strong>,</p>
          
          <p>Tu documento ha sido recibido correctamente en nuestra mesa de partes virtual.</p>
          
          <div style="background: #ecfdf5; border-left: 4px solid #059669; padding: 20px; margin: 20px 0;">
            <p style="margin: 0; color: #065f46;"><strong>Número de Expediente:</strong></p>
            <h2 style="color: #059669; margin: 10px 0; font-family: monospace; letter-spacing: 2px;">${numeroExpediente}</h2>
          </div>
          
          <h3>Detalles del Expediente:</h3>
          <ul>
            <li><strong>Tipo de documento:</strong> ${datos.tipo_documento}</li>
            <li><strong>Asunto:</strong> ${datos.asunto}</li>
            <li><strong>Cantidad de documentos:</strong> ${datos.cantidad_documentos}</li>
            <li><strong>Cantidad de folios:</strong> ${datos.cantidad_folios}</li>
            <li><strong>Estado:</strong> PENDIENTE</li>
          </ul>
          
          <div style="background: #eff6ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0;"><strong>📌 Guarda este número de expediente</strong></p>
            <p style="margin: 5px 0 0 0; font-size: 14px;">Lo necesitarás para consultar el estado de tu trámite.</p>
          </div>
          
          <p>Puedes consultar el estado de tu expediente en cualquier momento en:</p>
          <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/consultar" style="color: #1e40af;">Consultar Expediente</a></p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          
          <p style="color: #6b7280; font-size: 12px;">
            Mesa de Partes Virtual<br>
            Este es un correo automático, por favor no responder.
          </p>
        </div>
      `,
    })

    return {
      success: true,
      message: 'Expediente creado exitosamente',
      numero_expediente: numeroExpediente,
    }
  } catch (error: any) {
    console.error('Error en enviarCodigoVerificacion:', error)
    if (error?.errors) {
        return { 
        success: false, 
        error: error.errors[0]?.message || 'Error de validación'
        }
    }
    return { 
        success: false, 
        error: 'Error al enviar el código. Por favor, intenta nuevamente.' 
    }
  }
}