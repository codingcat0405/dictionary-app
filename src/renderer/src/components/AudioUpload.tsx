import React, { useState, useEffect } from 'react'
import { toast } from 'sonner'
import dictionaryApi from '@renderer/apis/dictionary-api'
import { resolveAssetUrl } from '@/lib/backend-url'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Play, Pause, Trash2, Upload } from 'lucide-react'

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

  const getAudioUrl = (url: string): string => resolveAssetUrl(url)

  const handleUpload = async (): Promise<void> => {
    try {
      // Pick file using Electron
      const pickResult = await window.api.pickAudio()

      if (!pickResult.success || !pickResult.filePath) {
        if (pickResult.error) {
          toast.error(pickResult.error)
        }
        return
      }

      // Convert file path to File object
      const { readFileAsFile } = await import('@renderer/utils/fileReader')
      const file = await readFileAsFile(pickResult.filePath)

      // Upload to backend
      const uploadResult = await dictionaryApi.uploadAudio(file)

      if (uploadResult.success && uploadResult.url) {
        setAudioUrl(uploadResult.url)
        onChange?.(uploadResult.url)
        toast.success('Audio uploaded successfully.')
      } else {
        toast.error('Upload failed')
      }
    } catch (error) {
      console.error('Error uploading audio:', error)
      toast.error('Failed to upload audio.')
    }
  }

  const handleRemove = (): void => {
    setAudioUrl(null)
    onChange?.(null)
    if (audioElement) {
      audioElement.pause()
      setIsPlaying(false)
    }
    toast.success('Audio removed.')
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
        toast.error('Failed to play audio')
        setIsPlaying(false)
      }
      setAudioElement(audio)
      audio.play()
      setIsPlaying(true)
    }
  }

  return (
    <Card className="gap-3 p-4">
      <div className="flex items-center justify-between">
        <span className="text-body-md text-neutral-900">Audio Question</span>
        <div className="flex gap-2">
          {audioUrl && (
            <>
              <Button size="sm" onClick={handlePlayPause}>
                {isPlaying ? <Pause /> : <Play />}
                {isPlaying ? 'Pause' : 'Play'}
              </Button>
              <Button size="sm" variant="destructive" onClick={handleRemove}>
                <Trash2 />
                Remove
              </Button>
            </>
          )}
          {!audioUrl && (
            <Button size="sm" variant="outline" onClick={handleUpload}>
              <Upload />
              Upload Audio
            </Button>
          )}
        </div>
      </div>

      {audioUrl && (
        <div className="rounded-lg bg-neutral-50 p-3">
          <div className="text-small text-muted-foreground">
            <strong>Audio file:</strong> {audioUrl.split('/').pop()}
          </div>
          <audio
            src={getAudioUrl(audioUrl)}
            controls
            className="mt-2 w-full"
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => setIsPlaying(false)}
          >
            Your browser does not support the audio element.
          </audio>
        </div>
      )}

      {!audioUrl && (
        <div className="py-4 text-center text-small text-muted-foreground">
          No audio file uploaded. Click "Upload Audio" to add an audio question.
        </div>
      )}
    </Card>
  )
}

export default AudioUpload
