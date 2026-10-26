import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { Eye, EyeOff } from "lucide-react"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom"

import { ROUTES } from "@/app/routes"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { login } from "@/features/auth/api"
import { AuthBrandPanel } from "@/features/auth/components/auth-brand-panel"
import { loginSchema, type LoginValues } from "@/features/auth/schemas"
import { apiErrorMessage } from "@/lib/api"
import { useSession } from "@/lib/session"
import type { UserRole } from "@/types/session"

/** Where each role lands after signing in. */
const homeFor = (role: UserRole) =>
  role === "ADMIN" ? ROUTES.admin.overview : ROUTES.partner.dashboard

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
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

  // Back from "Forgot password" with a new password: fill in the ID.
  const resetVedId = (location.state as { vedId?: string } | null)?.vedId
  useEffect(() => {
    if (resetVedId) prefillId(resetVedId)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once for the ID passed in
  }, [resetVedId])

  // Already signed in (e.g. opened /login again) → straight to their portal.
  if (signedInUser) return <Navigate to={homeFor(signedInUser.role)} replace />

  return (
    <div className="grid min-h-svh lg:grid-cols-[1.1fr_1fr]">
      <AuthBrandPanel />

      {/* Form side */}
      <section className="flex items-center bg-card/50 py-10 safe-x md:px-10 lg:px-16">
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
            <Link to={ROUTES.forgotPassword} className="font-medium text-gold hover:underline">
              Forgot password?
            </Link>
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
        </form>
      </section>
    </div>
  )
}
