import { useState, type ReactNode } from "react"

import { MonoId } from "@/components/common/mono-id"
import { PageBody, PageHeader } from "@/components/common/page-header"
import { Panel } from "@/components/common/panel"
import { ProgressBar } from "@/components/common/progress-bar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { takenSlots } from "@/features/placement/mock-data"
import { formatINR } from "@/lib/format"
import { cn } from "@/lib/utils"

const TOTAL_SLOTS = 20
const paymentMethods = ["Online (UPI)", "Sponsor wallet", "Offline"] as const

function Step({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <Panel>
      <h2 className="mb-4 flex items-center gap-3 text-[0.9375rem] font-medium">
        <span className="grid size-6 place-items-center rounded-full bg-gold text-xs font-bold text-primary-foreground">
          {n}
        </span>
        {title}
      </h2>
      <div className="space-y-4">{children}</div>
    </Panel>
  )
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string
  htmlFor: string
  children: ReactNode
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor} className="eyebrow">
        {label}
      </Label>
      {children}
    </div>
  )
}

export function AdminManualPlacementPage() {
  const [slot, setSlot] = useState(15)
  const [payment, setPayment] = useState<(typeof paymentMethods)[number]>("Online (UPI)")

  const upline = "VED000418"
  const newId = "VED006483"
  const name = "Vaishnavi More"
  const slotsUsed = takenSlots.length
  const beyondCap = slot > TOTAL_SLOTS

  return (
    <>
      <PageHeader
        title="Manual Placement"
        subtitle="Place a new partner under a chosen upline · slot availability validated live"
        actions={
          <>
            <Button variant="quiet">Reset</Button>
            <Button>Confirm placement</Button>
          </>
        }
      />
      <PageBody>
        <div className="grid gap-4 md:gap-5 xl:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
          <div className="space-y-4 md:space-y-5">
            <Step n={1} title="New partner details">
              <Field label="Full name" htmlFor="fullName">
                <Input id="fullName" defaultValue={name} autoComplete="off" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Mobile" htmlFor="mobile">
                  <Input id="mobile" type="tel" inputMode="tel" defaultValue="+91 90112 " />
                </Field>
                <Field label="New ID" htmlFor="newId">
                  <Input
                    id="newId"
                    readOnly
                    value={newId}
                    className="border-gold/40 bg-gold/10 font-mono text-gold"
                  />
                </Field>
              </div>
              <Field label="PAN card" htmlFor="pan">
                <div className="relative">
                  <Input
                    id="pan"
                    defaultValue="ABCDE1234F"
                    autoCapitalize="characters"
                    className="pr-24 font-mono uppercase"
                  />
                  <span className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-xs font-medium text-success">
                    Unique ✓
                  </span>
                </div>
              </Field>
              <p className="text-[0.6875rem] text-muted-foreground">
                ID is auto-generated in sequence · one PAN can hold only one VEDORA ID.
              </p>
            </Step>

            <Step n={2} title="Select upline">
              <Field label="Upline VEDORA ID" htmlFor="upline">
                <div className="relative">
                  <Input
                    id="upline"
                    defaultValue={upline}
                    className="border-gold/50 pr-20 font-mono uppercase"
                  />
                  <span className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-xs font-medium text-success">
                    Valid ✓
                  </span>
                </div>
              </Field>
              <div className="rounded-xl border border-border bg-field/60 p-3.5">
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="text-foreground/85">Rohit Deshmukh</span>
                  <span className="font-medium text-success">
                    {TOTAL_SLOTS - slotsUsed} slots free
                  </span>
                </div>
                <ProgressBar value={slotsUsed} max={TOTAL_SLOTS} label="BV-eligible slots used" />
                <p className="mt-2 text-[0.6875rem] text-muted-foreground">
                  {slotsUsed} of {TOTAL_SLOTS} BV-eligible slots used
                </p>
              </div>
            </Step>

            <Step n={3} title="Registration payment">
              <div className="flex items-center justify-between text-[0.8125rem]">
                <span className="text-muted-foreground">Joining fee</span>
                <span className="font-display text-2xl">{formatINR(1999)}</span>
              </div>
              <div role="radiogroup" aria-label="Payment method" className="grid grid-cols-3 gap-2">
                {paymentMethods.map((method) => (
                  <button
                    key={method}
                    type="button"
                    role="radio"
                    aria-checked={payment === method}
                    onClick={() => setPayment(method)}
                    className={cn(
                      "rounded-xl border px-2 py-2.5 text-xs font-medium transition-colors",
                      payment === method
                        ? "border-gold/60 bg-gold/10 text-gold-light"
                        : "border-border text-muted-foreground hover:bg-muted/50",
                    )}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </Step>
          </div>

          <Panel className="flex flex-col">
            <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <h2 className="text-[0.9375rem] font-medium">
                Choose slot under <MonoId tone="gold">{upline}</MonoId>
              </h2>
              <p className="text-[0.6875rem] text-muted-foreground">
                Grey = taken · Gold = selected · Dashed = free
              </p>
            </div>

            <div className="grid grid-cols-4 gap-2.5 sm:grid-cols-5 md:gap-3">
              {Array.from({ length: TOTAL_SLOTS }, (_, i) => i + 1).map((n) => {
                const takenBy = takenSlots[n - 1]
                const selected = n === slot
                return (
                  <button
                    key={n}
                    type="button"
                    disabled={!!takenBy}
                    aria-pressed={selected}
                    aria-label={takenBy ? `Slot ${n}, taken by ${takenBy}` : `Slot ${n}, free`}
                    onClick={() => setSlot(n)}
                    className={cn(
                      "flex aspect-[4/3] min-w-0 flex-col items-center justify-center gap-1 rounded-xl border px-1 transition-colors",
                      takenBy && "border-border bg-field/70 text-muted-foreground",
                      !takenBy &&
                        !selected &&
                        "border-dashed border-gold/35 text-gold hover:bg-gold/10",
                      selected &&
                        "border-gold bg-gold text-primary-foreground shadow-[0_0_0_3px_rgba(201,169,97,0.25)]",
                    )}
                  >
                    <span className="text-xs font-medium tabular-nums">
                      {String(n).padStart(2, "0")}
                    </span>
                    {takenBy ? (
                      <span className="max-w-full truncate font-mono text-[0.5625rem] opacity-70">
                        {takenBy}
                      </span>
                    ) : selected ? (
                      <span className="text-[0.5625rem] font-bold tracking-wider uppercase">
                        Selected
                      </span>
                    ) : null}
                  </button>
                )
              })}
            </div>

            <div className="mt-5 flex gap-3 rounded-xl border border-border bg-field/60 p-3.5 text-xs leading-relaxed">
              <span aria-hidden className="mt-1 size-2 shrink-0 rotate-45 bg-danger" />
              <div>
                <p className="mb-1 font-medium text-danger">Placing beyond slot 20</p>
                <p className="text-muted-foreground">
                  Admin can still place a 21st partner or later under this ID. They stay permanently
                  valid in the genealogy tree, but generate no BV Level Income for this sponsor —
                  the commission engine skips them at every level.
                  {beyondCap ? " (Selected slot is beyond 20.)" : ""}
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-field/50 p-3.5 lg:mt-auto">
              <p className="min-w-0 text-[0.8125rem]">
                <span className="text-foreground/85">{name}</span>{" "}
                <MonoId tone="gold">{newId}</MonoId> → slot {slot} under{" "}
                <MonoId tone="gold">{upline}</MonoId>
              </p>
              <div className="flex w-full gap-2 sm:w-auto">
                <Button variant="quiet" className="flex-1 sm:flex-none">
                  Preview in tree
                </Button>
                <Button className="flex-1 sm:flex-none">Confirm placement</Button>
              </div>
            </div>
          </Panel>
        </div>
      </PageBody>
    </>
  )
}
