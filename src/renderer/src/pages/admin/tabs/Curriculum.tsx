import React, { useState, useEffect } from 'react'
import { Table, Button, Modal, Space, Popconfirm, Card, Tag } from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  DownloadOutlined,
  FileTextOutlined
} from '@ant-design/icons'
import dictionaryApi, { Curriculum } from '@renderer/apis/dictionary-api'
import { toast } from 'react-hot-toast'
import CurriculumUpload from '@renderer/components/CurriculumUpload'

const CurriculumTab: React.FC = () => {
  const [curriculums, setCurriculums] = useState<Curriculum[]>([])
  const [loading, setLoading] = useState(false)
  const [uploadModalVisible, setUploadModalVisible] = useState(false)
  const [editingCurriculum, setEditingCurriculum] = useState<Curriculum | null>(null)

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
      render: (size: number) => <Tag color="blue">{formatFileSize(size)}</Tag>
    },
    {
      title: 'Loại file',
      dataIndex: 'mimeType',
      key: 'mimeType',
      render: (mimeType: string) => {
        const type = getFileTypeDisplay(mimeType)
        return <Tag color="green">{type}</Tag>
      }
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
          <Button
            type="link"
            icon={<DownloadOutlined />}
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
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa giáo trình này?"
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button type="link" danger icon={<DeleteOutlined />} size="small">
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <div className="p-4">
      <Card>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Quản lý Giáo trình</h2>
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
    </div>
  )
}

export default CurriculumTab
