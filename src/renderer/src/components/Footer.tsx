import React from 'react'
import { IoIosSettings } from 'react-icons/io'
import { Button, Form, Input, Modal } from 'antd'
import { updateApiBaseUrl } from '@renderer/apis/axios-client'
import { toast } from 'react-hot-toast'

const Footer: React.FC = () => {
  const [form] = Form.useForm()
  const [isModalOpen, setIsModalOpen] = React.useState<boolean>(false)
  const [backendUrl, setBackendUrl] = React.useState<string>(
    localStorage.getItem('backendUrl') || ''
  )
  const [isChecking, setIsChecking] = React.useState<boolean>(false)

  const checkServerHealth = async (ip: string): Promise<boolean> => {
    try {
      const response = await fetch(`http://${ip}:3000/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const text = await response.text()
        return text.trim() === "It's works!"
      }
      return false
    } catch (error) {
      console.error('Server health check failed:', error)
      return false
    }
  }

  const handleUpdateHostIp = async (values: { ip: string }): Promise<void> => {
    setIsChecking(true)

    try {
      const isHealthy = await checkServerHealth(values.ip)

      if (isHealthy) {
        const fullBackendUrl = `http://${values.ip}:3000`
        window.localStorage.setItem('backendUrl', fullBackendUrl)
        setBackendUrl(fullBackendUrl)
        updateApiBaseUrl()
        toast.success('Đã cập nhật IP máy chủ thành công')
        setIsModalOpen(false)
      } else {
        toast.error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại IP!')
      }
    } catch (error) {
      toast.error('Lỗi khi kiểm tra kết nối máy chủ!')
    } finally {
      setIsChecking(false)
    }
  }

  return (
    <div className="w-full bg-blue-400 text-white py-2 px-6 flex items-center justify-between text-sm">
      <div>Version 1.0.0</div>
      <div className="flex items-center gap-2">
        <div>IP máy chủ: {backendUrl ? new URL(backendUrl).hostname : 'Not configured'}</div>
        <button className="cursor-pointer" onClick={() => setIsModalOpen(true)}>
          <IoIosSettings />
        </button>
      </div>

      <Modal
        onCancel={() => setIsModalOpen(false)}
        title="Cấu hình máy chủ"
        open={isModalOpen}
        footer={[
          <Button key="back" onClick={() => setIsModalOpen(false)}>
            Đóng
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={isChecking}
            onClick={() => {
              form.submit()
            }}
          >
            {isChecking ? 'Đang kiểm tra...' : 'Lưu'}
          </Button>
        ]}
      >
        <Form
          onFinish={handleUpdateHostIp}
          form={form}
          name="updateHostIp"
          initialValues={{
            ip: localStorage.getItem('backendUrl')
              ? new URL(localStorage.getItem('backendUrl')!).hostname
              : ''
          }}
        >
          <Form.Item
            label="Địa chỉ IP máy chủ"
            name="ip"
            rules={[
              { required: true, message: 'Nhập IP máy chủ!' },
              {
                pattern: new RegExp('^((25[0-5]|(2[0-4]|1\\d|[1-9]|)\\d)\\.?\\b){4}$'),
                message: 'Địa chỉ IP không hợp lệ!'
              }
            ]}
          >
            <Input placeholder="192.168.1.100" />
          </Form.Item>
          <div className="text-gray-500 text-sm mt-2">
            <p>• Chỉ cần nhập địa chỉ IP của máy chủ</p>
            <p>• Ví dụ: 192.168.1.100</p>
            <p>• Hệ thống sẽ kiểm tra kết nối trước khi lưu</p>
          </div>
        </Form>
      </Modal>
    </div>
  )
}
export default Footer
