import { ArrowRight, Menu } from "lucide-react"
import { useState } from "react"
import { Link, NavLink } from "react-router-dom"

import { MAIN_NAV } from "@/website/app/navigation"
import { ROUTES } from "@/website/app/routes"
import { Container } from "@/website/components/common/container"
import { Logo } from "@/website/components/common/logo"
import { Button } from "@/website/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/website/components/ui/sheet"
import { cn } from "@/website/lib/utils"

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "rounded-md px-3 py-1.5 text-[0.8125rem] transition-colors",
    isActive ? "bg-muted text-foreground" : "text-foreground/75 hover:text-foreground",
  )

/** Sticky top bar: logo, main navigation, partner actions; a drawer below `lg`. */
export function SiteHeader() {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md">
      <Container className="flex h-16 items-center justify-between gap-4 md:h-[4.5rem]">
        <Link to={ROUTES.home} aria-label="VEDORA home">
          <Logo />
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
          {MAIN_NAV.map((item) => (
            <NavLink key={item.to} to={item.to} end className={navLinkClass}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-2.5 lg:flex">
          <Button variant="outline" size="sm" asChild>
            <Link to={ROUTES.becomePartner}>Become a Partner</Link>
          </Button>
          <Button size="sm" asChild>
            <Link to={ROUTES.portalLogin}>
              Partner Login <ArrowRight data-icon="inline-end" />
            </Link>
          </Button>
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[85vw] max-w-sm bg-background">
            <SheetHeader>
              <SheetTitle className="sr-only">Menu</SheetTitle>
              <Logo />
            </SheetHeader>
            <nav aria-label="Mobile" className="flex flex-col gap-1 px-4">
              {MAIN_NAV.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end
                  onClick={close}
                  className={({ isActive }) =>
                    cn(navLinkClass({ isActive }), "py-3 text-[0.9375rem]")
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
            <div className="mt-4 flex flex-col gap-3 px-4">
              <Button variant="outline" size="lg" asChild>
                <Link to={ROUTES.becomePartner} onClick={close}>
                  Become a Partner
                </Link>
              </Button>
              <Button size="lg" asChild>
                <Link to={ROUTES.portalLogin} onClick={close}>
                  Partner Login <ArrowRight data-icon="inline-end" />
                </Link>
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </Container>
    </header>
  )
}
