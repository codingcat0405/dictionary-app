import { Exercise } from '@renderer/apis/dictionary-api'
import { Modal, Tag } from 'antd'
import React from 'react'
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
          <span className="font-medium">Tên bài tập:</span>
          <span>{exercise?.name}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-medium">Số câu hỏi:</span>
          <Tag color="blue">{exercise?.questions?.length} câu</Tag>
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Danh sách câu hỏi:</h3>
          {exercise?.questions?.map((question, index) => (
            <div key={index} className="border rounded-lg p-4 bg-gray-50">
              <div className="flex items-start gap-2 mb-3">
                <span className="font-bold text-blue-600">Câu {index + 1}:</span>
                <span>{question.question}</span>
              </div>

              <div className="space-y-2 ml-6">
                <div
                  className={`p-2 rounded ${question.rightAnswer === 0 ? 'bg-green-100 border-green-300' : 'bg-gray-100'}`}
                >
                  <span className="font-medium">A.</span> {question.answerA}
                  {question.rightAnswer === 0 && (
                    <Tag color="green" className="ml-2">
                      Đáp án đúng
                    </Tag>
                  )}
                </div>
                <div
                  className={`p-2 rounded ${question.rightAnswer === 1 ? 'bg-green-100 border-green-300' : 'bg-gray-100'}`}
                >
                  <span className="font-medium">B.</span> {question.answerB}
                  {question.rightAnswer === 1 && (
                    <Tag color="green" className="ml-2">
                      Đáp án đúng
                    </Tag>
                  )}
                </div>
                <div
                  className={`p-2 rounded ${question.rightAnswer === 2 ? 'bg-green-100 border-green-300' : 'bg-gray-100'}`}
                >
                  <span className="font-medium">C.</span> {question.answerC}
                  {question.rightAnswer === 2 && (
                    <Tag color="green" className="ml-2">
                      Đáp án đúng
                    </Tag>
                  )}
                </div>
                <div
                  className={`p-2 rounded ${question.rightAnswer === 3 ? 'bg-green-100 border-green-300' : 'bg-gray-100'}`}
                >
                  <span className="font-medium">D.</span> {question.answerD}
                  {question.rightAnswer === 3 && (
                    <Tag color="green" className="ml-2">
                      Đáp án đúng
                    </Tag>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  )
}

export default ViewExerciseModal
