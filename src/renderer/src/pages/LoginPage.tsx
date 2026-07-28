import React from 'react'
import { Form, Input } from 'antd'
import { Link, useNavigate } from 'react-router-dom'
import dictionaryApi from '@renderer/apis/dictionary-api'
import { saveAuth } from '@/hooks/use-auth'
import { toast } from 'sonner'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const LoginPage: React.FC = () => {
  const [form] = Form.useForm()
  const navigate = useNavigate()
  const handleSubmit = async (values): Promise<void> => {
    try {
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
      toast.error('Đăng nhập thất bại. Vui lòng kiểm tra lại tài khoản và mật khẩu.')
    }
  }
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 p-6">
      <Card className="w-full max-w-md p-6">
        <h1 className="text-display mb-4 text-center text-neutral-900">Đăng nhập</h1>
        <Form form={form} onFinish={handleSubmit} layout="vertical" name="login">
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
            Đăng nhập
          </Button>
        </Form>
        <div className="mt-4 text-center text-small">
          <Link to="/register" className="cursor-pointer text-primary-600 hover:underline">
            Chưa có tài khoản? Đăng ký{' '}
          </Link>
        </div>
      </Card>
    </div>
  )
}
export default LoginPage
