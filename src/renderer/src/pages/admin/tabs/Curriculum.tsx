import React, { useState, useEffect } from 'react'
import { Table, Button, Modal, Space, Card } from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  DownloadOutlined,
  EyeOutlined,
  FileTextOutlined
} from '@ant-design/icons'
import dictionaryApi, { Curriculum } from '@renderer/apis/dictionary-api'
import { toast } from 'sonner'
import CurriculumUpload from '@renderer/components/CurriculumUpload'
import { resolveAssetUrl } from '@/lib/backend-url'
import { Badge } from '@/components/ui/badge'
import ConfirmDeleteDialog from '@renderer/components/confirm-delete-dialog'
import { EmptyState } from '@/components/states/empty-state'
import DocumentViewerDialog from '@renderer/components/document-viewer-dialog'
import { isPreviewableMimeType } from '@/lib/utils'
import { FolderOpen } from 'lucide-react'

const CurriculumTab: React.FC = () => {
  const [curriculums, setCurriculums] = useState<Curriculum[]>([])
  const [loading, setLoading] = useState(false)
  const [uploadModalVisible, setUploadModalVisible] = useState(false)
  const [editingCurriculum, setEditingCurriculum] = useState<Curriculum | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Curriculum | null>(null)
  const [downloadingId, setDownloadingId] = useState<number | null>(null)
  const [viewingCurriculum, setViewingCurriculum] = useState<Curriculum | null>(null)

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

  const handleUpload = async (data: {
    title: string
    description?: string
    fileName: string
    fileUrl: string
    fileSize: number
    mimeType: string
  }): Promise<void> => {
    try {
      if (editingCurriculum) {
        await dictionaryApi.updateCurriculum(editingCurriculum.id, {
          title: data.title,
          description: data.description
        })
        toast.success('Cập nhật giáo trình thành công')
      } else {
        await dictionaryApi.createCurriculum(data)
        toast.success('Tạo giáo trình thành công')
      }

      setUploadModalVisible(false)
      setEditingCurriculum(null)
      loadCurriculums()
    } catch (error) {
      console.error('Error saving curriculum:', error)
      toast.error(editingCurriculum ? 'Cập nhật giáo trình thất bại' : 'Tạo giáo trình thất bại')
    }
  }

  const handleEdit = (curriculum: Curriculum): void => {
    setEditingCurriculum(curriculum)
    setUploadModalVisible(true)
  }

  const handleDelete = async (id: number): Promise<void> => {
    try {
      await dictionaryApi.deleteCurriculum(id)
      toast.success('Xóa giáo trình thành công')
      loadCurriculums()
    } catch (error) {
      console.error('Error deleting curriculum:', error)
      toast.error('Xóa giáo trình thất bại')
    } finally {
      setDeleteTarget(null)
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

  const columns = [
    {
      title: 'Tiêu đề',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: Curriculum) => (
        <div className="flex items-center space-x-2">
          <span className="text-lg">{getFileIcon(record.mimeType)}</span>
          <div>
            <div className="font-medium">{text}</div>
            {record.description && (
              <div className="text-sm text-gray-500">{record.description}</div>
            )}
          </div>
        </div>
      )
    },
    {
      title: 'Tên file',
      dataIndex: 'fileName',
      key: 'fileName',
      render: (text: string) => (
        <div className="flex items-center space-x-2">
          <FileTextOutlined />
          <span className="text-sm">{text}</span>
        </div>
      )
    },
    {
      title: 'Kích thước',
      dataIndex: 'fileSize',
      key: 'fileSize',
      render: (size: number) => <Badge variant="secondary">{formatFileSize(size)}</Badge>
    },
    {
      title: 'Loại file',
      dataIndex: 'mimeType',
      key: 'mimeType',
      render: (mimeType: string) => <Badge variant="outline">{getFileTypeDisplay(mimeType)}</Badge>
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString('vi-VN')
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_, record: Curriculum) => (
        <Space>
          {isPreviewableMimeType(record.mimeType) && (
            <Button
              type="link"
              icon={<EyeOutlined />}
              onClick={() => setViewingCurriculum(record)}
              size="small"
            >
              Xem
            </Button>
          )}
          <Button
            type="link"
            icon={<DownloadOutlined />}
            loading={downloadingId === record.id}
            onClick={() => handleDownload(record)}
            size="small"
          >
            Tải xuống
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            size="small"
          >
            Sửa
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            size="small"
            onClick={() => setDeleteTarget(record)}
          >
            Xóa
          </Button>
        </Space>
      )
    }
  ]

  return (
    <div>
      <h1 className="mb-4 text-h1 text-neutral-900">Quản lý Giáo trình</h1>
      <Card>
        <div className="flex justify-end items-center mb-4">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingCurriculum(null)
              setUploadModalVisible(true)
            }}
          >
            Thêm Giáo trình
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={curriculums}
          rowKey="id"
          loading={loading}
          locale={{
            emptyText: <EmptyState icon={FolderOpen} message="Chưa có giáo trình nào" />
          }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} giáo trình`
          }}
        />
      </Card>

      <Modal
        title={editingCurriculum ? 'Chỉnh sửa Giáo trình' : 'Thêm Giáo trình mới'}
        open={uploadModalVisible}
        onCancel={() => {
          setUploadModalVisible(false)
          setEditingCurriculum(null)
        }}
        footer={null}
        width={600}
      >
        <CurriculumUpload
          onUpload={handleUpload}
          onCancel={() => {
            setUploadModalVisible(false)
            setEditingCurriculum(null)
          }}
        />
      </Modal>
      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        itemName={deleteTarget?.title ?? ''}
        onConfirm={() => deleteTarget && handleDelete(deleteTarget.id)}
      />
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

export default CurriculumTab
