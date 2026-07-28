import React, { useCallback, useEffect } from 'react'
import { Dropdown, MenuProps } from 'antd'
import { ParsedDictionaryEntry } from '@renderer/types'
import DictionaryEntry from '@renderer/components/DictionaryEntry'
import { debounce } from 'lodash'
import { US, VN } from 'country-flag-icons/react/1x1'
import { useNavigate } from 'react-router-dom'
import { isProfane } from '@renderer/utils/badWordsFilter'
import { toast } from 'sonner'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/states/empty-state'
import { ErrorState, type ErrorStateVariant } from '@/components/states/error-state'
import { classifyError } from '@/components/states/classify-error'
import { EntrySkeleton } from '@/components/states/loading-skeleton'
import { Search, BookOpen } from 'lucide-react'

const DictionaryPage: React.FC = () => {
  const navigate = useNavigate()
  const [dictionary, setDictionary] = React.useState<string>('ev')
  const [word, setWord] = React.useState<string>('')
  const [dictionaryEntry, setDictionaryEntry] = React.useState<ParsedDictionaryEntry | null>(null)
  const [similarWords, setSimilarWords] = React.useState<string[]>([])
  const [showSimilarWords, setShowSimilarWords] = React.useState<boolean>(false)
  const [debouncedValue, setDebouncedValue] = React.useState<string>('')
  const [similarMenuItems, setSimilarMenuItems] = React.useState<MenuProps['items']>([])
  const [recentsWords, setRecentsWords] = React.useState<{ word: string; dictionary: string }[]>([])
  const [savedWords, setSavedWords] = React.useState<{ word: string; dictionary: string }[]>([])
  const [loading, setLoading] = React.useState<boolean>(false)
  const [errorVariant, setErrorVariant] = React.useState<ErrorStateVariant | null>(null)

  const getSavedWords = (): void => {
    const recentsWords = window.localStorage.getItem('recents') ?? '[]'
    const recentWords: { word: string; dictionary: string }[] = JSON.parse(recentsWords)
    setRecentsWords(recentWords)
    const savedWords = window.localStorage.getItem('saved') ?? '[]'
    const savedWordsList: { word: string; dictionary: string }[] = JSON.parse(savedWords)
    setSavedWords(savedWordsList)
  }
  useEffect(() => {
    getSavedWords()
  }, [])
  const saveWordsToStorage = (
    word: string,
    dictionary: string,
    type: 'recents' | 'saved'
  ): void => {
    //save to recents word
    const wordsStr = window.localStorage.getItem(type) ?? '[]'
    const words: { word: string; dictionary: string }[] = JSON.parse(wordsStr)
    //if recents word we skip existing word, but with saved word we remove existing word
    const isExist = words.find((item) => item.word === word && item.dictionary === dictionary)
    if (isExist) {
      if (type === 'recents') {
        return
      }
      words.splice(words.indexOf(isExist), 1)
      window.localStorage.setItem(type, JSON.stringify(words))
      setSavedWords(words)
      return
    }
    if (type === 'recents' && words.length >= 5) {
      words.shift()
    }

    words.push({
      word,
      dictionary
    })
    window.localStorage.setItem(type, JSON.stringify(words))
    getSavedWords() //refresh recents words
  }

  const handleLookupWord = async (w: string, dictionary: string): Promise<void> => {
    if (!w) return

    // Check for bad words
    if (isProfane(w.trim())) {
      toast.error('Từ này không phù hợp để tra cứu')
      setDictionaryEntry(null)
      setShowSimilarWords(false)
      setSimilarWords([])
      return
    }

    setLoading(true)
    setErrorVariant(null)
    try {
      const resp = await window.electron.ipcRenderer.invoke('lookup_word', w.trim(), dictionary)
      setDictionaryEntry(resp)
      if (!resp) {
        setShowSimilarWords(true)
      } else {
        setShowSimilarWords(false)
      }
      //get half of the word
      const halfWord = w.trim().slice(0, Math.floor(word.length / 2))
      const similarWords = await window.electron.ipcRenderer.invoke(
        'similar_word',
        halfWord,
        dictionary
      )
      setSimilarWords(similarWords)
    } catch (error) {
      console.error('Error in handleLookupWord:', error)
      setDictionaryEntry(null)
      setShowSimilarWords(false)
      setSimilarWords([])
      setErrorVariant(classifyError(error))
    } finally {
      setLoading(false)
    }
  }
  const findSimilarWord = async (w: string, dictionaryArg?: string): Promise<void> => {
    setWord(w)
    setDictionaryEntry(null)
    setSimilarWords([])
    if (dictionaryArg) {
      setDictionary(dictionaryArg)
    }
    await handleLookupWord(w, dictionaryArg ? dictionaryArg : dictionary)
  }
  // Create a debounced function
  const debouncedSearch = useCallback(
    debounce((value: string) => {
      setDebouncedValue(value)
    }, 500),
    []
  )
  useEffect(() => {
    if (debouncedValue) {
      // Check for bad words in debounced search
      if (isProfane(debouncedValue)) {
        setSimilarMenuItems([])
        return
      }

      window.electron.ipcRenderer
        .invoke('similar_word', debouncedValue, dictionary)
        .then((similarWords: string[]) => {
          setSimilarMenuItems(
            similarWords.map((word) => ({
              label: word,
              key: word
            }))
          )
        })
    }
  }, [debouncedValue, dictionary])

  const onClick: MenuProps['onClick'] = async ({ key }) => {
    setWord(key)
    setDictionaryEntry(null)
    setSimilarWords([])
    setShowSimilarWords(false)
    await handleLookupWord(key, dictionary)
    saveWordsToStorage(key, dictionary, 'recents')
  }

  const handleRetry = (): void => {
    handleLookupWord(word, dictionary)
  }

  const renderResultPanel = (): React.ReactNode => {
    if (loading) {
      return <EntrySkeleton />
    }
    if (errorVariant) {
      return <ErrorState variant={errorVariant} onRetry={handleRetry} />
    }
    if (dictionaryEntry) {
      return (
        <DictionaryEntry
          entry={dictionaryEntry}
          dictionary={dictionary}
          similarWords={similarWords}
          findSimilarWord={findSimilarWord}
          onHeartClick={() => {
            saveWordsToStorage(word, dictionary, 'saved')
            getSavedWords()
          }}
        />
      )
    }
    if (showSimilarWords) {
      return (
        <div className="rounded-lg border bg-card p-4">
          <EmptyState icon={Search} message="Không tìm thấy kết quả" />
          {similarWords.length > 0 && (
            <div className="mt-2">
              <p className="text-body-md text-neutral-700">Gợi ý:</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {similarWords.map((word, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="cursor-pointer hover:bg-primary-100"
                    onClick={async () => {
                      await findSimilarWord(word)
                    }}
                  >
                    {word}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )
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
      <h1 className="text-h1 mb-4 text-neutral-900">Từ điển</h1>
      <div className="container mx-auto flex gap-4">
        <div className="w-1/3 space-y-4">
          <Card className="gap-2 p-4">
            <form
              className="space-y-2"
              onSubmit={async (e) => {
                e.preventDefault()
                await handleLookupWord(word, dictionary)
                saveWordsToStorage(word, dictionary, 'recents')
              }}
            >
              <div className="text-center text-h3 text-neutral-900">Tra từ</div>
              <Dropdown trigger={['click']} menu={{ items: similarMenuItems, onClick }}>
                <Input
                  value={word}
                  placeholder="Nhập từ cần tra cứu"
                  onChange={(e) => {
                    setWord(e.target.value)
                    debouncedSearch(e.target.value)
                  }}
                />
              </Dropdown>

              <div className="flex items-center gap-2">
                <Button type="submit" className="flex-1">
                  Tra từ
                </Button>
                <div className="inline-flex overflow-hidden rounded-md border">
                  <button
                    type="button"
                    aria-label="Từ điển Anh - Việt"
                    onClick={() => {
                      setDictionary('ev')
                      setDictionaryEntry(null)
                      setWord('')
                      setSimilarWords([])
                      setShowSimilarWords(false)
                    }}
                    className={`flex h-9 w-10 items-center justify-center transition-colors ${
                      dictionary === 'ev' ? 'bg-primary-50' : 'bg-transparent hover:bg-neutral-100'
                    }`}
                  >
                    <US className="size-4" />
                  </button>
                  <button
                    type="button"
                    aria-label="Từ điển Việt - Anh"
                    onClick={() => {
                      setDictionary('ve')
                      setDictionaryEntry(null)
                      setWord('')
                      setSimilarWords([])
                      setShowSimilarWords(false)
                    }}
                    className={`flex h-9 w-10 items-center justify-center border-l transition-colors ${
                      dictionary === 've' ? 'bg-primary-50' : 'bg-transparent hover:bg-neutral-100'
                    }`}
                  >
                    <VN className="size-4" />
                  </button>
                </div>
              </div>
              <div className="pt-1">
                <p className="text-small text-muted-foreground">Từ đã tra:</p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  {recentsWords.length === 0 && (
                    <span className="text-small text-neutral-400">Chưa có</span>
                  )}
                  {recentsWords.map((word, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="cursor-pointer hover:bg-primary-100"
                      onClick={async () => {
                        await findSimilarWord(word.word, word.dictionary)
                      }}
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
                  onClick={async () => {
                    await findSimilarWord(word.word, word.dictionary)
                  }}
                >
                  {word.word}
                </Badge>
              ))}
            </div>
          </Card>
          <Button
            className="w-full"
            onClick={() => {
              navigate('/advanced-dictionary')
            }}
          >
            Tra từ điển chuyên ngành
          </Button>
        </div>

        <div className="w-2/3">{renderResultPanel()}</div>
      </div>
    </div>
  )
}

export default DictionaryPage
