import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { Eye, EyeOff } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { Navigate, useNavigate } from "react-router-dom"

import { ROUTES } from "@/app/routes"
import logo from "@/assets/images/vedora-logo.jpg"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { login } from "@/features/auth/api"
import { ForgotPasswordDialog } from "@/features/auth/components/forgot-password-dialog"
import { loginSchema, type LoginValues } from "@/features/auth/schemas"
import { JoinPartnerDialog } from "@/features/genealogy/components/join-partner-dialog"
import { apiErrorMessage } from "@/lib/api"
import { useSession } from "@/lib/session"
import type { UserRole } from "@/types/session"

/** Where each role lands after signing in. */
const homeFor = (role: UserRole) =>
  role === "ADMIN" ? ROUTES.admin.overview : ROUTES.partner.dashboard

export function LoginPage() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(true)
  const signedInUser = useSession((s) => s.user)
  const signIn = useSession((s) => s.signIn)
  const {
    register,
    handleSubmit,
    setValue,
    setFocus,
    formState: { errors },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) })

  // One sign-in for everyone — the role the backend returns decides where you land.
  const loginMutation = useMutation({
    mutationFn: ({ vedoraId, password }: LoginValues) => login(vedoraId, password),
    onSuccess: ({ access_token, user }) => {
      signIn({ token: access_token, user }, remember)
      navigate(homeFor(user.role), { replace: true })
    },
  })
  const onSubmit = (values: LoginValues) => loginMutation.mutate(values)

  /** After joining or a password reset: fill in the ID and jump to the password box. */
  const prefillId = (vedId: string) => {
    setValue("vedoraId", vedId)
    setValue("password", "")
    setTimeout(() => setFocus("password"), 0)
  }

  // Already signed in (e.g. opened /login again) → straight to their portal.
  if (signedInUser) return <Navigate to={homeFor(signedInUser.role)} replace />

  return (
    <div className="grid min-h-svh lg:grid-cols-[1.1fr_1fr]">
      {/* Brand side */}
      <section className="relative flex flex-col justify-center gap-6 bg-[radial-gradient(ellipse_at_30%_20%,#0d2f20_0%,var(--background)_70%)] py-8 safe-x md:px-10 lg:px-14 lg:py-12">
        <div className="mx-auto w-full max-w-xl overflow-hidden rounded-3xl border border-gold/15 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.7)]">
          <img
            src={logo}
            alt="VEDORA — Wear Your Energy"
            className="aspect-[5/3] w-full object-cover"
            width={1400}
            height={834}
          />
        </div>
        <div className="mx-auto w-full max-w-xl">
          <h2 className="font-display text-4xl font-normal md:text-5xl">Wear Your Energy</h2>
          <p className="mt-3 max-w-sm text-sm text-muted-foreground">
            Natural gemstone bracelets, built into a direct-selling business you own.
          </p>
        </div>
      </section>

      {/* Form side */}
      <section className="flex items-center bg-sidebar py-10 safe-x md:px-10 lg:px-16">
        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="mx-auto w-full max-w-sm space-y-5"
        >
          <div>
            <h1 className="font-display text-[2rem] leading-tight font-normal md:text-4xl">
              Sign in
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">
              Use the VEDORA ID issued at registration.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="vedoraId" className="eyebrow">
              VEDORA ID
            </Label>
            <Input
              id="vedoraId"
              placeholder="VED000418"
              autoComplete="username"
              autoCapitalize="characters"
              spellCheck={false}
              aria-invalid={!!errors.vedoraId}
              className="font-mono tracking-wide uppercase placeholder:normal-case"
              {...register("vedoraId")}
            />
            {errors.vedoraId ? (
              <p role="alert" className="text-xs text-danger">
                {errors.vedoraId.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="eyebrow">
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                aria-invalid={!!errors.password}
                className="pr-16"
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute inset-y-0 right-0 flex items-center gap-1 px-3.5 text-xs text-gold"
              >
                {showPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            {errors.password ? (
              <p role="alert" className="text-xs text-danger">
                {errors.password.message}
              </p>
            ) : null}
          </div>

          <div className="flex items-center justify-between gap-3 text-xs">
            <label
              htmlFor="remember"
              className="flex cursor-pointer items-center gap-2 text-muted-foreground"
            >
              <Checkbox
                id="remember"
                checked={remember}
                onCheckedChange={(v) => setRemember(v === true)}
              />
              Remember me
            </label>
            <ForgotPasswordDialog onReset={prefillId} />
          </div>

          {loginMutation.isError ? (
            <p
              role="alert"
              className="rounded-xl border border-danger/40 bg-danger-soft/40 px-3.5 py-2.5 text-xs text-danger"
            >
              {apiErrorMessage(loginMutation.error, "Couldn't sign in. Try again.")}
            </p>
          ) : null}

          <Button type="submit" size="lg" className="w-full" disabled={loginMutation.isPending}>
            {loginMutation.isPending ? "Signing in…" : "Sign in"}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            New partner? <JoinPartnerDialog onJoined={prefillId} />
          </p>

          <p className="rounded-xl border border-border bg-card/70 p-3.5 text-center text-[0.6875rem] leading-relaxed text-muted-foreground">
            One login for everyone — your ID opens the right portal.
            <br />
            Admin <span className="font-mono text-gold">VED108</span> · Founders{" "}
            <span className="font-mono text-gold">VED000001–03</span> · Partners from{" "}
            <span className="font-mono text-gold">VED000004</span>
          </p>
        </form>
      </section>
    </div>
  )
}
