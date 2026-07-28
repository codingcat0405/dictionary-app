import dictionaryApi from '@renderer/apis/dictionary-api'
import { Table } from 'antd'
import React, { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import moment from 'moment'
import { BookOpenText, ClipboardList, Languages, Library } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/states/empty-state'

interface DictionaryStatusResult {
  ev: { path: string; initialized: boolean; wordCount: number }
  ve: { path: string; initialized: boolean; wordCount: number }
}

/** Renders a live word count, or `—` while the index hasn't loaded — never a fake `0`. */
const WordCountValue: React.FC<{ initialized?: boolean; wordCount?: number }> = ({
  initialized,
  wordCount
}) => {
  if (initialized === undefined) {
    return <Skeleton className="h-8 w-24" />
  }
  if (!initialized) {
    return <span className="text-h1 text-neutral-400">—</span>
  }
  return (
    <span className="text-h1 text-neutral-900">{(wordCount ?? 0).toLocaleString('vi-VN')} từ</span>
  )
}

const StatCard: React.FC<{
  icon: React.ElementType
  label: string
  children: React.ReactNode
}> = ({ icon: Icon, label, children }) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2 text-body-md text-neutral-600">
        <Icon size={18} className="text-primary-500" />
        {label}
      </CardTitle>
    </CardHeader>
    <CardContent>{children}</CardContent>
  </Card>
)

const DashBoard: React.FC = () => {
  const { data: exercisesData = { contents: [], total: 0, page: 0, limit: 0 } } = useQuery({
    queryKey: ['exercises'],
    queryFn: () =>
      dictionaryApi.getAllExercises({
        page: 0,
        limit: 5
      })
  })

  const { data: exerciseStats = { totalExercises: 0, totalSubmissions: 0, exerciseStats: [] } } =
    useQuery({
      queryKey: ['exerciseStats'],
      queryFn: () => dictionaryApi.getExerciseStats()
    })

  const { data: dictionaryStatus } = useQuery<DictionaryStatusResult | undefined>({
    queryKey: ['dictionary-status'],
    queryFn: () => window.api?.getDictionaryStatus?.()
  })

  const tableData = exercisesData.contents.map((exercise) => {
    const stats = exerciseStats.exerciseStats.find((stat) => stat.exerciseId === exercise.id)
    return {
      key: exercise.id,
      name: exercise.name,
      question: exercise.questions.length,
      student: stats?.submissionCount || 0,
      date: moment(exercise.createdAt).format('DD/MM/YYYY'),
      apiData: exercise
    }
  })

  const { data: dictionaryList = { contents: [], total: 0, page: 0, limit: 0 } } = useQuery({
    queryKey: ['dictionary'],
    queryFn: () =>
      dictionaryApi.getDictionary({
        page: 0,
        limit: 5
      })
  })
  const dictionaryTableData = useMemo(() => {
    return dictionaryList.contents.map((item) => ({
      key: item.id,
      word: item.word,
      date: moment(item.createdAt).format('DD/MM/YYYY')
    }))
  }, [dictionaryList])
  const exerciseColumns = [
    {
      title: 'Tên',
      dataIndex: 'name',
      key: 'name'
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
    }
  ]
  const wordsColumns = [
    {
      title: 'Từ',
      dataIndex: 'word',
      key: 'word'
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'date',
      key: 'date'
    }
  ]
  return (
    <div>
      <h1 className="mb-4 text-h1 text-neutral-900">Tổng quan</h1>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Languages} label="Từ điển anh - việt">
          <WordCountValue
            initialized={dictionaryStatus?.ev.initialized}
            wordCount={dictionaryStatus?.ev.wordCount}
          />
        </StatCard>
        <StatCard icon={BookOpenText} label="Từ điển việt - anh">
          <WordCountValue
            initialized={dictionaryStatus?.ve.initialized}
            wordCount={dictionaryStatus?.ve.wordCount}
          />
        </StatCard>
        <StatCard icon={ClipboardList} label="Bài tập đã tạo">
          <span className="text-h1 text-neutral-900">{exercisesData.total}</span>
        </StatCard>
        <StatCard icon={Library} label="Từ chuyên ngành">
          <span className="text-h1 text-neutral-900">{dictionaryList.total}</span>
        </StatCard>
      </div>
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div>
          <h2 className="mb-2 text-h3 text-neutral-900">Bài tập đã tạo</h2>
          <Table
            columns={exerciseColumns}
            dataSource={tableData}
            pagination={false}
            locale={{
              emptyText: <EmptyState icon={ClipboardList} message="Chưa có bài tập nào" />
            }}
          />
        </div>
        <div>
          <h2 className="mb-2 text-h3 text-neutral-900">Từ đã tạo</h2>
          <Table
            columns={wordsColumns}
            dataSource={dictionaryTableData}
            pagination={false}
            locale={{
              emptyText: <EmptyState icon={Library} message="Chưa có từ nào" />
            }}
          />
        </div>
      </div>
    </div>
  )
}
export default DashBoard
