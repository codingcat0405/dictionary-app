import dictionaryApi from '@renderer/apis/dictionary-api'
import { Col, Table } from 'antd'
import { Row } from 'antd'
import { Card } from 'antd'
import React, { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import moment from 'moment'

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
    <div className="p-4">
      <Row gutter={16}>
        <Col span={12} className="mb-4">
          <Card>
            <Card.Meta title="Từ điển anh - việt" description="387,517 từ" />
          </Card>
        </Col>
        <Col span={12}>
          <Card>
            <Card.Meta title="Từ điển việt - anh" description="42,252 từ" />
          </Card>
        </Col>

        <Col span={12}>
          <Card>
            <Card.Meta title="Bài tập đã tạo" description={exercisesData.total} />
          </Card>
        </Col>

        <Col span={12}>
          <Card>
            <Card.Meta title="Từ chuyên ngành" description={dictionaryList.total} />
          </Card>
        </Col>
      </Row>
      <Row gutter={16} className="my-4">
        <Col span={12}>
          <h4 className="text-lg font-bold">Bài tập đã tạo</h4>
          <Table columns={exerciseColumns} dataSource={tableData} pagination={false} />
        </Col>
        <Col span={12}>
          <h4 className="text-lg font-bold">Từ đã tạo</h4>
          <Table columns={wordsColumns} dataSource={dictionaryTableData} pagination={false} />
        </Col>
      </Row>
    </div>
  )
}
export default DashBoard
