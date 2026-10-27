/**
 * Nombres en español de los campos del formulario — espejo (parcial) de
 * `backend/src/utils/fieldLabels.js`, que los usa para los mensajes de
 * validación. Acá sirven para el historial de cambios, que guarda el nombre
 * crudo de la columna y lo tiene que mostrar legible
 * (components/renovaciones/HistorialCambiosCard.tsx).
 *
 * Si un campo no está en la lista se muestra tal cual — es mejor ver
 * `codigo_postal` que no ver el renglón.
 */
export const FIELD_LABELS: Record<string, string> = {
  // Titular
  nombres: 'Nombres',
  apellidos: 'Apellidos',
  sexo: 'Sexo',
  fecha_nacimiento: 'Fecha de nacimiento',
  social: 'Social Security Number',
  estatus_migratorio: 'Estatus migratorio',
  direccion: 'Dirección',
  tipo_vivienda: 'Tipo de vivienda',
  estado_us: 'Estado (EE. UU.)',
  condado: 'Condado',
  ciudad: 'Ciudad',
  codigo_postal: 'Código postal',
  correo_electronico: 'Correo electrónico',
  phone_1: 'Teléfono principal',
  phone_2: 'Teléfono secundario',
  whatsapp: 'WhatsApp',
  horario_contactabilidad: 'Horario de contactabilidad',
  contacto_emergencia_nombre: 'Nombre del contacto de emergencia',
  contacto_emergencia_telefono: 'Teléfono del contacto de emergencia',
  origen_venta: 'Origen de la venta',
  pregunta_seguridad: 'Pregunta de seguridad',
  respuesta_seguridad: 'Respuesta de seguridad',
  solicita_cobertura: 'Solicita cobertura',

  // Cónyuge y dependientes
  parentesco: 'Parentesco',
  medicare_medicaid: 'Medicare/Medicaid',

  // Ingresos
  tipo_declaracion: 'Tipo de declaración',
  ingresos_anuales: 'Ingresos anuales',
  ingresos_semanales: 'Ingresos semanales',

  // Plan de salud
  aseguradora_id: 'Aseguradora',
  nombre_plan: 'Nombre del plan',
  tipo_metal: 'Tipo (metal)',
  tipo_red: 'Red',
  deducible: 'Deducible',
  gasto_max_bolsillo: 'Gasto máximo de bolsillo',
  valor_prima: 'Valor de la prima',
  npn: 'NPN',
  estado_prima: 'Estado de la prima',
  pd: 'Atención primaria',
  sd: 'Atención de especialista',
  gd: 'Medicamento genérico',
  npn_productor_id: 'Productor (NPN)',

  // Pago — los sensibles aparecen como cambiados pero sin valor.
  metodo: 'Método de pago',
  numero_tarjeta: 'Número de tarjeta',
  numero_cuenta: 'Número de cuenta',
  ultimos_4_digitos: 'Últimos 4 dígitos de la tarjeta',
  marca_tarjeta: 'Marca de la tarjeta',
  nombre_titular_tarjeta: 'Nombre del titular de la tarjeta',
  fecha_expiracion_mes: 'Mes de vencimiento',
  fecha_expiracion_ano: 'Año de vencimiento',
  data_point: 'Data Point',
  nombre_banco: 'Nombre del banco',
  numero_ruta: 'Número de ruta',
}
