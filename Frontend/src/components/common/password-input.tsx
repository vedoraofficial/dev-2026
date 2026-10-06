import { Eye, EyeOff } from "lucide-react"
import { useState, type ComponentProps } from "react"

import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

/** A password `<Input>` with a Show/Hide toggle. Takes the same props as `Input` — spread
 * `register(name)` straight onto it like any other field. */
export function PasswordInput({ className, ...props }: ComponentProps<typeof Input>) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="relative">
      <Input type={visible ? "text" : "password"} className={cn("pr-16", className)} {...props} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        className="absolute inset-y-0 right-0 flex items-center gap-1 px-3.5 text-xs text-gold"
      >
        {visible ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
        {visible ? "Hide" : "Show"}
      </button>
    </div>
  )
}
