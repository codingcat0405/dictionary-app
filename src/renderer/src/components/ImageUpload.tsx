import React, { useState } from 'react'
import { Button, Image, message, Card } from 'antd'
import { UploadOutlined, DeleteOutlined } from '@ant-design/icons'

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
      const result = await window.api.uploadImages()

      if (result.success) {
        const newUrls = [...value, ...result.urls].slice(0, maxCount)
        onChange?.(newUrls)
        message.success(`Đã tải lên ${result.urls.length} hình ảnh`)
      } else {
        message.error(result.error || 'Tải lên thất bại')
      }
    } catch (error) {
      console.error('Upload error:', error)
      message.error('Có lỗi xảy ra khi tải lên hình ảnh')
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = (index: number) => {
    const newUrls = value.filter((_, i) => i !== index)
    onChange?.(newUrls)
  }

  const getImageUrl = (url: string) => {
    // If it's already a full URL, return as is
    if (url.startsWith('http')) {
      return url
    }
    // Otherwise, construct the full URL using the backend server
    const backendUrl = localStorage.getItem('backendUrl') || 'http://localhost:3000'
    const fullUrl = `${backendUrl}${url}`
    console.log('ImageUpload - Image URL construction:', { url, backendUrl, fullUrl })
    return fullUrl
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">
          Hình ảnh ({value.length}/{maxCount})
        </span>
        <Button
          type="dashed"
          icon={<UploadOutlined />}
          onClick={handleUpload}
          loading={uploading}
          disabled={value.length >= maxCount}
        >
          Tải lên hình ảnh
        </Button>
      </div>

      {value.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {value.map((url, index) => (
            <Card
              key={index}
              size="small"
              className="relative"
              cover={
                <Image
                  src={getImageUrl(url)}
                  alt={`Upload ${index + 1}`}
                  className="w-full h-24 object-cover"
                  fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3Ik1RnG4W+FgYxN"
                />
              }
              actions={[
                <Button
                  key="delete"
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleRemove(index)}
                  size="small"
                />
              ]}
            />
          ))}
        </div>
      )}

      {value.length === 0 && (
        <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
          <UploadOutlined className="text-4xl mb-2" />
          <p>Chưa có hình ảnh nào</p>
          <p className="text-sm">Nhấn "Tải lên hình ảnh" để thêm</p>
        </div>
      )}
    </div>
  )
}

export default ImageUpload
