'use client'

import { useState, useEffect } from 'react'
import {
  Col,
  Row,
  List,
  Badge,
  Radio,
  Button,
  Space,
  Divider,
  message,
  Card,
  Progress,
  Typography,
  Spin
} from 'antd'
import { CheckCircleFilled, ClockCircleFilled } from '@ant-design/icons'
import dictionaryApi, { Exercise } from '@renderer/apis/dictionary-api'
import toast from 'react-hot-toast'

const { Title, Text } = Typography

interface ExerciseStatus {
  exerciseId: number
  completed: boolean
  score?: number
}

const ExercisePage: React.FC = () => {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [currentExercise, setCurrentExercise] = useState<Exercise | null>(null)
  const [exerciseStatuses, setExerciseStatuses] = useState<ExerciseStatus[]>([])
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingExercises, setLoadingExercises] = useState(true)

  // Load exercises from API
  useEffect(() => {
    loadExercises()
  }, [])

  const loadExercises = async (): Promise<void> => {
    try {
      setLoadingExercises(true)
      const response = await dictionaryApi.getAllExercises({ page: 0, limit: 100 })
      setExercises(response.contents)

      // Initialize exercise statuses
      const initialStatuses = response.contents.map((ex) => ({
        exerciseId: ex.id,
        completed: false
      }))
      setExerciseStatuses(initialStatuses)

      // Load user's completed exercises
      await loadUserExerciseResults()
    } catch (error) {
      console.error('Error loading exercises:', error)
      toast.error('Không thể tải danh sách bài tập')
    } finally {
      setLoadingExercises(false)
    }
  }

  const loadUserExerciseResults = async (): Promise<void> => {
    try {
      const response = await dictionaryApi.getUserExercises({ page: 0, limit: 100 })
      const completedExercises = response.content.map((result) => ({
        exerciseId: result.exerciseId,
        completed: true,
        score: result.score
      }))

      setExerciseStatuses((prev) =>
        prev.map((status) => {
          const completed = completedExercises.find((c) => c.exerciseId === status.exerciseId)
          return completed ? { ...status, completed: true, score: completed.score } : status
        })
      )
    } catch (error) {
      console.error('Error loading user exercise results:', error)
    }
  }

  const handleExerciseSelect = async (exercise: Exercise): Promise<void> => {
    try {
      setLoading(true)

      // Check if user has already completed this exercise
      const status = getExerciseStatus(exercise.id)

      if (status?.completed) {
        // Load previous submission results
        const userResult = await dictionaryApi.getUserExerciseResult(exercise.id)
        const fullExercise = await dictionaryApi.getExercise(exercise.id)

        setCurrentExercise(fullExercise)
        setSubmitted(true)
        setScore(Math.round((userResult.score / fullExercise.questions.length) * 100))

        // Parse previous answers from result string
        const previousAnswers: Record<number, string> = {}
        try {
          const resultData = JSON.parse(userResult.result)
          resultData.forEach((item: { questionId: number; answer: number }) => {
            previousAnswers[item.questionId] = String.fromCharCode(65 + item.answer) // Convert 0->A, 1->B, etc.
          })
        } catch (error) {
          console.error('Error parsing previous answers:', error)
        }

        setUserAnswers(previousAnswers)
      } else {
        // Load fresh exercise for new attempt
        const fullExercise = await dictionaryApi.getExercise(exercise.id)
        setCurrentExercise(fullExercise)
        setSubmitted(false)
        setScore(null)
        setUserAnswers({})
      }
    } catch (error) {
      console.error('Error loading exercise:', error)
      toast.error('Không thể tải bài tập')
    } finally {
      setLoading(false)
    }
  }

  const handleAnswerChange = (questionId: number, answer: string): void => {
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: answer
    }))
  }

  const handleSubmit = async (): Promise<void> => {
    if (!currentExercise) return

    // Check if all questions are answered
    const answeredCount = Object.keys(userAnswers).length
    if (answeredCount < currentExercise.questions.length) {
      message.warning(
        `Vui lòng trả lời tất cả ${currentExercise.questions.length} câu hỏi trước khi nộp bài`
      )
      return
    }

    try {
      setLoading(true)

      // Prepare result data
      const resultData = currentExercise.questions.map((question) => ({
        questionId: question.id,
        answer: userAnswers[question.id]?.charCodeAt(0) - 65 || 0 // Convert A->0, B->1, etc.
      }))

      // Submit to API
      const submission = await dictionaryApi.submitExerciseResult({
        exerciseId: currentExercise.id,
        result: JSON.stringify(resultData)
      })

      // Calculate score for display
      const correctCount = submission.score
      const newScore = Math.round((correctCount / currentExercise.questions.length) * 100)
      setScore(newScore)
      setSubmitted(true)

      // Update exercise status
      setExerciseStatuses((prev) =>
        prev.map((status) =>
          status.exerciseId === currentExercise.id
            ? { ...status, completed: true, score: correctCount }
            : status
        )
      )

      toast.success(
        `Đã nộp bài thành công! Điểm số: ${correctCount}/${currentExercise.questions.length}`
      )
    } catch (error) {
      console.error('Error submitting exercise:', error)
      toast.error('Không thể nộp bài. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  const getExerciseStatus = (exerciseId: number): ExerciseStatus | undefined => {
    return exerciseStatuses.find((status) => status.exerciseId === exerciseId)
  }

  const resetExercise = (): void => {
    if (!currentExercise) return

    setUserAnswers({})
    setSubmitted(false)
    setScore(null)

    // Update status to not completed
    setExerciseStatuses((prev) =>
      prev.map((status) =>
        status.exerciseId === currentExercise.id
          ? { ...status, completed: false, score: undefined }
          : status
      )
    )

    message.info('Đã làm mới bài tập')
  }

  const getAnswerLabel = (index: number): string => {
    return ['A', 'B', 'C', 'D'][index]
  }

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <Title level={2} className="text-center mb-6">
        Bài tập
      </Title>
      <Row gutter={16}>
        <Col xs={24} md={8}>
          <Card className="shadow-md mb-4">
            <Title level={4} className="text-center mb-4">
              Danh sách bài tập
            </Title>
            {loadingExercises ? (
              <div className="text-center py-8">
                <Spin size="large" />
                <div className="mt-4">Đang tải bài tập...</div>
              </div>
            ) : (
              <List
                itemLayout="horizontal"
                dataSource={exercises}
                renderItem={(exercise) => {
                  const status = getExerciseStatus(exercise.id)
                  return (
                    <List.Item
                      className={`cursor-pointer hover:bg-gray-50 rounded p-2 transition ${currentExercise?.id === exercise.id ? 'bg-blue-50' : ''}`}
                      onClick={() => handleExerciseSelect(exercise)}
                    >
                      <List.Item.Meta
                        title={
                          <div className="flex items-center">
                            <span>{exercise.name}</span>
                            {status?.completed && (
                              <Badge
                                count={<CheckCircleFilled style={{ color: '#52c41a' }} />}
                                className="ml-2"
                              />
                            )}
                          </div>
                        }
                        description={
                          <div>
                            <div>Số câu hỏi: {exercise.questions.length}</div>
                            <div className="flex items-center mt-1">
                              <span className="mr-2">Trạng thái:</span>
                              {status?.completed ? (
                                <span className="text-green-600 flex items-center">
                                  <CheckCircleFilled className="mr-1" />
                                  Đã làm: {status.score}/{exercise.questions.length}
                                </span>
                              ) : (
                                <span className="text-orange-500 flex items-center">
                                  <ClockCircleFilled className="mr-1" />
                                  Chưa làm
                                </span>
                              )}
                            </div>
                          </div>
                        }
                      />
                    </List.Item>
                  )
                }}
              />
            )}
          </Card>
        </Col>

        <Col xs={24} md={16}>
          <Card className="shadow-md">
            {loading ? (
              <div className="text-center py-12">
                <Spin size="large" />
                <div className="mt-4">Đang tải bài tập...</div>
              </div>
            ) : currentExercise ? (
              <>
                <div className="flex justify-between items-center mb-4">
                  <Title level={4}>{currentExercise.name}</Title>
                  {submitted && score !== null && (
                    <div className="text-right">
                      <Progress
                        type="circle"
                        percent={score}
                        width={60}
                        status={score >= 60 ? 'success' : 'exception'}
                      />
                    </div>
                  )}
                </div>

                <Divider />

                {currentExercise.questions.map((question, index) => (
                  <div key={question.id} className="mb-6">
                    <div className="flex items-start mb-2">
                      <Text strong className="mr-2">
                        Câu {index + 1}:
                      </Text>
                      <Text>{question.question}</Text>
                    </div>

                    <Radio.Group
                      className="ml-6"
                      onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                      value={userAnswers[question.id]}
                      disabled={submitted}
                    >
                      <Space direction="vertical">
                        {Object.entries({
                          A: question.answerA,
                          B: question.answerB,
                          C: question.answerC,
                          D: question.answerD
                        }).map(([key, value]) => (
                          <Radio
                            key={key}
                            value={key}
                            className={
                              submitted
                                ? key === getAnswerLabel(question.rightAnswer)
                                  ? 'text-green-600 font-medium'
                                  : userAnswers[question.id] === key
                                    ? 'text-red-500'
                                    : ''
                                : ''
                            }
                          >
                            {key}. {value}
                            {submitted && key === getAnswerLabel(question.rightAnswer) && (
                              <CheckCircleFilled className="ml-2 text-green-600" />
                            )}
                          </Radio>
                        ))}
                      </Space>
                    </Radio.Group>
                  </div>
                ))}

                <Divider />

                <div className="flex justify-end">
                  {submitted ? (
                    <Button type="primary" onClick={resetExercise}>
                      Làm lại
                    </Button>
                  ) : (
                    <Button
                      type="primary"
                      onClick={handleSubmit}
                      loading={loading}
                      disabled={Object.keys(userAnswers).length < currentExercise.questions.length}
                    >
                      Nộp bài
                    </Button>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <Title level={4} className="text-gray-500">
                  Vui lòng chọn một bài tập từ danh sách
                </Title>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default ExercisePage
