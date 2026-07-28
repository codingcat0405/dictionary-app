import dictionaryApi, { Exercise } from '@renderer/apis/dictionary-api'
import CreateExerciceModal from '@renderer/components/CreateExerciceModal'
import ViewExerciseModal from '@renderer/components/ViewExerciseModal'
import ExerciseSubmissionsModal from '@renderer/components/ExerciseSubmissionsModal'
import ConfirmDeleteDialog from '@renderer/components/confirm-delete-dialog'
import { useQuery } from '@tanstack/react-query'
import { Button, Space, Table } from 'antd'
import moment from 'moment'
import React from 'react'
import { toast } from 'sonner'
import { CiEdit } from 'react-icons/ci'
import { IoEyeOutline } from 'react-icons/io5'
import { MdDeleteOutline } from 'react-icons/md'
import { BiUserCheck } from 'react-icons/bi'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { EmptyState } from '@/components/states/empty-state'
import { ClipboardList } from 'lucide-react'

const Execices: React.FC = () => {
  const [isCreatingExercice, setIsCreatingExercice] = React.useState(false)
  const [exercisesParams, setExercisesParams] = React.useState({ page: 0, limit: 10 })
  const [viewingExercise, setViewingExercise] = React.useState<Exercise | null>(null)
  const [isViewingExercise, setIsViewingExercise] = React.useState(false)
  const [editingExercise, setEditingExercise] = React.useState<Exercise | null>(null)
  const [selectedExerciseForSubmissions, setSelectedExerciseForSubmissions] =
    React.useState<Exercise | null>(null)
  const [isViewingSubmissions, setIsViewingSubmissions] = React.useState(false)
  const [deleteTarget, setDeleteTarget] = React.useState<{ id: number; name: string } | null>(null)

  const {
    data: exercisesData = { contents: [], total: 0, page: 0, limit: 0 },
    refetch: refetchExercises
  } = useQuery({
    queryKey: ['exercises', exercisesParams],
    queryFn: ({ queryKey }) =>
      dictionaryApi.getAllExercises(queryKey[1] as { page: number; limit: number })
  })
  const tableData = exercisesData.contents.map((exercise) => ({
    key: exercise.id,
    name: exercise.name,
    question: exercise.questions.length,
    student: 0,
    date: moment(exercise.createdAt).format('DD/MM/YYYY'),
    apiData: exercise
  }))
  const handleDeleteExercise = async (id: number): Promise<void> => {
    try {
      await dictionaryApi.deleteExercise(id)
      toast.success('Xóa bài tập thành công')
      await refetchExercises()
    } catch (error) {
      console.log(error)
      toast.error('Xóa bài tập thất bại')
    } finally {
      setDeleteTarget(null)
    }
  }
  const columns = [
    {
      title: 'Tên bài tập',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: 'Số câu hỏi',
      dataIndex: 'question',
      key: 'question'
    },
    {
      title: 'Học viên đã làm',
      dataIndex: 'student',
      key: 'student'
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'date',
      key: 'date'
    },
    {
      title: 'Thao tác',
      dataIndex: 'action',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="text"
                icon={<CiEdit />}
                size="large"
                onClick={() => {
                  setEditingExercise(record.apiData)
                  setIsCreatingExercice(true)
                }}
              />
            </TooltipTrigger>
            <TooltipContent>Sửa bài tập</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                danger
                type="text"
                icon={<MdDeleteOutline />}
                size="large"
                onClick={() => setDeleteTarget({ id: record.key, name: record.name })}
              />
            </TooltipTrigger>
            <TooltipContent>Xóa bài tập</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="text"
                icon={<IoEyeOutline />}
                size="large"
                onClick={() => {
                  setViewingExercise(record.apiData)
                  setIsViewingExercise(true)
                }}
              />
            </TooltipTrigger>
            <TooltipContent>Xem bài tập</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="text"
                icon={<BiUserCheck />}
                size="large"
                onClick={() => {
                  setSelectedExerciseForSubmissions(record.apiData)
                  setIsViewingSubmissions(true)
                }}
              />
            </TooltipTrigger>
            <TooltipContent>Xem kết quả học viên</TooltipContent>
          </Tooltip>
        </Space>
      )
    }
  ]
  return (
    <div>
      <h1 className="mb-4 text-h1 text-neutral-900">Bài tập thực hành</h1>
      <Table
        title={() => (
          <div className="flex justify-end">
            <Button
              type="primary"
              onClick={() => {
                setEditingExercise(null)
                setIsCreatingExercice(true)
              }}
            >
              Tạo bài tập
            </Button>
          </div>
        )}
        columns={columns}
        dataSource={tableData}
        locale={{
          emptyText: <EmptyState icon={ClipboardList} message="Chưa có bài tập nào" />
        }}
        pagination={{
          current: exercisesData.page + 1,
          pageSize: exercisesData.limit,
          total: exercisesData.total,
          onChange: (page, pageSize) => setExercisesParams({ page, limit: pageSize })
        }}
      />
      <CreateExerciceModal
        open={isCreatingExercice}
        setOpen={setIsCreatingExercice}
        editingExercise={editingExercise}
        onFinish={() => {
          setEditingExercise(null)
          setViewingExercise(null)
          refetchExercises()
        }}
      />
      <ViewExerciseModal
        exercise={viewingExercise}
        open={isViewingExercise}
        setOpen={setIsViewingExercise}
      />
      <ExerciseSubmissionsModal
        exerciseId={selectedExerciseForSubmissions?.id || null}
        exerciseName={selectedExerciseForSubmissions?.name || ''}
        open={isViewingSubmissions}
        setOpen={setIsViewingSubmissions}
      />
      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        itemName={deleteTarget?.name ?? ''}
        onConfirm={() => deleteTarget && handleDeleteExercise(deleteTarget.id)}
      />
    </div>
  )
}
export default Execices
