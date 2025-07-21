import React from 'react'
import AppLayout from '@renderer/layouts/AppLayout'
import { Toaster } from 'react-hot-toast'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import DebugPanel from '@renderer/components/DebugPanel'

const queryClient = new QueryClient()

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AppLayout />
      <Toaster />
      <DebugPanel />
    </QueryClientProvider>
  )
}

export default App
