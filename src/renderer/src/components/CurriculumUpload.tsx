import React, { useState } from 'react'
import { Button, message, Card, Input, Form } from 'antd'
import {
  UploadOutlined,
  DeleteOutlined,
  FileTextOutlined,
  DownloadOutlined
} from '@ant-design/icons'

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

  const getFileUrl = (url: string) => {
    if (url.startsWith('http')) {
      return url
    }
    const backendUrl = localStorage.getItem('backendUrl') || 'http://localhost:3000'
    return `${backendUrl}${url}`
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (mimeType: string) => {
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
      const response = await window.api.uploadDocument()
      if (
        response.success &&
        response.url &&
        response.fileName &&
        response.fileSize &&
        response.mimeType
      ) {
        setUploadedFile({
          fileName: response.fileName,
          fileUrl: response.url,
          fileSize: response.fileSize,
          mimeType: response.mimeType
        })
        message.success('Tài liệu đã được tải lên thành công.')
      } else if (response.error) {
        message.error(`Tải lên thất bại: ${response.error}`)
      }
    } catch (error) {
      console.error('Error uploading document:', error)
      message.error('Không thể tải lên tài liệu.')
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = (): void => {
    setUploadedFile(null)
    message.success('Đã xóa tài liệu.')
  }

  const handleSubmit = async (): Promise<void> => {
    if (!uploadedFile) {
      message.error('Vui lòng tải lên tài liệu trước.')
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
    <Card className="curriculum-upload-card">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-lg font-medium">Tải lên Giáo trình</span>
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
              <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                <FileTextOutlined className="text-4xl text-gray-400 mb-4" />
                <div className="text-gray-500 mb-4">Chưa có tài liệu nào được tải lên</div>
                <Button
                  type="primary"
                  icon={<UploadOutlined />}
                  onClick={handleUpload}
                  loading={uploading}
                >
                  Tải lên tài liệu
                </Button>
                <div className="text-sm text-gray-400 mt-2">Hỗ trợ: PDF, DOC, DOCX, TXT, RTF</div>
              </div>
            ) : (
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{getFileIcon(uploadedFile.mimeType)}</span>
                    <div>
                      <div className="font-medium">{uploadedFile.fileName}</div>
                      <div className="text-sm text-gray-500">
                        {formatFileSize(uploadedFile.fileSize)} •{' '}
                        {getFileTypeDisplay(uploadedFile.mimeType)}
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      type="link"
                      icon={<DownloadOutlined />}
                      onClick={() => {
                        const link = document.createElement('a')
                        link.href = getFileUrl(uploadedFile.fileUrl)
                        link.download = uploadedFile.fileName
                        link.click()
                      }}
                    >
                      Tải xuống
                    </Button>
                    <Button type="primary" danger icon={<DeleteOutlined />} onClick={handleRemove}>
                      Xóa
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </Form.Item>

          <div className="flex justify-end space-x-2">
            <Button onClick={onCancel}>Hủy</Button>
            <Button type="primary" onClick={handleSubmit} disabled={!uploadedFile}>
              Lưu Giáo trình
            </Button>
          </div>
        </Form>
      </div>
    </Card>
  )
}

export default CurriculumUpload
