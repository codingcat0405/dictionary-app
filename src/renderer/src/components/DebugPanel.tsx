import React, { useState, useEffect } from 'react'

interface DictionaryStatus {
  ev: {
    path: string
    initialized: boolean
    wordCount: number
  }
  ve: {
    path: string
    initialized: boolean
    wordCount: number
  }
}

const DebugPanel: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false)
  const [status, setStatus] = useState<DictionaryStatus | null>(null)

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Ctrl+Shift+D to toggle debug panel
      if (event.ctrlKey && event.shiftKey && event.key === 'D') {
        setIsVisible(prev => !prev)
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [])

  useEffect(() => {
    if (isVisible) {
      // Get dictionary status
      window.api?.getDictionaryStatus?.().then((result: DictionaryStatus) => {
        setStatus(result)
      }).catch(console.error)
    }
  }, [isVisible])

  if (!isVisible) return null

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      width: '400px',
      maxHeight: '300px',
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      color: 'white',
      padding: '15px',
      borderRadius: '8px',
      fontSize: '12px',
      fontFamily: 'monospace',
      zIndex: 9999,
      overflow: 'auto'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <h3 style={{ margin: 0, color: "#111" }}>Debug Panel</h3>
        <button 
          onClick={() => setIsVisible(false)}
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          ×
        </button>
      </div>
      
      <div style={{ marginBottom: '10px' }}>
        <strong>Keyboard Shortcuts:</strong>
        <br />
        Ctrl+Shift+D: Toggle this panel
        <br />
        Ctrl+Shift+I: Open DevTools
      </div>

      {status ? (
        <div>
          <strong>Dictionary Status:</strong>
          <br />
          <br />
          <strong>EV Dictionary:</strong>
          <br />
          Path: {status.ev.path}
          <br />
          Initialized: {status.ev.initialized ? '✅' : '❌'}
          <br />
          Word Count: {status.ev.wordCount}
          <br />
          <br />
          <strong>VE Dictionary:</strong>
          <br />
          Path: {status.ve.path}
          <br />
          Initialized: {status.ve.initialized ? '✅' : '❌'}
          <br />
          Word Count: {status.ve.wordCount}
        </div>
      ) : (
        <div>Loading status...</div>
      )}
    </div>
  )
}

export default DebugPanel 