import { useState } from 'react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/common/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { UserAvatar } from '@/components/common/UserAvatar'
import { api, apiErrorMessage } from '@/lib/api'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { ROLE_LABEL } from '@/lib/roles'

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user)
  const { theme, setTheme } = useUiStore()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (next.length < 8) return toast.error('La nueva contraseña debe tener 8+ caracteres')
    if (next !== confirm) return toast.error('Las contraseñas no coinciden')
    setBusy(true)
    try {
      await api.post('/auth/change-password', { current_password: current, new_password: next })
      toast.success('Contraseña actualizada')
      setCurrent('')
      setNext('')
      setConfirm('')
    } catch (err) {
      toast.error(apiErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Ajustes" description="Tu perfil y preferencias de la aplicación." />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Perfil</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <UserAvatar name={user?.name} color={user?.avatar_color} size="md" />
          <div className="text-sm">
            <p className="font-medium">{user?.name}</p>
            <p className="text-muted-foreground">{user?.email}</p>
            <p className="text-muted-foreground">{user ? ROLE_LABEL[user.role] : ''}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Apariencia</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {(['light', 'dark', 'system'] as const).map((t) => (
              <Button
                key={t}
                variant={theme === t ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTheme(t)}
              >
                {t === 'light' ? 'Claro' : t === 'dark' ? 'Oscuro' : 'Sistema'}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cambiar contraseña</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={changePassword} noValidate className="max-w-sm space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="c-cur">Contraseña actual</Label>
              <Input id="c-cur" type="password" value={current} onChange={(e) => setCurrent(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-new">Nueva contraseña</Label>
              <Input id="c-new" type="password" value={next} onChange={(e) => setNext(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-conf">Repite la nueva contraseña</Label>
              <Input id="c-conf" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
            </div>
            <Button type="submit" disabled={busy}>
              {busy ? 'Guardando...' : 'Actualizar contraseña'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
