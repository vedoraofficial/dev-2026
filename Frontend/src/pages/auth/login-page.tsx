import { zodResolver } from "@hookform/resolvers/zod"
import { Eye, EyeOff } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { useNavigate } from "react-router-dom"

import logo from "@/assets/images/vedora-logo.jpg"
import { MonoId } from "@/components/common/mono-id"
import { ROUTES } from "@/app/routes"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { loginSchema, type LoginValues } from "@/features/auth/schemas"

export function LoginPage() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) })

  // Temporary: no auth API yet. The Root Admin ID (VED108, also typed as VED0108 / VED000108)
  // goes to the admin panel, everyone else to the partner portal.
  const onSubmit = ({ vedoraId }: LoginValues) => {
    const isAdmin = Number(vedoraId.replace(/\D/g, "")) === 108
    navigate(isAdmin ? ROUTES.admin.overview : ROUTES.partner.dashboard)
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
              Partner Sign-in
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
              <Checkbox id="remember" />
              Remember me
            </label>
            <button type="button" className="font-medium text-gold hover:underline">
              Forgot password?
            </button>
          </div>

          <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
            Sign in
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            New partner?{" "}
            <button type="button" className="font-medium text-gold hover:underline">
              Join under your sponsor
            </button>
          </p>

          <p className="rounded-xl border border-border bg-card/70 p-3.5 text-[0.6875rem] leading-relaxed text-muted-foreground">
            One login for all roles. Admin <MonoId tone="gold">VED108</MonoId>, Founders{" "}
            <MonoId tone="gold">VED000001–03</MonoId>. Partners from{" "}
            <MonoId tone="gold">VED000004</MonoId>.
          </p>
        </form>
      </section>
    </div>
  )
}
