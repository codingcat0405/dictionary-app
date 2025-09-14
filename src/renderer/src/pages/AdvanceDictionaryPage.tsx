import React, { useState, useEffect, useCallback } from 'react'
import { Button, Dropdown, Input, Select, Card, Tag, Space, Image } from 'antd'
import { US, VN } from 'country-flag-icons/react/1x1'
import { useNavigate } from 'react-router-dom'
import dictionaryApi from '@renderer/apis/dictionary-api'
import toast from 'react-hot-toast'
import { debounce } from 'lodash'
import { isProfane } from '@renderer/utils/badWordsFilter'

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

  const handleFindWord = async (e: React.MouseEvent<HTMLButtonElement>): Promise<void> => {
    try {
      e.preventDefault()

      // Check for bad words
      if (isProfane(inputValue.trim())) {
        toast.error('Từ này không phù hợp để tra cứu')
        setResult(null)
        return
      }

      console.log('inputValue', inputValue)
      console.log('type', type)
      const resp = await dictionaryApi.findWord(inputValue, type)
      if (!resp || !Array.isArray(resp)) {
        toast.error('Không tìm thấy từ')
        setResult(null)
        return
      }
      if (resp.length <= 0) {
        toast.error('Không tìm thấy từ')
        setResult(null)
        return
      }
      setResult(resp[0])
      // Save to recents after successful search
      saveToRecents(inputValue, type)
    } catch {
      toast.error('Không tìm thấy từ')
      setResult(null)
    }
  }

  const handleWordClick = async (word: string, wordType: number): Promise<void> => {
    setInputValue(word)
    setType(wordType)

    try {
      const resp = await dictionaryApi.findWord(word, wordType)
      if (resp && Array.isArray(resp) && resp.length > 0) {
        setResult(resp[0])
      } else {
        toast.error('Không tìm thấy từ')
        setResult(null)
      }
    } catch {
      toast.error('Không tìm thấy từ')
      setResult(null)
    }
  }

  const handleFavoriteClick = (): void => {
    if (result?.word) {
      saveToFavorites(result.word, type)
    }
  }

  const handleSuggestionClick = async (key: string): Promise<void> => {
    // Check for bad words in suggestion click
    if (isProfane(key)) {
      toast.error('Từ này không phù hợp để tra cứu')
      return
    }

    setInputValue(key)
    setResult(null)
    try {
      const resp = await dictionaryApi.findWord(key, type)
      if (resp && Array.isArray(resp) && resp.length > 0) {
        setResult(resp[0])
        saveToRecents(key, type)
      } else {
        toast.error('Không tìm thấy từ')
        setResult(null)
      }
    } catch {
      toast.error('Không tìm thấy từ')
      setResult(null)
    }
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
      console.log('Parsed image URLs from database:', urls)
      return Array.isArray(urls) ? urls : []
    } catch (error) {
      console.error('Error parsing images:', error)
      return []
    }
  }

  const getImageUrl = (url: string): string => {
    // If it's already a full URL, return as is
    if (url.startsWith('http')) {
      return url
    }
    // Otherwise, construct the full URL using the backend server
    const backendUrl = localStorage.getItem('backendUrl') || 'http://localhost:3000'
    const fullUrl = `${backendUrl}${url}`
    console.log('Image URL construction:', { url, backendUrl, fullUrl })
    return fullUrl
  }

  return (
    <div className="mt-4">
      <div className="container mx-auto flex gap-2">
        <div className="w-1/3">
          <form className="bg-white rounded-lg shadow-md p-2 self-start">
            <div className="text-center font-bold text-lg mb-2">Tra từ chuyên ngành</div>
            <Dropdown
              trigger={['click']}
              menu={{
                items: suggestionItems,
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

            <div className="flex items-center gap-2 mt-2">
              <Button
                type="primary"
                htmlType="submit"
                className="w-2/3"
                block
                onClick={handleFindWord}
              >
                Tra từ
              </Button>
              <Select
                style={{ width: 'calc(1/3 * 100%)' }}
                defaultValue="0"
                onChange={(value) => {
                  setType(Number(value))
                  setSuggestionItems([])
                  setResult(null)
                }}
              >
                <Select.Option value="0">
                  <US />
                </Select.Option>
                <Select.Option value="1">
                  <VN />
                </Select.Option>
              </Select>
            </div>
            <div className="mt-3">
              Từ đã tra:
              <div className="flex items-center flex-wrap gap-2">
                {recentWords.map((word, index) => (
                  <div
                    key={index}
                    onClick={() => handleWordClick(word.word, word.type)}
                    className="text-blue-600 cursor-pointer hover:underline text-sm"
                  >
                    {word.word}
                  </div>
                ))}
              </div>
            </div>
          </form>
          <div className="bg-white rounded-lg shadow-md p-2 self-start mt-5">
            <div className="text-center font-bold text-lg mb-2">Từ yêu thích</div>
            <div className="flex items-center flex-wrap gap-2">
              {savedWords.map((word, index) => (
                <div
                  key={index}
                  onClick={() => handleWordClick(word.word, word.type)}
                  className="text-blue-600 cursor-pointer hover:underline text-sm"
                >
                  {word.word}
                </div>
              ))}
            </div>
          </div>
          <Button
            type="primary"
            className="w-full mt-5"
            onClick={() => {
              navigate('/')
            }}
          >
            Tra từ điển phổ thông
          </Button>
        </div>

        <div className="w-2/3">
          {result ? (
            <Card className="shadow-md">
              <div className="space-y-4">
                {/* Word Header */}
                <div className="border-b pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="text-3xl font-bold text-blue-600 mb-2">
                        {result.word || 'N/A'}
                      </h1>
                      <p className="text-lg text-gray-600 italic">
                        /{result.pronunciation || 'N/A'}/
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Tag color={type === 0 ? 'blue' : 'green'}>
                        {type === 0 ? 'Anh → Việt' : 'Việt → Anh'}
                      </Tag>
                      {result.id && <Tag color="orange">ID: {result.id}</Tag>}
                    </div>
                  </div>
                </div>

                {/* Definition */}
                {result.definition && (
                  <div className="space-y-3">
                    <h3 className="text-xl font-semibold text-gray-800">Định nghĩa:</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div
                        className="text-gray-700 leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: result.definition }}
                      />
                    </div>
                  </div>
                )}

                {/* Images */}
                {result.images && getImageUrls(result.images).length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-xl font-semibold text-gray-800">Hình ảnh:</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {getImageUrls(result.images).map((imageUrl, index) => (
                        <div key={index} className="relative">
                          <Image
                            src={getImageUrl(imageUrl)}
                            alt={`${result.word} - Image ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg shadow-sm"
                            onLoad={() => {
                              console.log('Image loaded successfully:', getImageUrl(imageUrl))
                            }}
                            onError={(e) => {
                              console.error('Image load error:', e)
                              console.error('Failed to load image:', getImageUrl(imageUrl))
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
                <div className="border-t pt-4">
                  <Space direction="vertical" className="w-full">
                    {result.createdAt && (
                      <div className="flex justify-between text-sm text-gray-500">
                        <span>Tạo lúc:</span>
                        <span>{new Date(result.createdAt).toLocaleString('vi-VN')}</span>
                      </div>
                    )}
                  </Space>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4 border-t">
                  <Button type="primary" icon={<span>🔊</span>} onClick={handleSpeak}>
                    Phát âm
                  </Button>
                  <Button icon={<span>❤️</span>} onClick={handleFavoriteClick}>
                    Yêu thích
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <div className="text-center">
              <h4 className="text-lg font-bold">Nhập từ cần tra cứu</h4>
              <p className="text-gray-500">Ví dụ: hello, world, ...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdvanceDictionaryPage
