import React from 'react'
import { Form, Input } from 'antd'
import { Link, useNavigate } from 'react-router-dom'
import dictionaryApi from '@renderer/apis/dictionary-api'
import { saveAuth } from '@/hooks/use-auth'
import { toast } from 'sonner'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const RegisterPage: React.FC = () => {
  const [form] = Form.useForm()
  const navigate = useNavigate()
  const handleSubmit = async (values): Promise<void> => {
    try {
      await dictionaryApi.register({
        username: values.username,
        password: values.password,
        fullName: values.fullName
      })
      //log user in
      const response = await dictionaryApi.login({
        username: values.username,
        password: values.password
      })
      saveAuth(response)
      if (response.user.role === 'admin') {
        navigate('/admin')
      } else {
        navigate('/')
      }
    } catch (error) {
      console.log(error)
      toast.error('Đăng ký thất bại. Vui lòng thử lại.')
    }
  }
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 p-6">
      <Card className="w-full max-w-md p-6">
        <h1 className="text-display mb-4 text-center text-neutral-900">Đăng ký</h1>
        <Form form={form} onFinish={handleSubmit} layout="vertical" name="login">
          <Form.Item
            name="fullName"
            label="Họ và tên"
            rules={[{ required: true, message: 'Please input your full name!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="username"
            label="Tài khoản"
            rules={[{ required: true, message: 'Please input your username!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="password"
            label="Mật khẩu"
            rules={[{ required: true, message: 'Please input your password!' }]}
          >
            <Input.Password />
          </Form.Item>
          <Button className="mt-2 w-full" type="submit">
            Đăng ký
          </Button>
        </Form>
        <div className="mt-4 text-center text-small">
          <Link to="/login" className="cursor-pointer text-primary-600 hover:underline">
            Có tài khoản? Đăng nhập{' '}
          </Link>
        </div>
      </Card>
    </div>
  )
}
export default RegisterPage
