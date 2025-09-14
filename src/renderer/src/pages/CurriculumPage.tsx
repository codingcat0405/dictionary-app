import React, { useState, useEffect } from 'react'
import { Card, Button, Tag, Spin, Input } from 'antd'
import { DownloadOutlined, FileTextOutlined, SearchOutlined } from '@ant-design/icons'
import dictionaryApi, { Curriculum } from '@renderer/apis/dictionary-api'
import { toast } from 'react-hot-toast'

const CurriculumPage: React.FC = () => {
  const [curriculums, setCurriculums] = useState<Curriculum[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadCurriculums()
  }, [])

  const loadCurriculums = async (): Promise<void> => {
    try {
      setLoading(true)
      const response = await dictionaryApi.getAllCurriculums({ page: 0, limit: 100 })
      setCurriculums(response.contents)
    } catch (error) {
      console.error('Error loading curriculums:', error)
      toast.error('Không thể tải danh sách giáo trình')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = (curriculum: Curriculum): void => {
    const backendUrl = localStorage.getItem('backendUrl') || 'http://localhost:3000'
    const fileUrl = curriculum.fileUrl.startsWith('http')
      ? curriculum.fileUrl
      : `${backendUrl}${curriculum.fileUrl}`

    const link = document.createElement('a')
    link.href = fileUrl
    link.download = curriculum.fileName
    link.click()

    toast.success('Đang tải xuống tài liệu...')
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

  const getFileTypeColor = (mimeType: string) => {
    if (mimeType.includes('pdf')) return 'red'
    if (mimeType.includes('word') || mimeType.includes('document')) return 'blue'
    if (mimeType.includes('text')) return 'green'
    return 'default'
  }

  const getFileTypeDisplay = (mimeType: string): string => {
    if (mimeType.includes('pdf')) return 'PDF'
    if (mimeType.includes('word') || mimeType.includes('document')) return 'DOC'
    if (mimeType.includes('text')) return 'TXT'
    if (mimeType.includes('rtf')) return 'RTF'
    return 'FILE'
  }

  const filteredCurriculums = curriculums.filter(
    (curriculum) =>
      curriculum.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (curriculum.description &&
        curriculum.description.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <Card className="mb-6">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Giáo trình</h1>
            <p className="text-gray-600">Tài liệu học tập và tham khảo</p>
          </div>

          <div className="mb-6">
            <Input
              placeholder="Tìm kiếm giáo trình..."
              prefix={<SearchOutlined />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="large"
              className="max-w-md mx-auto"
            />
          </div>
        </Card>

        {loading ? (
          <div className="text-center py-12">
            <Spin size="large" />
            <div className="mt-4 text-gray-600">Đang tải danh sách giáo trình...</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCurriculums.map((curriculum) => (
              <Card
                key={curriculum.id}
                className="hover:shadow-lg transition-shadow duration-300"
                actions={[
                  <Button
                    type="primary"
                    icon={<DownloadOutlined />}
                    onClick={() => handleDownload(curriculum)}
                    className="w-full"
                  >
                    Tải xuống
                  </Button>
                ]}
              >
                <div className="text-center">
                  <div className="text-4xl mb-3">{getFileIcon(curriculum.mimeType)}</div>
                  <h3 className="text-lg font-semibold mb-2 line-clamp-2">{curriculum.title}</h3>
                  {curriculum.description && (
                    <p className="text-gray-600 text-sm mb-3 line-clamp-3">
                      {curriculum.description}
                    </p>
                  )}
                  <div className="space-y-2">
                    <div className="flex items-center justify-center space-x-2">
                      <FileTextOutlined className="text-gray-400" />
                      <span className="text-sm text-gray-500">{curriculum.fileName}</span>
                    </div>
                    <div className="flex justify-center space-x-2">
                      <Tag color={getFileTypeColor(curriculum.mimeType)}>
                        {getFileTypeDisplay(curriculum.mimeType)}
                      </Tag>
                      <Tag color="blue">{formatFileSize(curriculum.fileSize)}</Tag>
                    </div>
                    <div className="text-xs text-gray-400">
                      {new Date(curriculum.createdAt).toLocaleDateString('vi-VN')}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {!loading && filteredCurriculums.length === 0 && (
          <Card className="text-center py-12">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              {searchTerm ? 'Không tìm thấy giáo trình nào' : 'Chưa có giáo trình nào'}
            </h3>
            <p className="text-gray-500">
              {searchTerm
                ? 'Thử tìm kiếm với từ khóa khác'
                : 'Liên hệ quản trị viên để thêm giáo trình mới'}
            </p>
          </Card>
        )}
      </div>
    </div>
  )
}

export default CurriculumPage
