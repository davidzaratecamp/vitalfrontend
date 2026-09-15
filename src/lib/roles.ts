import type { Role } from './types'

export const ROLE_LABEL: Record<Role, string> = {
  agente: 'Agente',
  backoffice: 'BackOffice',
  admin: 'Administrador',
}

export const ROLE_OPTIONS = (Object.keys(ROLE_LABEL) as Role[]).map((value) => ({
  value,
  label: ROLE_LABEL[value],
}))
