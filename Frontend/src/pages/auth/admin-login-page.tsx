import { zodResolver } from "@hookform/resolvers/zod"
import { Eye, EyeOff } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { Link, useNavigate } from "react-router-dom"

import { ROUTES } from "@/app/routes"
import logo from "@/assets/images/vedora-logo.jpg"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { loginSchema, type LoginValues } from "@/features/auth/schemas"

/** Root Admin's fixed VEDORA ID. Typed as VED108, VED0108 or VED000108. */
const isRootAdminId = (id: string) => Number(id.replace(/\D/g, "")) === 108

export function AdminLoginPage() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) })

  // Temporary: no auth API yet. Only the Root Admin ID is accepted here — everyone else
  // (Partners, Founders) signs in at /login.
  const onSubmit = ({ vedoraId }: LoginValues) => {
    if (!isRootAdminId(vedoraId)) {
      setError("vedoraId", {
        message: "That's not the Root Admin ID — use Partner Sign-in instead.",
      })
      return
    }
    navigate(ROUTES.admin.overview)
  }

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
              Admin Sign-in
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">Root Admin access only.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="vedoraId" className="eyebrow">
              VEDORA ID
            </Label>
            <Input
              id="vedoraId"
              placeholder="VED108"
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

          <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
            Sign in
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            Not an admin?{" "}
            <Link to={ROUTES.login} className="font-medium text-gold hover:underline">
              Partner sign-in →
            </Link>
          </p>
        </form>
      </section>
    </div>
  )
}
