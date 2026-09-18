import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Plus, Users as UsersIcon } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { EmptyState } from '@/components/common/EmptyState'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { UserAvatar } from '@/components/common/UserAvatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useUsuarios, useCrearUsuario, useActualizarUsuario, useDesactivarUsuario } from '@/hooks/usuarios'
import { apiErrorMessage } from '@/lib/api'
import { ROLE_OPTIONS, ROLE_LABEL } from '@/lib/roles'
import type { User } from '@/lib/types'

export default function UsuariosPage() {
  const { data: usuarios, isLoading } = useUsuarios()
  const crear = useCrearUsuario()
  const actualizar = useActualizarUsuario()
  const desactivar = useDesactivarUsuario()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<User | undefined>()
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'agente', cedula: '', phone: '' })

  useEffect(() => {
    if (!open) return
    setForm({
      name: editing?.name ?? '',
      email: editing?.email ?? '',
      password: '',
      role: editing?.role ?? 'agente',
      cedula: editing?.cedula ?? '',
      phone: editing?.phone ?? '',
    })
  }, [open, editing])

  function abrir(user?: User) {
    setEditing(user)
    setOpen(true)
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    try {
      if (editing) {
        const body: Record<string, unknown> = {
          name: form.name,
          email: form.email,
          role: form.role,
          cedula: form.cedula || null,
          phone: form.phone || null,
        }
        if (form.password) body.password = form.password
        await actualizar.mutateAsync({ id: editing.id, ...body })
        toast.success('Usuario actualizado')
      } else {
        await crear.mutateAsync({ ...form, cedula: form.cedula || null, phone: form.phone || null })
        toast.success('Usuario creado')
      }
      setOpen(false)
    } catch (err) {
      toast.error(apiErrorMessage(err))
    }
  }

  async function toggleActive(u: User) {
    try {
      if (u.is_active) {
        await desactivar.mutateAsync(u.id)
      } else {
        await actualizar.mutateAsync({ id: u.id, is_active: true })
      }
      toast.success(u.is_active ? 'Usuario desactivado' : 'Usuario reactivado')
    } catch (err) {
      toast.error(apiErrorMessage(err))
    }
  }

  const busy = crear.isPending || actualizar.isPending

  return (
    <div className="space-y-6">
      <PageHeader
        title="Usuarios del sistema"
        description="Cuentas de agente, backoffice y administrador."
        actions={<Button onClick={() => abrir()}><Plus className="size-4" /> Nuevo usuario</Button>}
      />

      {isLoading ? (
        <Skeleton className="h-72 rounded-xl" />
      ) : !usuarios?.length ? (
        <EmptyState icon={UsersIcon} title="Sin usuarios" />
      ) : (
        <Card className="divide-y overflow-hidden">
          {usuarios.map((u) => (
            <div key={u.id} className="flex items-center gap-3 px-4 py-3">
              <UserAvatar name={u.name} color={u.avatar_color} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{u.name} {!u.is_active && <span className="text-xs text-muted-foreground">(inactivo)</span>}</p>
                <p className="truncate text-xs text-muted-foreground">{u.email}</p>
              </div>
              <span className="rounded-md bg-secondary px-2 py-0.5 text-xs font-medium">{ROLE_LABEL[u.role]}</span>
              <Button variant="outline" size="sm" onClick={() => abrir(u)}>Editar</Button>
              <Button variant={u.is_active ? 'destructive' : 'outline'} size="sm" onClick={() => toggleActive(u)}>
                {u.is_active ? 'Desactivar' : 'Reactivar'}
              </Button>
            </div>
          ))}
        </Card>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Editar usuario' : 'Nuevo usuario'}</DialogTitle></DialogHeader>
          <form onSubmit={submit} noValidate className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nombre</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required autoFocus />
            </div>
            <div className="space-y-1.5">
              <Label>Correo</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div className="space-y-1.5">
              <Label>{editing ? 'Nueva contraseña (opcional)' : 'Contraseña'}</Label>
              <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required={!editing} placeholder={editing ? 'Dejar vacío para no cambiarla' : 'Mínimo 8 caracteres'} />
            </div>
            <div className="space-y-1.5">
              <Label>Rol</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{ROLE_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Cédula</Label>
                <Input value={form.cedula} onChange={(e) => setForm({ ...form, cedula: e.target.value })} placeholder="Para la carta de firma" />
              </div>
              <div className="space-y-1.5">
                <Label>Teléfono</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Opcional" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={busy}>Cancelar</Button>
              <Button type="submit" disabled={busy}>{busy ? 'Guardando...' : 'Guardar'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
