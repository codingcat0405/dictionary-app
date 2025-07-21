import dictionaryApi, { Exercise } from '@renderer/apis/dictionary-api'
import CreateExerciceModal from '@renderer/components/CreateExerciceModal'
import ViewExerciseModal from '@renderer/components/ViewExerciseModal'
import ExerciseSubmissionsModal from '@renderer/components/ExerciseSubmissionsModal'
import { useQuery } from '@tanstack/react-query'
import { Button, Space, Table } from 'antd'
import moment from 'moment'
import React from 'react'
import { toast } from 'react-hot-toast'
import { CiEdit } from 'react-icons/ci'
import { IoEyeOutline } from 'react-icons/io5'
import { MdDeleteOutline } from 'react-icons/md'
import { BiUserCheck } from 'react-icons/bi'

const Execices: React.FC = () => {
  const [isCreatingExercice, setIsCreatingExercice] = React.useState(false)
  const [exercisesParams, setExercisesParams] = React.useState({ page: 0, limit: 10 })
  const [viewingExercise, setViewingExercise] = React.useState<Exercise | null>(null)
  const [isViewingExercise, setIsViewingExercise] = React.useState(false)
  const [editingExercise, setEditingExercise] = React.useState<Exercise | null>(null)
  const [selectedExerciseForSubmissions, setSelectedExerciseForSubmissions] =
    React.useState<Exercise | null>(null)
  const [isViewingSubmissions, setIsViewingSubmissions] = React.useState(false)

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
          <Button
            type="text"
            icon={<CiEdit />}
            size="large"
            onClick={() => {
              setEditingExercise(record.apiData)
              setIsCreatingExercice(true)
            }}
          />
          <Button
            danger
            type="text"
            icon={<MdDeleteOutline />}
            size="large"
            onClick={() => handleDeleteExercise(record.key)}
          />
          <Button
            type="text"
            icon={<IoEyeOutline />}
            size="large"
            onClick={() => {
              setViewingExercise(record.apiData)
              setIsViewingExercise(true)
            }}
          />
          <Button
            type="text"
            icon={<BiUserCheck />}
            size="large"
            onClick={() => {
              setSelectedExerciseForSubmissions(record.apiData)
              setIsViewingSubmissions(true)
            }}
            title="Xem kết quả học viên"
          />
        </Space>
      )
    }
  ]
  return (
    <div className="p-4">
      <Table
        title={() => (
          <div className="flex justify-between">
            <h4 className="text-lg font-bold">Bài tập thực hành</h4>
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
    </div>
  )
}
export default Execices
