'use client'

import type React from 'react'
import { useState, useEffect } from 'react'
import { Form, Input, Modal, Button, Radio, Space, Divider } from 'antd'
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import dictionaryApi, { Exercise } from '@renderer/apis/dictionary-api'
import { toast } from 'react-hot-toast'

interface Question {
  id: string
  content: string
  options: {
    A: string
    B: string
    C: string
    D: string
  }
  correctAnswer: 'A' | 'B' | 'C' | 'D' | ''
}

const CreateExerciseModal: React.FC<{
  open: boolean
  setOpen: (open: boolean) => void
  onFinish: () => void
  editingExercise?: Exercise | null
}> = ({ open, setOpen, editingExercise, onFinish }) => {
  const [form] = Form.useForm()
  const [questions, setQuestions] = useState<Question[]>([
    {
      id: '1',
      content: '',
      options: { A: '', B: '', C: '', D: '' },
      correctAnswer: ''
    }
  ])

  // Load editing exercise data when modal opens
  useEffect(() => {
    if (editingExercise && open) {
      form.setFieldsValue({
        name: editingExercise.name
      })

      const mappedQuestions: Question[] = editingExercise.questions.map((q, index) => ({
        id: (index + 1).toString(),
        content: q.question,
        options: {
          A: q.answerA,
          B: q.answerB,
          C: q.answerC,
          D: q.answerD
        },
        correctAnswer: String.fromCharCode(65 + q.rightAnswer) as 'A' | 'B' | 'C' | 'D'
      }))

      setQuestions(mappedQuestions)
    } else if (!editingExercise && open) {
      // Reset form for creating new exercise
      form.resetFields()
      setQuestions([
        {
          id: '1',
          content: '',
          options: { A: '', B: '', C: '', D: '' },
          correctAnswer: ''
        }
      ])
    }
  }, [editingExercise, open, form])

  const handleAddQuestion = (): void => {
    const newQuestion: Question = {
      id: Date.now().toString(),
      content: '',
      options: { A: '', B: '', C: '', D: '' },
      correctAnswer: ''
    }
    setQuestions([...questions, newQuestion])
  }

  const handleRemoveQuestion = (id: string): void => {
    if (questions.length > 1) {
      setQuestions(questions.filter((q) => q.id !== id))
    }
  }

  const handleQuestionChange = (id: string, field: string, value: string): void => {
    setQuestions(
      questions.map((q) => {
        if (q.id === id) {
          if (field === 'content') {
            return { ...q, content: value }
          } else if (field === 'correctAnswer') {
            return { ...q, correctAnswer: value as 'A' | 'B' | 'C' | 'D' | '' }
          } else if (field.startsWith('option')) {
            const option = field.split('-')[1] as 'A' | 'B' | 'C' | 'D'
            return {
              ...q,
              options: { ...q.options, [option]: value }
            }
          }
        }
        return q
      })
    )
  }

  const handleSubmit = async (values): Promise<void> => {
    const questionsData = questions.map((question) => ({
      question: question.content,
      answerA: question.options.A,
      answerB: question.options.B,
      answerC: question.options.C,
      answerD: question.options.D,
      rightAnswer: question.correctAnswer.charCodeAt(0) - 65 // A: 0, B: 1, C: 2, D: 3
    }))

    try {
      if (editingExercise) {
        // Update existing exercise
        await dictionaryApi.updateExercise(editingExercise.id, {
          name: values.name,
          questions: questionsData
        })
        toast.success('Cập nhật bài tập thành công')
      } else {
        // Create new exercise
        await dictionaryApi.createExercise({
          name: values.name,
          questions: questionsData
        })
        toast.success('Tạo bài tập thành công')
      }

      setOpen(false)
      form.resetFields()
      setQuestions([
        {
          id: '1',
          content: '',
          options: { A: '', B: '', C: '', D: '' },
          correctAnswer: ''
        }
      ])
    } catch (error) {
      console.log(error)
      toast.error(editingExercise ? 'Cập nhật bài tập thất bại' : 'Tạo bài tập thất bại')
    } finally {
      onFinish()
    }
  }

  const handleCancel = (): void => {
    form.resetFields()
    setQuestions([
      {
        id: '1',
        content: '',
        options: { A: '', B: '', C: '', D: '' },
        correctAnswer: ''
      }
    ])
    setOpen(false)
  }

  return (
    <Modal
      style={{
        maxHeight: '500px',
        overflowY: 'auto'
      }}
      title={editingExercise ? 'Chỉnh sửa bài tập' : 'Tạo bài tập'}
      open={open}
      onCancel={handleCancel}
      width={700}
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          Hủy
        </Button>,
        <Button
          key="submit"
          type="primary"
          onClick={() => {
            form.submit()
          }}
        >
          {editingExercise ? 'Cập nhật' : 'Lưu'}
        </Button>
      ]}
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          label="Tên bài tập"
          name="name"
          rules={[{ required: true, message: 'Vui lòng nhập tên bài tập!' }]}
        >
          <Input placeholder="Nhập tên bài tập" />
        </Form.Item>

        <Divider orientation="left">Danh sách câu hỏi</Divider>

        {questions.map((question, index) => (
          <div key={question.id} className="mb-6 p-4 border border-gray-200 rounded-md">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-base font-medium">Câu hỏi {index + 1}</h3>
              {questions.length > 1 && (
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleRemoveQuestion(question.id)}
                  size="small"
                >
                  Xóa
                </Button>
              )}
            </div>

            <Form.Item label="Nội dung câu hỏi" required className="mb-4">
              <Input.TextArea
                value={question.content}
                onChange={(e) => handleQuestionChange(question.id, 'content', e.target.value)}
                placeholder="Nhập nội dung câu hỏi"
                rows={2}
              />
            </Form.Item>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {['A', 'B', 'C', 'D'].map((option) => (
                <Form.Item key={option} label={`Đáp án ${option}`} required className="mb-2">
                  <Input
                    value={question.options[option as keyof typeof question.options]}
                    onChange={(e) =>
                      handleQuestionChange(question.id, `option-${option}`, e.target.value)
                    }
                    placeholder={`Nhập đáp án ${option}`}
                  />
                </Form.Item>
              ))}
            </div>

            <Form.Item label="Đáp án đúng" required>
              <Radio.Group
                value={question.correctAnswer}
                onChange={(e) => handleQuestionChange(question.id, 'correctAnswer', e.target.value)}
              >
                <Space direction="horizontal">
                  {['A', 'B', 'C', 'D'].map((option) => (
                    <Radio key={option} value={option}>
                      {option}
                    </Radio>
                  ))}
                </Space>
              </Radio.Group>
            </Form.Item>
          </div>
        ))}

        <div className="flex justify-center mt-4">
          <Button
            type="dashed"
            icon={<PlusOutlined />}
            onClick={handleAddQuestion}
            className="w-full md:w-1/2"
          >
            Thêm câu hỏi
          </Button>
        </div>
      </Form>
    </Modal>
  )
}

export default CreateExerciseModal
