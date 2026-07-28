import React from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'

interface ConfirmDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Name of the item being deleted, shown in the dialog so a mis-click is catchable. */
  itemName: string
  /** Optional override for the description line (defaults to a generic irreversible-action notice). */
  description?: string
  onConfirm: () => void
}

/**
 * Standardized destructive-action confirm, shared by the Dictionary/Exercises/Curriculum
 * admin tabs. Replaces the previous inconsistent mix of antd `Popconfirm` and
 * delete-on-click-with-no-confirm across those three tabs.
 */
const ConfirmDeleteDialog: React.FC<ConfirmDeleteDialogProps> = ({
  open,
  onOpenChange,
  itemName,
  description,
  onConfirm
}) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Xóa &ldquo;{itemName}&rdquo;?</AlertDialogTitle>
          <AlertDialogDescription>
            {description ?? 'Hành động này không thể hoàn tác.'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Hủy</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={onConfirm}>
            Xóa
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default ConfirmDeleteDialog
