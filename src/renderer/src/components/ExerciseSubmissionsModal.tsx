import React from 'react'
import { Modal, Table, Progress } from 'antd'
import { useQuery } from '@tanstack/react-query'
import dictionaryApi from '@renderer/apis/dictionary-api'
import moment from 'moment'
import { UserOutlined, TrophyOutlined, ClockCircleOutlined } from '@ant-design/icons'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/states/empty-state'
import { Users } from 'lucide-react'

interface ExerciseSubmissionsModalProps {
  exerciseId: number | null
  exerciseName: string
  open: boolean
  setOpen: (open: boolean) => void
}

const ExerciseSubmissionsModal: React.FC<ExerciseSubmissionsModalProps> = ({
  exerciseId,
  exerciseName,
  open,
  setOpen
}) => {
  const { data: submissionsData, isLoading } = useQuery({
    queryKey: ['exerciseSubmissions', exerciseId],
    queryFn: () => dictionaryApi.getExerciseSubmissions(exerciseId!),
    enabled: !!exerciseId && open
  })

  const columns = [
    {
      title: 'Học viên',
      dataIndex: 'user',
      key: 'user',
      render: (user: any) => (
        <div className="flex items-center text-body">
          <UserOutlined className="mr-2 text-neutral-500" />
          <span>{user?.fullName || user?.username || 'Unknown'}</span>
        </div>
      )
    },
    {
      title: 'Điểm số',
      dataIndex: 'score',
      key: 'score',
      render: (score: number, record: any) => {
        const totalQuestions = record.totalQuestions || 1
        const percentage = Math.round((score / totalQuestions) * 100)
        return (
          <div className="flex items-center">
            <TrophyOutlined className="mr-2 text-warning" />
            <span className="text-body-md">
              {score}/{totalQuestions}
            </span>
            <Progress
              percent={percentage}
              size="small"
              className="ml-2 w-16"
              status={percentage >= 60 ? 'success' : 'exception'}
            />
          </div>
        )
      }
    },
    {
      title: 'Thời gian nộp',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => (
        <div className="flex items-center text-body">
          <ClockCircleOutlined className="mr-2 text-neutral-500" />
          <span>{moment(date).format('DD/MM/YYYY HH:mm')}</span>
        </div>
      )
    },
    {
      title: 'Trạng thái',
      key: 'status',
      render: (_, record: any) => {
        const totalQuestions = record.totalQuestions || 1
        const percentage = Math.round((record.score / totalQuestions) * 100)

        if (percentage >= 80) {
          return <Badge className="bg-success">Xuất sắc</Badge>
        } else if (percentage >= 60) {
          return <Badge variant="default">Đạt</Badge>
        } else {
          return <Badge variant="destructive">Chưa đạt</Badge>
        }
      }
    }
  ]

  const tableData =
    submissionsData?.submissions?.map((submission: any) => ({
      key: submission.id,
      ...submission,
      totalQuestions: 10 // You might want to get this from the exercise data
    })) || []

  return (
    <Modal
      title={`Kết quả bài tập: ${exerciseName}`}
      open={open}
      onCancel={() => setOpen(false)}
      width={800}
      footer={null}
    >
      <div className="mb-4">
        <div className="mb-2 flex items-center justify-between text-body">
          <span className="text-muted-foreground">
            Tổng số học viên đã làm: {submissionsData?.total || 0}
          </span>
          {submissionsData?.submissions && submissionsData.submissions.length > 0 && (
            <div className="text-right">
              <span className="text-muted-foreground">Điểm trung bình: </span>
              <span className="text-body-md">
                {Math.round(
                  submissionsData.submissions.reduce(
                    (sum: number, sub: any) => sum + sub.score,
                    0
                  ) / submissionsData.submissions.length
                )}
                /{10}
              </span>
            </div>
          )}
        </div>
      </div>

      <Table
        columns={columns}
        dataSource={tableData}
        loading={isLoading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} kết quả`
        }}
        locale={{
          emptyText: <EmptyState icon={Users} message="Chưa có học viên nào làm bài tập này" />
        }}
      />
    </Modal>
  )
}

export default ExerciseSubmissionsModal
