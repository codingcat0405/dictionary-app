import React from 'react'
import AppLayout from '@renderer/layouts/AppLayout'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import DebugPanel from '@renderer/components/DebugPanel'

const queryClient = new QueryClient()

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={0}>
        <AppLayout />
        <Toaster richColors position="top-right" />
        <DebugPanel />
      </TooltipProvider>
    </QueryClientProvider>
  )
}

export default App
