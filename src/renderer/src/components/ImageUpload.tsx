import React, { useState } from 'react'
import { Image } from 'antd'
import { toast } from 'sonner'
import dictionaryApi from '@renderer/apis/dictionary-api'
import { resolveAssetUrl } from '@/lib/backend-url'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Upload, X } from 'lucide-react'

interface ImageUploadProps {
  value?: string[]
  onChange?: (urls: string[]) => void
  maxCount?: number
}

const ImageUpload: React.FC<ImageUploadProps> = ({ value = [], onChange, maxCount = 5 }) => {
  const [uploading, setUploading] = useState(false)

  const handleUpload = async () => {
    try {
      setUploading(true)
      // Pick files using Electron
      const pickResult = await window.api.pickImages()

      if (!pickResult.success || pickResult.filePaths.length === 0) {
        if (pickResult.error) {
          toast.error(pickResult.error)
        }
        return
      }

      // Convert file paths to File objects and upload via HTTP
      const { readFilesAsFiles } = await import('@renderer/utils/fileReader')
      const files = await readFilesAsFiles(pickResult.filePaths)

      // Upload to backend
      const uploadResult = await dictionaryApi.uploadImages(files)

      if (uploadResult.success && uploadResult.urls.length > 0) {
        const newUrls = [...value, ...uploadResult.urls].slice(0, maxCount)
        onChange?.(newUrls)
        toast.success(`Đã tải lên ${uploadResult.urls.length} hình ảnh`)
      } else {
        const errors = uploadResult.errors || []
        if (errors.length > 0) {
          toast.error(`Tải lên thất bại: ${errors.join(', ')}`)
        } else {
          toast.error('Tải lên thất bại')
        }
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Có lỗi xảy ra khi tải lên hình ảnh')
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = (index: number) => {
    const newUrls = value.filter((_, i) => i !== index)
    onChange?.(newUrls)
  }

  const getImageUrl = (url: string): string => resolveAssetUrl(url)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-body-md text-neutral-900">
          Hình ảnh ({value.length}/{maxCount})
        </span>
        <Button
          variant="outline"
          onClick={handleUpload}
          disabled={uploading || value.length >= maxCount}
        >
          <Upload className={uploading ? 'animate-spin' : undefined} />
          Tải lên hình ảnh
        </Button>
      </div>

      {value.length > 0 && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {value.map((url, index) => (
            <div key={index} className="relative overflow-hidden rounded-lg border bg-card">
              <Image
                src={getImageUrl(url)}
                alt={`Upload ${index + 1}`}
                className="h-24 w-full object-cover"
                fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3Ik1RnG4W+FgYxN"
              />
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => handleRemove(index)}
                    aria-label="Xóa hình ảnh"
                    className="absolute right-1 top-1 flex size-6 items-center justify-center rounded-full bg-white/90 text-destructive shadow-sm hover:bg-white"
                  >
                    <X className="size-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Xóa hình ảnh</TooltipContent>
              </Tooltip>
            </div>
          ))}
        </div>
      )}

      {value.length === 0 && (
        <div className="rounded-lg border-2 border-dashed border-neutral-300 py-8 text-center text-muted-foreground">
          <Upload className="mx-auto mb-2 size-8 text-neutral-400" />
          <p className="text-body">Chưa có hình ảnh nào</p>
          <p className="text-small">Nhấn "Tải lên hình ảnh" để thêm</p>
        </div>
      )}
    </div>
  )
}

export default ImageUpload
