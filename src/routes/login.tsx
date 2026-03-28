import { createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useState } from 'react'
import { getAuthStateFn, loginFn } from '#/features/auth/adminAuthFns'
import { Button } from '#/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'

export const Route = createFileRoute('/login')({
  beforeLoad: async () => {
    const { authenticated } = await getAuthStateFn()
    if (authenticated) throw redirect({ to: '/' })
  },
  component: LoginPage,
})

function LoginPage() {
  const [password, setPassword] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const router = useRouter()
  const runLogin = useServerFn(loginFn)

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Přihlášení správce</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {err ? <p className="text-sm text-destructive">{err}</p> : null}
          <div className="grid gap-2">
            <Label htmlFor="pw">Heslo</Label>
            <Input
              id="pw"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button
            type="button"
            onClick={async () => {
              setErr(null)
              const r = await runLogin({ data: { password } })
              if (r.ok) await router.navigate({ to: '/' })
              else setErr('Špatné heslo')
            }}
          >
            Přihlásit
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}
