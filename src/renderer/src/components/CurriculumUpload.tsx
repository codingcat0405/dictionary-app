import React, { useState } from 'react'
import { Form, Input } from 'antd'
import { toast } from 'sonner'
import dictionaryApi from '@renderer/apis/dictionary-api'
import { resolveAssetUrl } from '@/lib/backend-url'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Upload, Trash2, Download, FileText } from 'lucide-react'

interface CurriculumUploadProps {
  onUpload: (data: {
    title: string
    description?: string
    fileName: string
    fileUrl: string
    fileSize: number
    mimeType: string
  }) => void
  onCancel: () => void
}

const CurriculumUpload: React.FC<CurriculumUploadProps> = ({ onUpload, onCancel }) => {
  const [form] = Form.useForm()
  const [uploadedFile, setUploadedFile] = useState<{
    fileName: string
    fileUrl: string
    fileSize: number
    mimeType: string
  } | null>(null)
  const [uploading, setUploading] = useState(false)

  const getFileUrl = (url: string): string => resolveAssetUrl(url)

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (mimeType: string): string => {
    if (mimeType.includes('pdf')) return '📄'
    if (mimeType.includes('word') || mimeType.includes('document')) return '📝'
    if (mimeType.includes('text')) return '📃'
    return '📁'
  }

  const getFileTypeDisplay = (mimeType: string): string => {
    if (mimeType.includes('pdf')) return 'PDF'
    if (mimeType.includes('word') || mimeType.includes('document')) return 'DOC'
    if (mimeType.includes('text')) return 'TXT'
    if (mimeType.includes('rtf')) return 'RTF'
    return 'FILE'
  }

  const handleUpload = async (): Promise<void> => {
    try {
      setUploading(true)
      // Pick file using Electron
      const pickResult = await window.api.pickDocument()

      if (!pickResult.success || !pickResult.filePath) {
        if (pickResult.error) {
          toast.error(pickResult.error)
        }
        return
      }

      // Convert file path to File object
      const { readFileAsFile } = await import('@renderer/utils/fileReader')
      const file = await readFileAsFile(pickResult.filePath, pickResult.mimeType || undefined)

      // Upload to backend
      const uploadResult = await dictionaryApi.uploadDocument(file)

      if (uploadResult.success && uploadResult.url) {
        setUploadedFile({
          fileName: uploadResult.fileName,
          fileUrl: uploadResult.url,
          fileSize: uploadResult.fileSize,
          mimeType: uploadResult.mimeType
        })
        toast.success('Tài liệu đã được tải lên thành công.')
      } else {
        toast.error('Tải lên thất bại')
      }
    } catch (error) {
      console.error('Error uploading document:', error)
      toast.error('Không thể tải lên tài liệu.')
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = (): void => {
    setUploadedFile(null)
    toast.success('Đã xóa tài liệu.')
  }

  const handleSubmit = async (): Promise<void> => {
    if (!uploadedFile) {
      toast.error('Vui lòng tải lên tài liệu trước.')
      return
    }

    try {
      const values = await form.validateFields()
      onUpload({
        title: values.title,
        description: values.description,
        fileName: uploadedFile.fileName,
        fileUrl: uploadedFile.fileUrl,
        fileSize: uploadedFile.fileSize,
        mimeType: uploadedFile.mimeType
      })
    } catch (error) {
      console.error('Form validation failed:', error)
    }
  }

  return (
    <Card className="gap-4 p-4">
      <div className="flex items-center justify-between">
        <span className="text-h3 text-neutral-900">Tải lên Giáo trình</span>
      </div>

      <Form form={form} layout="vertical">
        <Form.Item
          label="Tiêu đề"
          name="title"
          rules={[{ required: true, message: 'Vui lòng nhập tiêu đề!' }]}
        >
          <Input placeholder="Nhập tiêu đề giáo trình" />
        </Form.Item>

        <Form.Item label="Mô tả (tùy chọn)" name="description">
          <Input.TextArea placeholder="Nhập mô tả về giáo trình" rows={3} />
        </Form.Item>

        <Form.Item label="Tài liệu" required>
          {!uploadedFile ? (
            <div className="rounded-lg border-2 border-dashed border-neutral-300 py-8 text-center">
              <FileText className="mx-auto mb-4 size-10 text-neutral-400" />
              <div className="mb-4 text-body text-muted-foreground">
                Chưa có tài liệu nào được tải lên
              </div>
              <Button onClick={handleUpload} disabled={uploading}>
                <Upload className={uploading ? 'animate-spin' : undefined} />
                Tải lên tài liệu
              </Button>
              <div className="mt-2 text-small text-neutral-400">
                Hỗ trợ: PDF, DOC, DOCX, TXT, RTF
              </div>
            </div>
          ) : (
            <div className="rounded-lg bg-neutral-50 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getFileIcon(uploadedFile.mimeType)}</span>
                  <div>
                    <div className="text-body-md text-neutral-900">{uploadedFile.fileName}</div>
                    <div className="flex items-center gap-2 text-small text-muted-foreground">
                      <span>{formatFileSize(uploadedFile.fileSize)}</span>
                      <Badge variant="outline">{getFileTypeDisplay(uploadedFile.mimeType)}</Badge>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const link = document.createElement('a')
                      link.href = getFileUrl(uploadedFile.fileUrl)
                      link.download = uploadedFile.fileName
                      link.click()
                    }}
                  >
                    <Download />
                    Tải xuống
                  </Button>
                  <Button variant="destructive" size="sm" onClick={handleRemove}>
                    <Trash2 />
                    Xóa
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Form.Item>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>
            Hủy
          </Button>
          <Button onClick={handleSubmit} disabled={!uploadedFile}>
            Lưu Giáo trình
          </Button>
        </div>
      </Form>
    </Card>
  )
}

export default CurriculumUpload
