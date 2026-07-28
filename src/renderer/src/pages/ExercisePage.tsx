import { useState, useEffect } from 'react'
import { Progress } from 'antd'
import { CheckCircleFilled, ClockCircleFilled } from '@ant-design/icons'
import dictionaryApi, { Exercise } from '@renderer/apis/dictionary-api'
import { toast } from 'sonner'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { EmptyState } from '@/components/states/empty-state'
import { ErrorState, type ErrorStateVariant } from '@/components/states/error-state'
import { ListSkeleton } from '@/components/states/loading-skeleton'
import { classifyError } from '@/components/states/classify-error'
import { ExerciseQuestionPanel } from '@renderer/components/exercise-question-panel'
import { ClipboardList } from 'lucide-react'

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
  const [listErrorVariant, setListErrorVariant] = useState<ErrorStateVariant | null>(null)

  // Load exercises from API
  useEffect(() => {
    loadExercises()
  }, [])

  const loadExercises = async (): Promise<void> => {
    try {
      setLoadingExercises(true)
      setListErrorVariant(null)
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
      setListErrorVariant(classifyError(error))
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
      toast.warning(
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

    toast.info('Đã làm mới bài tập')
  }

  return (
    <div className="min-h-screen bg-neutral-50 p-6">
      <h1 className="text-h1 mb-6 text-center text-neutral-900">Bài tập</h1>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="md:col-span-1">
          <Card className="p-4">
            <div className="text-h3 mb-4 text-center text-neutral-900">Danh sách bài tập</div>
            {loadingExercises ? (
              <ListSkeleton rows={4} />
            ) : listErrorVariant ? (
              <ErrorState variant={listErrorVariant} onRetry={loadExercises} />
            ) : exercises.length === 0 ? (
              <EmptyState icon={ClipboardList} message="Chưa có bài tập nào" />
            ) : (
              <div className="space-y-2">
                {exercises.map((exercise) => {
                  const status = getExerciseStatus(exercise.id)
                  const isActive = currentExercise?.id === exercise.id
                  return (
                    <button
                      key={exercise.id}
                      onClick={() => handleExerciseSelect(exercise)}
                      className={`w-full rounded-md border p-3 text-left transition ${
                        isActive ? 'border-primary-300 bg-primary-50' : 'hover:bg-neutral-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-body-md text-neutral-900">{exercise.name}</span>
                      </div>
                      <div className="mt-1 text-small text-muted-foreground">
                        Số câu hỏi: {exercise.questions.length}
                      </div>
                      <div className="mt-1">
                        {status?.completed ? (
                          <Badge variant="default" className="bg-success">
                            <CheckCircleFilled className="mr-1" />
                            Đã làm: {status.score}/{exercise.questions.length}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-warning">
                            <ClockCircleFilled className="mr-1" />
                            Chưa làm
                          </Badge>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </Card>
        </div>

        <div className="md:col-span-2">
          <Card className="p-4">
            {loading ? (
              <ListSkeleton rows={3} />
            ) : currentExercise ? (
              <>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-h3 text-neutral-900">{currentExercise.name}</h2>
                  {submitted && score !== null && (
                    <Progress
                      type="circle"
                      percent={score}
                      size={60}
                      status={score >= 60 ? 'success' : 'exception'}
                    />
                  )}
                </div>

                <Separator className="mb-4" />

                {currentExercise.questions.map((question, index) => (
                  <ExerciseQuestionPanel
                    key={question.id}
                    question={{ ...question, audioUrl: (question as any).audioUrl }}
                    index={index}
                    userAnswer={userAnswers[question.id]}
                    submitted={submitted}
                    onAnswerChange={handleAnswerChange}
                  />
                ))}

                <Separator className="mb-4" />

                <div className="flex justify-end">
                  {submitted ? (
                    <Button onClick={resetExercise}>Làm lại</Button>
                  ) : (
                    <Button
                      onClick={handleSubmit}
                      disabled={Object.keys(userAnswers).length < currentExercise.questions.length}
                    >
                      Nộp bài
                    </Button>
                  )}
                </div>
              </>
            ) : (
              <EmptyState icon={ClipboardList} message="Vui lòng chọn một bài tập từ danh sách" />
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}

export default ExercisePage
