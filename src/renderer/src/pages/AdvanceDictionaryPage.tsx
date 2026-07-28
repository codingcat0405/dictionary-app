import React, { useState, useEffect, useCallback } from 'react'
import { Dropdown, Image } from 'antd'
import { US, VN } from 'country-flag-icons/react/1x1'
import { useNavigate } from 'react-router-dom'
import dictionaryApi from '@renderer/apis/dictionary-api'
import { toast } from 'sonner'
import { debounce } from 'lodash'
import { isProfane } from '@renderer/utils/badWordsFilter'
import { resolveAssetUrl } from '@/lib/backend-url'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { EmptyState } from '@/components/states/empty-state'
import { ErrorState, type ErrorStateVariant } from '@/components/states/error-state'
import { classifyError } from '@/components/states/classify-error'
import { EntrySkeleton } from '@/components/states/loading-skeleton'
import { Search, BookOpen, Volume2, Heart } from 'lucide-react'

interface DictionaryResult {
  id?: number
  word?: string
  pronunciation?: string
  definition?: string
  type?: number
  createdAt?: string
  updatedAt?: string
  deletedAt?: string | null
  images?: string | null
}

interface SavedWord {
  word: string
  type: number
}

interface SuggestionItem {
  label: string
  key: string
}

//type!: number // 0: english -> vietnamese, 1: vietnamese -> english
const AdvanceDictionaryPage: React.FC = () => {
  const navigate = useNavigate()

  const [inputValue, setInputValue] = useState('Hello')
  const [type, setType] = useState(0)
  const [result, setResult] = useState<DictionaryResult | null>(null)
  const [recentWords, setRecentWords] = useState<SavedWord[]>([])
  const [savedWords, setSavedWords] = useState<SavedWord[]>([])
  const [suggestionItems, setSuggestionItems] = useState<SuggestionItem[]>([])
  const [debouncedValue, setDebouncedValue] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [errorVariant, setErrorVariant] = useState<ErrorStateVariant | null>(null)
  const [notFound, setNotFound] = useState(false)

  // Load saved words from localStorage on component mount
  useEffect(() => {
    loadSavedWords()
  }, [])

  // Create a debounced function for search suggestions
  const debouncedSearch = useCallback(
    debounce((value: string) => {
      setDebouncedValue(value)
    }, 500),
    []
  )

  // Handle debounced search for suggestions
  useEffect(() => {
    if (debouncedValue && debouncedValue.length >= 2) {
      // Check for bad words in debounced search
      if (isProfane(debouncedValue)) {
        setSuggestionItems([])
        return
      }

      dictionaryApi
        .findWordsSuggestions(debouncedValue, type)
        .then((suggestions) => {
          if (Array.isArray(suggestions)) {
            const items: SuggestionItem[] = suggestions.slice(0, 10).map((item) => ({
              label: item.word || '',
              key: item.word || ''
            }))
            setSuggestionItems(items)
          }
        })
        .catch((error) => {
          console.error('Error fetching suggestions:', error)
          setSuggestionItems([])
        })
    } else {
      setSuggestionItems([])
    }
  }, [debouncedValue, type])

  const loadSavedWords = (): void => {
    const recentsStr = window.localStorage.getItem('advance_recents') ?? '[]'
    const savedStr = window.localStorage.getItem('advance_saved') ?? '[]'

    try {
      const recents = JSON.parse(recentsStr)
      const saved = JSON.parse(savedStr)
      setRecentWords(recents)
      setSavedWords(saved)
    } catch (error) {
      console.error('Error loading saved words:', error)
    }
  }

  const saveToRecents = (word: string, type: number): void => {
    const newWord: SavedWord = { word, type }
    const updatedRecents = [
      newWord,
      ...recentWords.filter((w) => !(w.word === word && w.type === type))
    ]

    // Keep only 5 most recent words
    const limitedRecents = updatedRecents.slice(0, 5)

    window.localStorage.setItem('advance_recents', JSON.stringify(limitedRecents))
    setRecentWords(limitedRecents)
  }

  const saveToFavorites = (word: string, type: number): void => {
    const newWord: SavedWord = { word, type }
    const updatedSaved = [
      newWord,
      ...savedWords.filter((w) => !(w.word === word && w.type === type))
    ]

    // Keep only 5 saved words
    const limitedSaved = updatedSaved.slice(0, 5)

    window.localStorage.setItem('advance_saved', JSON.stringify(limitedSaved))
    setSavedWords(limitedSaved)
    toast.success('Đã lưu vào yêu thích')
  }

  /** Shared lookup path for the form submit, recents/saved click, and suggestion click —
   *  keeps loading/error/not-found state handling consistent across all three entry points. */
  const performLookup = async (
    searchWord: string,
    searchType: number,
    saveRecent: boolean
  ): Promise<void> => {
    if (isProfane(searchWord.trim())) {
      toast.error('Từ này không phù hợp để tra cứu')
      setResult(null)
      return
    }

    setLoading(true)
    setErrorVariant(null)
    try {
      const resp = await dictionaryApi.findWord(searchWord, searchType)
      if (!resp || !Array.isArray(resp) || resp.length <= 0) {
        toast.error('Không tìm thấy từ')
        setResult(null)
        setNotFound(true)
        return
      }
      setResult(resp[0])
      setNotFound(false)
      if (saveRecent) {
        saveToRecents(searchWord, searchType)
      }
    } catch (error) {
      toast.error('Không tìm thấy từ')
      setResult(null)
      setNotFound(false)
      setErrorVariant(classifyError(error))
    } finally {
      setLoading(false)
    }
  }

  const handleFindWord = async (e: React.MouseEvent<HTMLButtonElement>): Promise<void> => {
    e.preventDefault()
    await performLookup(inputValue, type, true)
  }

  const handleWordClick = async (word: string, wordType: number): Promise<void> => {
    setInputValue(word)
    setType(wordType)
    await performLookup(word, wordType, false)
  }

  const handleFavoriteClick = (): void => {
    if (result?.word) {
      saveToFavorites(result.word, type)
    }
  }

  const handleSuggestionClick = async (key: string): Promise<void> => {
    if (isProfane(key)) {
      toast.error('Từ này không phù hợp để tra cứu')
      return
    }
    setInputValue(key)
    setResult(null)
    await performLookup(key, type, true)
  }

  const handleRetry = (): void => {
    performLookup(inputValue, type, false)
  }

  const handleSpeak = (): void => {
    if (type === 1) {
      toast.error('Không hỗ trợ phát âm tiếng Việt')
      return
    }
    window.electron.ipcRenderer.send('speak_word', result?.word?.trim() ?? '')
  }

  const getImageUrls = (imagesJson: string | null): string[] => {
    if (!imagesJson) return []
    try {
      const urls = JSON.parse(imagesJson)
      return Array.isArray(urls) ? urls : []
    } catch (error) {
      console.error('Error parsing images:', error)
      return []
    }
  }

  const getImageUrl = (url: string): string => resolveAssetUrl(url)

  const renderResultPanel = (): React.ReactNode => {
    if (loading) {
      return <EntrySkeleton />
    }
    if (errorVariant) {
      return <ErrorState variant={errorVariant} onRetry={handleRetry} />
    }
    if (result) {
      return (
        <Card className="gap-4 p-4">
          {/* Word Header */}
          <div className="border-b pb-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-h1 text-primary-600">{result.word || 'N/A'}</h1>
                <p className="text-body text-muted-foreground italic">
                  /{result.pronunciation || 'N/A'}/
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={type === 0 ? 'default' : 'secondary'}>
                  {type === 0 ? 'Anh → Việt' : 'Việt → Anh'}
                </Badge>
                {result.id && <Badge variant="outline">ID: {result.id}</Badge>}
              </div>
            </div>
          </div>

          {/* Definition */}
          {result.definition && (
            <div className="space-y-2">
              <h3 className="text-h3 text-neutral-800">Định nghĩa:</h3>
              <div className="rounded-lg bg-neutral-50 p-4">
                <div
                  className="prose prose-sm max-w-none text-neutral-800"
                  dangerouslySetInnerHTML={{ __html: result.definition }}
                />
              </div>
            </div>
          )}

          {/* Images */}
          {result.images && getImageUrls(result.images).length > 0 && (
            <div className="space-y-2">
              <h3 className="text-h3 text-neutral-800">Hình ảnh:</h3>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                {getImageUrls(result.images).map((imageUrl, index) => (
                  <div key={index} className="relative">
                    <Image
                      src={getImageUrl(imageUrl)}
                      alt={`${result.word} - Image ${index + 1}`}
                      className="h-32 w-full rounded-lg object-cover shadow-sm"
                      onError={(e) => {
                        console.error('Failed to load image:', getImageUrl(imageUrl), e)
                      }}
                      preview={{
                        mask: 'Xem ảnh'
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Additional Info */}
          {result.createdAt && (
            <div className="flex justify-between border-t pt-4 text-small text-muted-foreground">
              <span>Tạo lúc:</span>
              <span>{new Date(result.createdAt).toLocaleString('vi-VN')}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 border-t pt-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button onClick={handleSpeak} aria-label="Phát âm">
                  <Volume2 />
                  Phát âm
                </Button>
              </TooltipTrigger>
              <TooltipContent>Phát âm từ này</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" onClick={handleFavoriteClick} aria-label="Yêu thích">
                  <Heart />
                  Yêu thích
                </Button>
              </TooltipTrigger>
              <TooltipContent>Lưu vào danh sách yêu thích</TooltipContent>
            </Tooltip>
          </div>
        </Card>
      )
    }
    if (notFound) {
      return <EmptyState icon={Search} message="Không tìm thấy kết quả" />
    }
    return (
      <EmptyState
        icon={BookOpen}
        message="Nhập từ để tra cứu"
        description="Ví dụ: hello, world, ..."
      />
    )
  }

  return (
    <div className="p-6">
      <h1 className="text-h1 mb-4 text-neutral-900">Tra từ chuyên ngành</h1>
      <div className="container mx-auto flex gap-4">
        <div className="w-1/3 space-y-4">
          <Card className="gap-2 p-4">
            <form className="space-y-2">
              <div className="text-center text-h3 text-neutral-900">Tra từ chuyên ngành</div>
              <Dropdown
                trigger={['click']}
                menu={{
                  items: suggestionItems as any,
                  onClick: ({ key }) => handleSuggestionClick(key)
                }}
                open={suggestionItems.length > 0}
              >
                <Input
                  placeholder="Nhập từ cần tra cứu"
                  value={inputValue}
                  onChange={(e) => {
                    setInputValue(e.target.value)
                    debouncedSearch(e.target.value)
                  }}
                />
              </Dropdown>

              <div className="flex items-center gap-2">
                <Button type="submit" className="flex-1" onClick={handleFindWord}>
                  Tra từ
                </Button>
                <div className="inline-flex overflow-hidden rounded-md border">
                  <button
                    type="button"
                    aria-label="Anh - Việt"
                    onClick={() => {
                      setType(0)
                      setSuggestionItems([])
                      setResult(null)
                      setNotFound(false)
                    }}
                    className={`flex h-9 w-10 items-center justify-center transition-colors ${
                      type === 0 ? 'bg-primary-50' : 'bg-transparent hover:bg-neutral-100'
                    }`}
                  >
                    <US className="size-4" />
                  </button>
                  <button
                    type="button"
                    aria-label="Việt - Anh"
                    onClick={() => {
                      setType(1)
                      setSuggestionItems([])
                      setResult(null)
                      setNotFound(false)
                    }}
                    className={`flex h-9 w-10 items-center justify-center border-l transition-colors ${
                      type === 1 ? 'bg-primary-50' : 'bg-transparent hover:bg-neutral-100'
                    }`}
                  >
                    <VN className="size-4" />
                  </button>
                </div>
              </div>
              <div className="pt-1">
                <p className="text-small text-muted-foreground">Từ đã tra:</p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  {recentWords.length === 0 && (
                    <span className="text-small text-neutral-400">Chưa có</span>
                  )}
                  {recentWords.map((word, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="cursor-pointer hover:bg-primary-100"
                      onClick={() => handleWordClick(word.word, word.type)}
                    >
                      {word.word}
                    </Badge>
                  ))}
                </div>
              </div>
            </form>
          </Card>
          <Card className="gap-2 p-4">
            <div className="text-center text-h3 text-neutral-900">Từ yêu thích</div>
            <div className="flex flex-wrap items-center gap-2">
              {savedWords.length === 0 && (
                <span className="text-small text-neutral-400">Chưa có từ yêu thích</span>
              )}
              {savedWords.map((word, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="cursor-pointer hover:bg-primary-100"
                  onClick={() => handleWordClick(word.word, word.type)}
                >
                  {word.word}
                </Badge>
              ))}
            </div>
          </Card>
          <Button
            className="w-full"
            onClick={() => {
              navigate('/')
            }}
          >
            Tra từ điển phổ thông
          </Button>
        </div>

        <div className="w-2/3">{renderResultPanel()}</div>
      </div>
    </div>
  )
}

export default AdvanceDictionaryPage
