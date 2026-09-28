import { Loader2 } from "lucide-react"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { PincodeInfo } from "@/features/placement/api"

type Lookup = { data: PincodeInfo | null | undefined; isFetching: boolean; isError: boolean }

/** One line under the pincode box: searching… / "Nashik district, Maharashtra ✓" / not found. */
export function PincodeHint({ lookup, complete }: { lookup: Lookup; complete: boolean }) {
  if (!complete) return null
  if (lookup.isFetching) {
    return (
      <p className="flex items-center gap-1.5 text-[0.6875rem] text-muted-foreground">
        <Loader2 className="size-3 animate-spin" aria-hidden /> Finding city…
      </p>
    )
  }
  if (lookup.isError) {
    return (
      <p className="text-[0.6875rem] text-muted-foreground">
        Couldn&apos;t look this up — type the city and state.
      </p>
    )
  }
  if (lookup.data === null) {
    return <p className="text-[0.6875rem] text-danger">Pincode not found</p>
  }
  if (!lookup.data) return null
  return (
    <p className="text-[0.6875rem] text-success">
      {lookup.data.district} district, {lookup.data.state} ✓
    </p>
  )
}

/** Post office / locality picker filled from the pincode lookup. */
export function AreaSelect({
  id,
  areas,
  value,
  onChange,
}: {
  id: string
  areas: string[]
  value: string
  onChange: (value: string) => void
}) {
  return (
    <Select value={value} onValueChange={onChange} disabled={areas.length === 0}>
      <SelectTrigger
        id={id}
        className="h-11 w-full rounded-xl bg-field px-3.5 text-[16px] data-[size=default]:h-11 md:h-10 md:text-sm md:data-[size=default]:h-10"
      >
        <SelectValue placeholder={areas.length ? "Select area" : "Enter pincode first"} />
      </SelectTrigger>
      <SelectContent position="popper">
        {areas.map((a) => (
          <SelectItem key={a} value={a}>
            {a}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
