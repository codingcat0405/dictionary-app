import React from 'react'
import { AlertTriangle, WifiOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { ErrorStateVariant } from '@/components/states/classify-error'

// Re-export the type only (not `classifyError`, a value/function) so this file keeps
// exporting exclusively components — required for Fast Refresh. Import `classifyError`
// itself from `@/components/states/classify-error`.
export type { ErrorStateVariant }

interface ErrorStateProps {
  variant: ErrorStateVariant
  onRetry?: () => void
  className?: string
}

const COPY: Record<ErrorStateVariant, { title: string; description: string }> = {
  offline: {
    title: 'Không thể kết nối đến máy chủ.',
    description: 'Kiểm tra địa chỉ IP ở cuối màn hình.'
  },
  generic: {
    title: 'Đã có lỗi xảy ra.',
    description: 'Vui lòng thử lại sau.'
  }
}

/**
 * Inline (not full-page) error block — icon + short Vietnamese message + retry.
 * `offline` is the most common failure mode on this LAN-only app (backend PC off
 * or on the wrong IP), so it gets a distinct, more actionable message than the
 * generic fallback.
 */
export const ErrorState: React.FC<ErrorStateProps> = ({ variant, onRetry, className }) => {
  const Icon = variant === 'offline' ? WifiOff : AlertTriangle
  const copy = COPY[variant]

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-2 px-6 py-12 text-center',
        className
      )}
    >
      <Icon className="mb-2 size-12 text-error" strokeWidth={1.5} aria-hidden />
      <p className="text-body font-medium text-neutral-700">{copy.title}</p>
      <p className="text-small text-muted-foreground">{copy.description}</p>
      {onRetry && (
        <Button variant="outline" className="mt-2" onClick={onRetry}>
          Thử lại
        </Button>
      )}
    </div>
  )
}

export default ErrorState
