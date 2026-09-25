// 'customer' existió como rol aparte por un día (2026-09-24) — se integró
// dentro de 'agente' ("el customer es el mismo agente"), ver
// casosPostventa.service.js/.routes.js.
export type Role = 'agente' | 'backoffice' | 'admin' | 'supervisor'

/** Vital absorbió a la extinta Asiste Health Care ("Vital Asiste") pero
 * ambos lados quedan separados entre sí — agente/backoffice/supervisor
 * pertenecen a una sola. Admin no necesita una: ve las dos. */
export interface Empresa {
  id: number
  nombre: string
}

export interface User {
  id: number
  name: string
  email: string
  role: Role
  avatar_color: string
  is_active?: boolean
  // Los pide la carta de firma (FirmaCloud) — cedula es obligatoria al
  // enviar, phone es opcional. Se cargan desde Usuarios del sistema.
  cedula?: string | null
  phone?: string | null
  empresa_id?: number | null
  empresa_nombre?: string | null
  created_at?: string
}

export type EstadoFirma = 'pending' | 'viewed' | 'signed' | 'expired' | 'failed'

/** Un envío de la Carta CMS Vital (ver Integracion_API_Modulo_Vital.pdf) —
 * hay una fila por cada intento, la más reciente es "la actual". */
export interface FirmaDocumento {
  id: number
  cliente_id: number
  firmacloud_id: string | null
  estado: EstadoFirma
  canal: string
  enviado_por: number
  enviado_por_nombre?: string
  enviado_at: string | null
  visto_at: string | null
  firmado_at: string | null
  expirado_at: string | null
  firmante_nombre: string | null
  firmante_ip: string | null
  firmante_dispositivo: string | null
  created_at: string
  updated_at: string
}

export type EstadoCliente =
  | 'borrador'
  | 'pendiente_backoffice'
  | 'pendiente_llamada_tripartita'
  | 'aprobado'
  | 'rechazado_backoffice'

export interface Aseguradora {
  id: number
  nombre: string
  is_active: boolean
}

/** Productor con NPN — catálogo pequeño (4 personas licenciadas, no 1 por
 * agente) elegido por desplegable en el Paso 5, para la carta de firma
 * (FirmaCloud). `npn` queda nulo hasta que lo suministren. */
export interface NpnProductor {
  id: number
  nombre: string
  npn: string | null
  is_active: boolean
}

export interface Cliente {
  id: number
  agente_id: number
  agente_nombre?: string
  estado: EstadoCliente
  solicita_cobertura: boolean
  nombres: string
  apellidos: string
  sexo: 'Masculino' | 'Femenino'
  fecha_nacimiento: string
  social: string
  estatus_migratorio: string
  direccion: string
  tipo_vivienda: string | null
  estado_us: string
  condado: string
  ciudad: string
  codigo_postal: string
  correo_electronico: string
  phone_1: string
  phone_2: string | null
  whatsapp: string | null
  horario_contactabilidad: string | null
  contacto_emergencia_nombre: string | null
  contacto_emergencia_telefono: string | null
  contacto_emergencia_email: string | null
  origen_venta: 'lead' | 'referido' | 'base'
  pregunta_seguridad: string | null
  submitted_at: string | null
  created_at: string
  updated_at: string
}

export interface Dependiente {
  id: number
  cliente_id: number
  parentesco: 'Conyuge' | 'Hijo' | 'Hijastro' | 'Padre' | 'Madre' | 'Otro'
  solicita_cobertura: boolean
  medicare_medicaid: boolean
  nombres: string
  apellidos: string
  sexo: 'Masculino' | 'Femenino'
  fecha_nacimiento: string
  social: string | null
  estatus_migratorio: string
}

export interface Ingreso {
  id: number
  cliente_id: number
  dependiente_id: number | null
  tipo_declaracion: 'W2' | '1099'
  // El agente ya digita el anual directo (2026-09-22), no se calcula de
  // semanal*52 — semanal queda opcional/histórico, ya no se pide.
  ingresos_semanales: string | null
  ingresos_anuales: string
}

export interface PlanSalud {
  id: number
  cliente_id: number
  aseguradora_id: number
  aseguradora_nombre?: string
  nombre_plan: string
  tipo_metal: 'Bronce' | 'Plata' | 'Oro' | 'Platino'
  tipo_red: 'HMO' | 'PPO' | 'EPO'
  deducible: string | null
  gasto_max_bolsillo: string | null
  valor_prima: string
  /** Retirado del formulario y del resumen (2026-09-22) — ya nadie lo
   * digita ni lo ve. Puede seguir llegando en registros viejos, ningún
   * componente lo lee. */
  taxes: string | null
  // Lo que el agente ve en la pantalla "Usted paga" de la otra plataforma —
  // texto libre (ej. "Sin cargo por visita desde el día 1", "50% coaseguro
  // después del deducible"), no un número limpio.
  pd: string | null
  sd: string | null
  gd: string | null
  npn_productor_id: number | null
  npn_productor_nombre?: string | null
  /** El número de NPN real del productor elegido (npn_productores.npn) —
   * ya venía del backend, faltaba exponerlo acá. Puede ser null si a ese
   * productor todavía no le cargaron el número real. */
  npn_productor_npn?: string | null
  npn: string | null
  estado_prima: string | null
  version_origen: 'cotizado_agente' | 'confirmado_backoffice'
  is_current: boolean
  created_at: string
}

export type MarcaTarjeta = 'Visa' | 'Mastercard' | 'Otra'

export interface InformacionPago {
  id: number
  cliente_id: number
  metodo: 'tarjeta' | 'debito_automatico' | 'otro'
  ultimos_4_digitos: string | null
  marca_tarjeta: MarcaTarjeta | null
  nombre_titular_tarjeta: string | null
  fecha_expiracion_mes: number | null
  fecha_expiracion_ano: number | null
  /** true si ya hay un "Data Point" guardado — el valor en sí nunca viaja
   * acá, ni siquiera al agente que lo escribió. Ver DataPointCompleto. */
  tiene_data_point: boolean
}

/** Solo BackOffice/Admin — GET /clientes/:id/pago/numero-completo, queda
 * auditado en el servidor (accesos_tarjeta) en cada llamada. */
export interface NumeroTarjetaCompleto {
  numero_tarjeta: string
  marca_tarjeta: MarcaTarjeta | null
}

/** Solo BackOffice/Admin — GET /clientes/:id/pago/data-point. */
export interface DataPointCompleto {
  data_point: string | null
}

export interface Evidencia {
  id: number
  cliente_id: number
  nombre_archivo: string
  tipo_archivo: string
  /** Póliza/Estatus migratorio/Licencia/Social — ver clienteConstants.ts.
   * Null en evidencias subidas antes de que existiera esta categorización. */
  categoria: string | null
  tamano_bytes: number
  descripcion: string | null
  created_at: string
}

/** Adjunto opcional (PDF o imagen) que BackOffice suma a un caso — no es
 * del agente, tabla y ruta separadas de Evidencia. */
export interface SoportePoliza {
  id: number
  cliente_id: number
  /** 'poliza' (soporte de póliza) o 'rechazo' (imagen de soporte al
   * rechazar una venta) — mismo modelo, se distingue por este campo. */
  tipo: 'poliza' | 'rechazo'
  nombre_archivo: string
  tipo_archivo: string
  tamano_bytes: number
  subido_por: number
  created_at: string
}

export interface HistorialEstado {
  id: number
  cliente_id: number
  estado_anterior: EstadoCliente | null
  estado_nuevo: EstadoCliente
  cambiado_por: number
  cambiado_por_nombre: string
  motivo: string | null
  created_at: string
}

export interface Observacion {
  id: number
  cliente_id: number
  autor_id: number
  autor_nombre: string
  comentario: string
  created_at: string
}

export interface ClienteListItem {
  id: number
  nombres: string
  apellidos: string
  correo_electronico: string
  phone_1: string
  estado: EstadoCliente
  created_at: string
  submitted_at: string | null
  updated_at?: string
  agente_nombre: string
}

export interface ClienteRechazado extends ClienteListItem {
  rechazo_motivo: string | null
  rechazo_fecha: string | null
}

export interface ClienteDetalle extends Cliente {
  agente: { id: number; name: string; email: string }
  dependientes: Dependiente[]
  ingresos: Ingreso[]
  ingresos_totales_familia: number
  plan_salud: PlanSalud | null
  pago: InformacionPago | null
  evidencias: Evidencia[]
  historial: HistorialEstado[]
  observaciones: Observacion[]
  /** Descifrada del lado del servidor, visible para admin/supervisor/
   * backoffice (2026-09-23). Null si nunca se guardó, o si es una
   * respuesta de antes de este cambio (guardada solo con hash
   * irreversible — no se puede recuperar). */
  respuesta_seguridad: string | null
}

export interface DashboardData {
  total: number
  tasa_aprobacion: number | null
  por_estado: Record<EstadoCliente, number>
  por_agente: { agente_id: number | null; agente_nombre: string; total: number; aprobados: number }[]
  tendencia: { dia: string; calls: number }[]
}

export interface ReportePage {
  page: number
  page_size: number
  total: number
  total_pages: number
  rows: (ClienteListItem & { social: string; estado_us: string; ciudad: string; origen_venta: string })[]
}

export interface Notificacion {
  id: number
  usuario_id: number
  cliente_id: number | null
  tipo: 'rechazo' | 'nuevo_pendiente'
  mensaje: string
  leida: boolean
  created_at: string
}

export interface ResumenAgente {
  por_estado: Record<EstadoCliente, number>
  total: number
  aprobados_mes: number
}

export interface ClienteDuplicado {
  id: number
  nombres: string
  apellidos: string
  estado: EstadoCliente
  social: string
  correo_electronico: string
  agente_nombre: string
  coincide_por: ('SSN' | 'correo')[]
}

export interface ClienteContacto {
  id: number
  nombres: string
  apellidos: string
  estado: EstadoCliente
  agente_id: number
  agente_nombre: string
}

/* ───────────────────────── Postventa (Agente / BackOffice) ───────────────────────── */

export type EstadoCasoPostventa = 'nuevo' | 'seguimiento' | 'cerrado' | 'escalado_backoffice'
export type TipoGestionPostventa = 'reclamacion' | 'cancelacion' | 'gestion_habitual'

/** Cliente ya APROBADO que matcheó por teléfono al validar antes de abrir un
 * caso de postventa — ver casosPostventa.service.js#validarTelefono. */
export interface ClientePostventaContacto {
  id: number
  nombres: string
  apellidos: string
  estado: EstadoCliente
  phone_1: string
  phone_2: string | null
  whatsapp: string | null
  agente_nombre: string
}

export interface CasoPostventaListItem {
  id: number
  cliente_id: number
  tipo_caso: string
  tipo_gestion: TipoGestionPostventa | null
  estado: EstadoCasoPostventa
  telefono_contacto: string
  created_at: string
  updated_at: string
  cerrado_at: string | null
  nombres: string
  apellidos: string
  correo_electronico: string
  phone_1: string
  gestionado_por_nombre: string | null
  /** Rol de quien lo gestionó por última vez — para que admin distinga de
   * un vistazo si lo llevó un agente o BackOffice. */
  gestionado_por_rol: Role | null
}

export interface CasoPostventaDetalle {
  id: number
  cliente_id: number
  tipo_caso: string
  tipo_gestion: TipoGestionPostventa | null
  estado: EstadoCasoPostventa
  telefono_contacto: string
  observacion_inicial: string | null
  creado_por: number
  creado_por_nombre: string
  gestionado_por: number | null
  gestionado_por_nombre: string | null
  cerrado_at: string | null
  created_at: string
  updated_at: string
  cliente_nombres: string
  cliente_apellidos: string
  cliente_estado: EstadoCliente
}

export interface HistorialCasoPostventa {
  id: number
  caso_postventa_id: number
  estado_anterior: EstadoCasoPostventa | null
  estado_nuevo: EstadoCasoPostventa
  cambiado_por: number
  cambiado_por_nombre: string
  motivo: string | null
  created_at: string
}

/** Documento libre adjunto a un caso de postventa — sin categoría, sin
 * límite de negocio, lo puede subir agente o BackOffice mientras tengan el
 * caso activo (2026-09-25, pedido del usuario). */
export interface SoporteCasoPostventa {
  id: number
  caso_postventa_id: number
  nombre_archivo: string
  tipo_archivo: string
  tamano_bytes: number
  subido_por: number
  created_at: string
}
