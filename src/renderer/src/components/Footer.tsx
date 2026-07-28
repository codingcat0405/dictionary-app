import React from 'react'
import { IoIosSettings } from 'react-icons/io'
import ServerConfigDialog from '@renderer/components/ServerConfigDialog'
import { getStoredBackendUrl } from '@/lib/backend-url'

const getHostname = (url: string): string => {
  try {
    return new URL(url).hostname
  } catch {
    return 'Not configured'
  }
}

const Footer: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = React.useState<boolean>(false)
  const [backendUrl, setBackendUrl] = React.useState<string>(getStoredBackendUrl() || '')

  return (
    <div className="w-full bg-neutral-50 border-t border-border text-neutral-600 py-2 px-6 flex items-center justify-between text-sm">
      <div>Version 1.0.0</div>
      <div className="flex items-center gap-2">
        <div>IP máy chủ: {backendUrl ? getHostname(backendUrl) : 'Not configured'}</div>
        <button
          className="cursor-pointer text-neutral-500 hover:text-neutral-900 transition-colors"
          onClick={() => setIsModalOpen(true)}
          aria-label="Cấu hình máy chủ"
        >
          <IoIosSettings size={16} />
        </button>
      </div>

      <ServerConfigDialog
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSaved={(url) => setBackendUrl(url)}
      />
    </div>
  )
}
export default Footer
