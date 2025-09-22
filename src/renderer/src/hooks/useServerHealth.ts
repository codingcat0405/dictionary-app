import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'

interface ServerHealthStatus {
  isConfigured: boolean
  isHealthy: boolean
  isLoading: boolean
  serverIp: string | null
}

const useServerHealth = (): ServerHealthStatus => {
  const [status, setStatus] = useState<ServerHealthStatus>({
    isConfigured: false,
    isHealthy: false,
    isLoading: true,
    serverIp: null
  })

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

  const validateServerAccess = async (): Promise<void> => {
    const backendUrl = localStorage.getItem('backendUrl') || 'http://localhost:3000'

    if (!backendUrl || backendUrl === 'http://localhost:3000') {
      setStatus({
        isConfigured: false,
        isHealthy: false,
        isLoading: false,
        serverIp: null
      })
      return
    }

    // Extract IP from backendUrl (e.g., "http://192.168.1.100:3000" -> "192.168.1.100")
    const url = new URL(backendUrl)
    const hostIp = url.hostname

    setStatus((prev) => ({ ...prev, isLoading: true, serverIp: hostIp }))

    try {
      const isHealthy = await checkServerHealth(hostIp)

      setStatus({
        isConfigured: true,
        isHealthy,
        isLoading: false,
        serverIp: hostIp
      })

      if (!isHealthy) {
        toast.error('Máy chủ không khả dụng. Vui lòng kiểm tra cấu hình IP!')
      }
    } catch (error) {
      setStatus({
        isConfigured: true,
        isHealthy: false,
        isLoading: false,
        serverIp: hostIp
      })
      toast.error('Không thể kết nối đến máy chủ!')
    }
  }

  useEffect(() => {
    validateServerAccess()
  }, [])

  return status
}

export default useServerHealth
