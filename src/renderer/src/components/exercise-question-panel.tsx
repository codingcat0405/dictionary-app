import React from 'react'
import { Radio, Space } from 'antd'
import { CheckCircleFilled } from '@ant-design/icons'
import { resolveAssetUrl } from '@/lib/backend-url'

interface ExerciseQuestion {
  id: number
  question: string
  answerA: string
  answerB: string
  answerC: string
  answerD: string
  rightAnswer: number
  audioUrl?: string
}

const getAnswerLabel = (index: number): string => ['A', 'B', 'C', 'D'][index]

/**
 * Single MCQ question block for `ExercisePage` — extracted out of the page component
 * to keep the page file under the ~250-line practical limit (design brief §"Risk
 * Assessment": large files harder to review). Presentational only, no logic change
 * from the previous inline JSX.
 */
export const ExerciseQuestionPanel: React.FC<{
  question: ExerciseQuestion
  index: number
  userAnswer?: string
  submitted: boolean
  onAnswerChange: (questionId: number, answer: string) => void
}> = ({ question, index, userAnswer, submitted, onAnswerChange }) => {
  const audioUrl = question.audioUrl

  return (
    <div className="mb-6">
      <div className="mb-2 flex items-start gap-2">
        <span className="text-body-md shrink-0 text-neutral-900">Câu {index + 1}:</span>
        <div className="flex-1">
          <span className="text-body text-neutral-800">{question.question}</span>
          {audioUrl && (
            <div className="mt-2">
              <audio src={resolveAssetUrl(audioUrl)} controls className="w-full max-w-md">
                Your browser does not support the audio element.
              </audio>
            </div>
          )}
        </div>
      </div>

      <Radio.Group
        className="ml-6"
        onChange={(e) => onAnswerChange(question.id, e.target.value)}
        value={userAnswer}
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
                    ? 'font-medium text-success'
                    : userAnswer === key
                      ? 'text-error'
                      : ''
                  : ''
              }
            >
              {key}. {value}
              {submitted && key === getAnswerLabel(question.rightAnswer) && (
                <CheckCircleFilled className="ml-2 text-success" />
              )}
            </Radio>
          ))}
        </Space>
      </Radio.Group>
    </div>
  )
}

export default ExerciseQuestionPanel
