import React, { useState, useEffect } from 'react'
import { Button, message, Card } from 'antd'
import {
  UploadOutlined,
  DeleteOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined
} from '@ant-design/icons'

interface AudioUploadProps {
  value?: string // Audio URL
  onChange?: (url: string | null) => void
}

const AudioUpload: React.FC<AudioUploadProps> = ({ value, onChange }) => {
  const [audioUrl, setAudioUrl] = useState<string | null>(value || null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null)

  useEffect(() => {
    setAudioUrl(value || null)
  }, [value])

  const getAudioUrl = (url: string) => {
    // If it's already a full URL, return as is
    if (url.startsWith('http')) {
      return url
    }
    // Otherwise, construct the full URL using the backend server
    const backendUrl = localStorage.getItem('backendUrl') || 'http://localhost:3000'
    return `${backendUrl}${url}`
  }

  const handleUpload = async (): Promise<void> => {
    try {
      const response = await window.api.uploadAudio()
      if (response.success && response.url) {
        setAudioUrl(response.url)
        onChange?.(response.url)
        message.success('Audio uploaded successfully.')
      } else if (response.error) {
        message.error(`Upload failed: ${response.error}`)
      }
    } catch (error) {
      console.error('Error uploading audio:', error)
      message.error('Failed to upload audio.')
    }
  }

  const handleRemove = (): void => {
    setAudioUrl(null)
    onChange?.(null)
    if (audioElement) {
      audioElement.pause()
      setIsPlaying(false)
    }
    message.success('Audio removed.')
  }

  const handlePlayPause = (): void => {
    if (!audioUrl) return

    if (audioElement) {
      if (isPlaying) {
        audioElement.pause()
        setIsPlaying(false)
      } else {
        audioElement.play()
        setIsPlaying(true)
      }
    } else {
      const audio = new Audio(getAudioUrl(audioUrl))
      audio.onended = () => setIsPlaying(false)
      audio.onerror = () => {
        message.error('Failed to play audio')
        setIsPlaying(false)
      }
      setAudioElement(audio)
      audio.play()
      setIsPlaying(true)
    }
  }

  return (
    <Card className="audio-upload-card">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Audio Question</span>
          <div className="flex gap-2">
            {audioUrl && (
              <>
                <Button
                  type="primary"
                  icon={isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
                  onClick={handlePlayPause}
                  size="small"
                >
                  {isPlaying ? 'Pause' : 'Play'}
                </Button>
                <Button
                  type="primary"
                  danger
                  icon={<DeleteOutlined />}
                  size="small"
                  onClick={handleRemove}
                >
                  Remove
                </Button>
              </>
            )}
            {!audioUrl && (
              <Button type="dashed" onClick={handleUpload} icon={<UploadOutlined />} size="small">
                Upload Audio
              </Button>
            )}
          </div>
        </div>

        {audioUrl && (
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-sm text-gray-600">
              <strong>Audio file:</strong> {audioUrl.split('/').pop()}
            </div>
            <audio
              src={getAudioUrl(audioUrl)}
              controls
              className="w-full mt-2"
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={() => setIsPlaying(false)}
            >
              Your browser does not support the audio element.
            </audio>
          </div>
        )}

        {!audioUrl && (
          <div className="text-center py-4 text-gray-500">
            No audio file uploaded. Click "Upload Audio" to add an audio question.
          </div>
        )}
      </div>
    </Card>
  )
}

export default AudioUpload
