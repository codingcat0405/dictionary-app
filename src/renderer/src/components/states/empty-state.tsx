import React from 'react'
import { type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  /** lucide icon component, rendered 48px / neutral-300 per design brief §7 */
  icon: LucideIcon
  /** Vietnamese message shown under the icon */
  message: string
  /** optional supporting line under the message */
  description?: string
  /** optional primary action (e.g. "Thử lại", "Xóa bộ lọc") */
  action?: React.ReactNode
  className?: string
}

/**
 * Shared centered empty-state block (icon + message + optional action).
 * Used for "not searched yet" / "no results" / "no exercises" / "no files match
 * filter" surfaces across the user panel, and reused by Phase 03's admin tables
 * via `Table.locale.emptyText`.
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  message,
  description,
  action,
  className
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-2 px-6 py-12 text-center',
        className
      )}
    >
      <Icon className="mb-2 size-12 text-neutral-300" strokeWidth={1.5} aria-hidden />
      <p className="text-body font-medium text-neutral-700">{message}</p>
      {description && <p className="text-small text-muted-foreground">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}

export default EmptyState
