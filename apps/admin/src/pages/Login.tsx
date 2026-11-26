import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { Button, TextField } from '../components/ui'
import { useAccess } from '../lib/access'
import { supabase } from '../lib/supabase'

function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-night p-10 text-white lg:flex">
        <p className="font-display text-[28px] tracking-[0.04em]">VOVIAN</p>
        <p className="max-w-sm font-display text-[40px] leading-tight">The studio, behind the scenes.</p>
      </div>
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <p className="mb-10 font-display text-[24px] tracking-[0.04em] lg:hidden">VOVIAN</p>
          <h1 className="font-display text-[34px]">{title}</h1>
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  )
}

export function Login({ noAccess }: { noAccess?: boolean }) {
  const { signOut } = useAccess()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [resetSent, setResetSent] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setBusy(false)
    if (error) setError('That email and password don’t match a staff account.')
  }

  async function forgot() {
    if (!email) return setError('Enter your email first, then choose “Reset password”.')
    await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}${import.meta.env.BASE_URL}reset-password` })
    setResetSent(true)
  }

  if (noAccess) {
    return (
      <Shell title="No admin access">
        <p className="text-graphite">This account isn’t a VOVIAN staff account. Ask a super admin to invite you, or sign in with another account.</p>
        <Button className="mt-6" variant="outline" onClick={signOut}>Sign out</Button>
      </Shell>
    )
  }

  return (
    <Shell title="Sign in">
      <form onSubmit={submit} className="grid gap-5" noValidate>
        {error && <p role="alert" className="border border-error p-3 text-[13px] text-error">{error}</p>}
        {resetSent && <p role="status" className="border border-ink p-3 text-[13px]">If that account exists, a reset link is on its way.</p>}
        <TextField label="Email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <TextField label="Password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <Button type="submit" loading={busy} className="h-11">Sign in</Button>
        <button type="button" onClick={forgot} className="w-fit cursor-pointer text-[13px] underline underline-offset-4">Reset password</button>
      </form>
    </Shell>
  )
}

export function ResetPassword() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  async function submit(e: FormEvent) {
    e.preventDefault()
    if (password.length < 10 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      return setError('Use at least 10 characters with a letter and a number.')
    }
    setBusy(true)
    const { error } = await supabase.auth.updateUser({ password })
    setBusy(false)
    if (error) return setError(error.message)
    navigate('/')
  }
  return (
    <Shell title="Set your password">
      <form onSubmit={submit} className="grid gap-5" noValidate>
        <TextField label="New password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} error={error} hint="At least 10 characters, with a letter and a number." />
        <Button type="submit" loading={busy}>Save password</Button>
      </form>
    </Shell>
  )
}
