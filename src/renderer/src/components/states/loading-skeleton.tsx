import React from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

/**
 * Named shaped skeletons for primary content-loading paths (dictionary lookup,
 * exercise list, curriculum grid). Per design brief §7: shape skeletons like the
 * content they replace to reduce layout shift — only used for primary loads, not
 * every sub-300ms async action (those keep an inline `Spin`).
 */

/** Mimics a word/definition/example result panel (DictionaryPage / AdvanceDictionaryPage). */
export const EntrySkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('space-y-4 rounded-lg border bg-card p-4', className)}>
    <div className="flex items-center gap-2">
      <Skeleton className="h-7 w-32" />
      <Skeleton className="h-4 w-20" />
    </div>
    <Skeleton className="h-4 w-24" />
    <div className="space-y-2">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-4 w-4/6" />
    </div>
    <div className="space-y-2">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  </div>
)

/** Mimics a vertical list of rows (ExercisePage exercise list). */
export const ListSkeleton: React.FC<{ rows?: number; className?: string }> = ({
  rows = 5,
  className
}) => (
  <div className={cn('space-y-3', className)}>
    {Array.from({ length: rows }).map((_, index) => (
      <div key={index} className="flex flex-col gap-2 rounded-md border p-3">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    ))}
  </div>
)

/** Mimics a card grid (CurriculumPage file grid). */
export const GridSkeleton: React.FC<{ items?: number; className?: string }> = ({
  items = 6,
  className
}) => (
  <div className={cn('grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3', className)}>
    {Array.from({ length: items }).map((_, index) => (
      <div key={index} className="space-y-3 rounded-lg border p-4">
        <Skeleton className="mx-auto h-10 w-10 rounded-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
        <Skeleton className="h-8 w-full" />
      </div>
    ))}
  </div>
)
