import React, { useState, useEffect } from 'react'
import { Input } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import dictionaryApi, { Curriculum } from '@renderer/apis/dictionary-api'
import { toast } from 'sonner'
import { resolveAssetUrl } from '@/lib/backend-url'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { EmptyState } from '@/components/states/empty-state'
import { ErrorState, type ErrorStateVariant } from '@/components/states/error-state'
import { GridSkeleton } from '@/components/states/loading-skeleton'
import { classifyError } from '@/components/states/classify-error'
import DocumentViewerDialog from '@renderer/components/document-viewer-dialog'
import { isPreviewableMimeType } from '@/lib/utils'
import { Download, Eye, FileText, FolderOpen } from 'lucide-react'

const CurriculumPage: React.FC = () => {
  const [curriculums, setCurriculums] = useState<Curriculum[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [errorVariant, setErrorVariant] = useState<ErrorStateVariant | null>(null)
  const [downloadingId, setDownloadingId] = useState<number | null>(null)
  const [viewingCurriculum, setViewingCurriculum] = useState<Curriculum | null>(null)

  useEffect(() => {
    loadCurriculums()
  }, [])

  const loadCurriculums = async (): Promise<void> => {
    try {
      setLoading(true)
      setErrorVariant(null)
      const response = await dictionaryApi.getAllCurriculums({ page: 0, limit: 100 })
      setCurriculums(response.contents)
    } catch (error) {
      console.error('Error loading curriculums:', error)
      toast.error('Không thể tải danh sách giáo trình')
      setErrorVariant(classifyError(error))
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async (curriculum: Curriculum): Promise<void> => {
    const fileUrl = resolveAssetUrl(curriculum.fileUrl)
    setDownloadingId(curriculum.id)
    try {
      const result = await window.api.saveFileToDisk(fileUrl, curriculum.fileName)
      if (result.success) {
        toast.success('Đã tải xuống tài liệu')
      } else if (!result.canceled) {
        toast.error(result.error || 'Tải xuống thất bại')
      }
    } catch (error) {
      console.error('Error downloading curriculum file:', error)
      toast.error('Tải xuống thất bại')
    } finally {
      setDownloadingId(null)
    }
  }

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

  const filteredCurriculums = curriculums.filter(
    (curriculum) =>
      curriculum.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (curriculum.description &&
        curriculum.description.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className="min-h-screen bg-neutral-50 p-6">
      <div className="mx-auto max-w-6xl">
        <Card className="mb-6 p-6">
          <div className="mb-6 text-center">
            <h1 className="text-h1 mb-2 text-neutral-900">Giáo trình</h1>
            <p className="text-body text-muted-foreground">Tài liệu học tập và tham khảo</p>
          </div>

          <div className="mb-2">
            <Input
              placeholder="Tìm kiếm giáo trình..."
              prefix={<SearchOutlined />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="large"
              className="mx-auto max-w-md"
            />
          </div>
        </Card>

        {loading ? (
          <GridSkeleton items={6} />
        ) : errorVariant ? (
          <Card className="py-12">
            <ErrorState variant={errorVariant} onRetry={loadCurriculums} />
          </Card>
        ) : filteredCurriculums.length === 0 ? (
          <Card className="py-12">
            <EmptyState
              icon={searchTerm ? FolderOpen : FileText}
              message={searchTerm ? 'Không tìm thấy giáo trình nào' : 'Chưa có giáo trình nào'}
              description={
                searchTerm
                  ? 'Thử tìm kiếm với từ khóa khác'
                  : 'Liên hệ quản trị viên để thêm giáo trình mới'
              }
            />
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredCurriculums.map((curriculum) => (
              <Card
                key={curriculum.id}
                className="gap-3 p-4 transition-shadow duration-300 hover:shadow-md"
              >
                <div className="text-center">
                  <div className="mb-3 text-4xl">{getFileIcon(curriculum.mimeType)}</div>
                  <h3 className="text-h3 mb-2 line-clamp-2 text-neutral-900">{curriculum.title}</h3>
                  {curriculum.description && (
                    <p className="mb-3 line-clamp-3 text-small text-muted-foreground">
                      {curriculum.description}
                    </p>
                  )}
                  <div className="space-y-2">
                    <div className="flex items-center justify-center gap-2">
                      <FileText className="size-4 text-neutral-400" />
                      <span className="text-small text-muted-foreground">
                        {curriculum.fileName}
                      </span>
                    </div>
                    <div className="flex justify-center gap-2">
                      <Badge variant="outline">{getFileTypeDisplay(curriculum.mimeType)}</Badge>
                      <Badge variant="secondary">{formatFileSize(curriculum.fileSize)}</Badge>
                    </div>
                    <div className="text-tiny text-neutral-400">
                      {new Date(curriculum.createdAt).toLocaleDateString('vi-VN')}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  {isPreviewableMimeType(curriculum.mimeType) && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => setViewingCurriculum(curriculum)}
                        >
                          <Eye />
                          Xem
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Xem {curriculum.fileName} trong ứng dụng</TooltipContent>
                    </Tooltip>
                  )}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        className="flex-1"
                        disabled={downloadingId === curriculum.id}
                        onClick={() => handleDownload(curriculum)}
                      >
                        <Download />
                        Tải xuống
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Tải xuống {curriculum.fileName}</TooltipContent>
                  </Tooltip>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {viewingCurriculum && (
        <DocumentViewerDialog
          open={!!viewingCurriculum}
          onOpenChange={(open) => !open && setViewingCurriculum(null)}
          fileUrl={resolveAssetUrl(viewingCurriculum.fileUrl)}
          fileName={viewingCurriculum.fileName}
        />
      )}
    </div>
  )
}

export default CurriculumPage
