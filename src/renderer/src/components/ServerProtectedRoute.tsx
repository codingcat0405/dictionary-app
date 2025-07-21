import React from 'react'
import { Spin, Result, Button } from 'antd'
import { useNavigate } from 'react-router-dom'
import useServerHealth from '@renderer/hooks/useServerHealth'
import { IoIosSettings } from 'react-icons/io'

interface ServerProtectedRouteProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

const ServerProtectedRoute: React.FC<ServerProtectedRouteProps> = ({ children }) => {
  const { isConfigured, isHealthy, isLoading, serverIp } = useServerHealth()
  const navigate = useNavigate()

  // Show loading while checking server health
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Spin size="large" />
          <div className="mt-4">Đang kiểm tra kết nối máy chủ...</div>
        </div>
      </div>
    )
  }

  // If server is not configured
  if (!isConfigured) {
    return (
      <Result
        status="warning"
        title="Chưa cấu hình máy chủ"
        subTitle="Vui lòng cấu hình IP máy chủ để sử dụng tính năng này"
        extra={[
          <Button
            type="primary"
            key="configure"
            icon={<IoIosSettings />}
            onClick={() => {
              // You can trigger the footer settings modal here
              // For now, just show a message
              alert(
                'Vui lòng cấu hình IP máy chủ trong phần cài đặt (biểu tượng bánh răng ở footer)'
              )
            }}
          >
            Cấu hình máy chủ
          </Button>,
          <Button key="home" onClick={() => navigate('/')}>
            Về trang chủ
          </Button>
        ]}
      />
    )
  }

  // If server is configured but not healthy
  if (!isHealthy) {
    return (
      <Result
        status="error"
        title="Không thể kết nối đến máy chủ"
        subTitle={`Máy chủ ${serverIp}:3000 không khả dụng. Vui lòng kiểm tra lại cấu hình.`}
        extra={[
          <Button
            type="primary"
            key="configure"
            icon={<IoIosSettings />}
            onClick={() => {
              alert('Vui lòng kiểm tra lại IP máy chủ trong phần cài đặt')
            }}
          >
            Kiểm tra cấu hình
          </Button>,
          <Button key="home" onClick={() => navigate('/')}>
            Về trang chủ
          </Button>
        ]}
      />
    )
  }

  // If server is healthy, render the children
  return <>{children}</>
}

export default ServerProtectedRoute
