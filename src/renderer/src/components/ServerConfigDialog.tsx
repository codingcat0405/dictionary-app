import React from 'react'
import { Form, Input, Button as AntButton } from 'antd'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import { updateApiBaseUrl } from '@renderer/apis/axios-client'
import { getStoredBackendUrl } from '@/lib/backend-url'

const getHostname = (url: string): string => {
  try {
    return new URL(url).hostname
  } catch {
    return ''
  }
}

interface ServerConfigDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Called with the newly-saved backend URL right before the dialog closes. */
  onSaved?: (backendUrl: string) => void
}

/**
 * Shared "configure LAN server IP" dialog — extracted from `Footer.tsx` so both the
 * Footer's gear icon AND `ServerProtectedRoute`'s error states can trigger it directly,
 * instead of a native browser popup telling the user to go find the gear icon.
 */
const ServerConfigDialog: React.FC<ServerConfigDialogProps> = ({ open, onOpenChange, onSaved }) => {
  const [form] = Form.useForm()
  const [isChecking, setIsChecking] = React.useState(false)

  React.useEffect(() => {
    if (open) {
      const stored = getStoredBackendUrl()
      form.setFieldsValue({ ip: stored ? getHostname(stored) : '' })
    }
  }, [open, form])

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
        updateApiBaseUrl()
        toast.success('Đã cập nhật IP máy chủ thành công')
        onSaved?.(fullBackendUrl)
        onOpenChange(false)
      } else {
        toast.error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại IP!')
      }
    } catch (error) {
      console.error('Error updating host IP:', error)
      toast.error('Lỗi khi kiểm tra kết nối máy chủ!')
    } finally {
      setIsChecking(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cấu hình máy chủ</DialogTitle>
          <DialogDescription>
            Nhập địa chỉ IP của máy chủ trong mạng LAN để kết nối tới E-Dictionary.
          </DialogDescription>
        </DialogHeader>
        <Form onFinish={handleUpdateHostIp} form={form} name="updateHostIp" layout="vertical">
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
          <div className="text-sm text-muted-foreground space-y-1">
            <p>• Chỉ cần nhập địa chỉ IP của máy chủ</p>
            <p>• Ví dụ: 192.168.1.100</p>
            <p>• Hệ thống sẽ kiểm tra kết nối trước khi lưu</p>
          </div>
          <DialogFooter className="mt-4">
            <AntButton onClick={() => onOpenChange(false)}>Đóng</AntButton>
            <AntButton type="primary" htmlType="submit" loading={isChecking}>
              {isChecking ? 'Đang kiểm tra...' : 'Lưu'}
            </AntButton>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default ServerConfigDialog
