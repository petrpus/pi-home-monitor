import { Link, useRouterState } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { LogOut, Menu } from 'lucide-react'
import { type ReactNode, useState } from 'react'
import ThemeToggle from '#/components/ThemeToggle'
import { Button } from '#/components/ui/button'
import { ADMIN_LINKS, NAV, RESOURCE_TITLE } from '#/features/admin/admin-resource-copy'
import type { AdminResourceKey } from '#/features/admin/admin-types'
import { logoutFn } from '#/features/auth/adminAuthFns'
import { cn } from '#/lib/utils'

export function DashboardShell({
  children,
  activeResource,
}: {
  children: ReactNode
  activeResource?: AdminResourceKey
}) {
  const [open, setOpen] = useState(false)
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const runLogout = useServerFn(logoutFn)

  return (
    <div className="flex min-h-screen">
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-border bg-header-bg/90 backdrop-blur-md transition-transform lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-14 shrink-0 items-center px-4">
          <Link
            to="/"
            className="display-title text-lg font-semibold tracking-tight text-foreground no-underline"
          >
            Pi Home Monitor
          </Link>
        </div>
        <nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto p-3">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className={cn(
                'rounded-lg px-3 py-2 text-sm font-medium no-underline transition-colors',
                pathname === item.to || (item.to !== '/' && pathname.startsWith(item.to))
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              {item.label}
            </Link>
          ))}
          <div className="mt-3 mb-3 border-t border-border pt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            SPRÁVA
          </div>
          {ADMIN_LINKS.map(({ resource, to }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              className={cn(
                'rounded-lg px-3 py-2 text-sm no-underline transition-colors',
                activeResource === resource || pathname === to
                  ? 'bg-primary/15 font-medium text-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              {RESOURCE_TITLE[resource]}
            </Link>
          ))}
        </nav>
      </aside>
      {open ? (
        <button
          type="button"
          className="fixed inset-y-0 right-0 left-60 z-30 bg-black/30 lg:hidden"
          aria-label="Zavřít menu"
          onClick={() => setOpen(false)}
        />
      ) : null}
      <div className="flex min-h-screen min-w-0 flex-1 flex-col lg:pl-60">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-header-bg/90 px-4 backdrop-blur-md">
          <Button type="button" variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(true)}>
            <Menu className="h-5 w-5" />
            <span className="sr-only">Otevřít menu</span>
          </Button>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={async () => {
                await runLogout()
                window.location.href = '/login'
              }}
            >
              <LogOut className="h-4 w-4" />
              Odhlásit
            </Button>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}
