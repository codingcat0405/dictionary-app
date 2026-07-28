import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, Settings, WifiOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import useServerHealth from '@renderer/hooks/useServerHealth'
import ServerConfigDialog from '@renderer/components/ServerConfigDialog'

interface ServerProtectedRouteProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

const ServerProtectedRoute: React.FC<ServerProtectedRouteProps> = ({ children }) => {
  const { isConfigured, isHealthy, isLoading } = useServerHealth()
  const navigate = useNavigate()
  const [isConfigOpen, setIsConfigOpen] = React.useState(false)

  // Show loading while checking server health
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="mx-auto animate-spin text-primary-500" size={32} />
          <div className="mt-4 text-body text-neutral-600">Đang kiểm tra kết nối máy chủ...</div>
        </div>
      </div>
    )
  }

  // If server is not configured
  if (!isConfigured) {
    return (
      <>
        <div className="flex flex-col items-center justify-center min-h-screen gap-3 px-4 text-center">
          <WifiOff className="text-neutral-300" size={48} />
          <h2 className="text-h2 text-neutral-900">Chưa cấu hình máy chủ</h2>
          <p className="text-body text-neutral-500">
            Vui lòng cấu hình IP máy chủ để sử dụng tính năng này
          </p>
          <div className="mt-2 flex gap-2">
            <Button onClick={() => setIsConfigOpen(true)}>
              <Settings size={16} />
              Cấu hình máy chủ
            </Button>
            <Button variant="outline" onClick={() => navigate('/')}>
              Về trang chủ
            </Button>
          </div>
        </div>
        <ServerConfigDialog open={isConfigOpen} onOpenChange={setIsConfigOpen} />
      </>
    )
  }

  // If server is configured but not healthy
  if (!isHealthy) {
    return (
      <>
        <div className="flex flex-col items-center justify-center min-h-screen gap-3 px-4 text-center">
          <WifiOff className="text-error" size={48} />
          <h2 className="text-h2 text-neutral-900">Không thể kết nối đến máy chủ</h2>
          <p className="text-body text-neutral-500">
            Không thể kết nối đến máy chủ. Kiểm tra địa chỉ IP ở cuối màn hình.
          </p>
          <div className="mt-2 flex gap-2">
            <Button onClick={() => setIsConfigOpen(true)}>
              <Settings size={16} />
              Kiểm tra cấu hình
            </Button>
            <Button variant="outline" onClick={() => navigate('/')}>
              Về trang chủ
            </Button>
          </div>
        </div>
        <ServerConfigDialog open={isConfigOpen} onOpenChange={setIsConfigOpen} />
      </>
    )
  }

  // If server is healthy, render the children
  return <>{children}</>
}

export default ServerProtectedRoute
