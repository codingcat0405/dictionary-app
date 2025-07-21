import React from 'react'
import { Button, Form, Input } from 'antd'
import { Link, useNavigate } from 'react-router-dom'
import dictionaryApi from '@renderer/apis/dictionary-api'
import { ACCESS_TOKEN_KEY } from '@renderer/constants'

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
      localStorage.setItem(ACCESS_TOKEN_KEY, JSON.stringify(response))
      if (response.user.role === 'admin') {
        navigate('/admin')
      } else {
        navigate('/')
      }
    } catch (error) {
      console.log(error)
    }
  }
  return (
    <div className="pt-28 flex justify-center items-center">
      <div className="w-1/2 border-2 border-blue-400 rounded-lg p-4">
        <h4 className="font-bold text-lg text-center">Đăng ký</h4>
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
          <Button className="mt-2 w-full" type="primary" htmlType="submit">
            Đăng ký
          </Button>
        </Form>
        <div className="text-center mt-2">
          <Link to="/login" className="cursor-pointer text-blue-600 underline">
            Có tài khoản? Đăng nhập{' '}
          </Link>
        </div>
      </div>
    </div>
  )
}
export default RegisterPage
