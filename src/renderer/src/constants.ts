import { getBackendBaseUrl } from '@/lib/backend-url'

export const ACCESS_TOKEN_KEY = 'access_token'

export const getApiUrl = (): string => {
  return `${getBackendBaseUrl()}/api`
}
