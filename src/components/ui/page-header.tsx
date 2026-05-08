import { ReactNode } from "react"

interface PageHeaderProps {
  title: string
  subtitle?: string
  actions?: ReactNode
  icon?: ReactNode
}

export function PageHeader({ title, subtitle, actions, icon }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
      <div className="flex items-start gap-3">
        {icon && (
          <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
            {icon}
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-muted-foreground mt-1">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-3">
          {actions}
        </div>
      )}
    </div>
  )
}
