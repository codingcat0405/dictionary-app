import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface DocumentViewerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  fileUrl: string
  fileName: string
}

const DocumentViewerDialog: React.FC<DocumentViewerDialogProps> = ({
  open,
  onOpenChange,
  fileUrl,
  fileName
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[85vh] w-[90vw] max-w-5xl flex-col gap-0 p-0 sm:max-w-5xl">
        <DialogHeader className="border-b px-4 py-3">
          <DialogTitle className="text-h3 truncate pr-8">{fileName}</DialogTitle>
        </DialogHeader>
        {open && (
          <iframe src={fileUrl} title={fileName} className="w-full flex-1 rounded-b-lg border-0" />
        )}
      </DialogContent>
    </Dialog>
  )
}

export default DocumentViewerDialog
