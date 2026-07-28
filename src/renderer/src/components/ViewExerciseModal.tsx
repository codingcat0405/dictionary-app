import { Exercise } from '@renderer/apis/dictionary-api'
import { Modal } from 'antd'
import React from 'react'
import { Badge } from '@/components/ui/badge'

const ViewExerciseModal: React.FC<{
  exercise: Exercise | null
  open: boolean
  setOpen: (open: boolean) => void
}> = ({ exercise, open, setOpen }) => {
  if (!exercise) return null
  return (
    <Modal
      open={open}
      onCancel={() => setOpen(false)}
      onOk={() => setOpen(false)}
      title={`Xem bài tập: ${exercise?.name}`}
      width={800}
      style={{
        maxHeight: '500px',
        overflowY: 'auto'
      }}
    >
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-body-md text-neutral-900">Tên bài tập:</span>
          <span className="text-body text-neutral-700">{exercise?.name}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-body-md text-neutral-900">Số câu hỏi:</span>
          <Badge variant="secondary">{exercise?.questions?.length} câu</Badge>
        </div>

        <div className="space-y-4">
          <h3 className="text-h3 text-neutral-900">Danh sách câu hỏi:</h3>
          {exercise?.questions?.map((question, index) => (
            <div key={index} className="rounded-lg border bg-neutral-50 p-4">
              <div className="mb-3 flex items-start gap-2">
                <span className="text-body-md text-primary-600">Câu {index + 1}:</span>
                <span className="text-body text-neutral-800">{question.question}</span>
              </div>

              <div className="ml-6 space-y-2">
                {(['A', 'B', 'C', 'D'] as const).map((label, answerIndex) => {
                  const answerKey = `answer${label}` as
                    | 'answerA'
                    | 'answerB'
                    | 'answerC'
                    | 'answerD'
                  const isCorrect = question.rightAnswer === answerIndex
                  return (
                    <div
                      key={label}
                      className={`rounded p-2 text-body ${
                        isCorrect ? 'border border-success/30 bg-success-bg' : 'bg-neutral-100'
                      }`}
                    >
                      <span className="font-medium">{label}.</span> {question[answerKey]}
                      {isCorrect && (
                        <Badge variant="default" className="ml-2 bg-success">
                          Đáp án đúng
                        </Badge>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  )
}

export default ViewExerciseModal
