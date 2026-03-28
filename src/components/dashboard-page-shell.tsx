import { type ReactNode } from 'react'

export type DashboardPageShellProps = {
  title: ReactNode
  description?: ReactNode
  /** Right side of the title row on larger screens (e.g. pagination). */
  headerEnd?: ReactNode
  children: ReactNode
}

/**
 * Shared page chrome for authenticated shell routes: max width, vertical rhythm,
 * and heading row aligned with admin list pages.
 */
export function DashboardPageShell({ title, description, headerEnd, children }: DashboardPageShellProps) {
  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="display-title text-2xl font-bold text-foreground md:text-3xl">{title}</h1>
          {description != null ? <p className="text-sm text-muted-foreground">{description}</p> : null}
        </div>
        {headerEnd ? <div className="flex flex-col gap-2 sm:items-end">{headerEnd}</div> : null}
      </div>
      {children}
    </div>
  )
}
