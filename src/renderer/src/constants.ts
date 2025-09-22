export const ACCESS_TOKEN_KEY = 'access_token'

export const getApiUrl = (): string => {
  const backendUrl = localStorage.getItem('backendUrl') || 'http://localhost:3000'
  return `${backendUrl}/api`
}

export const API_URL = getApiUrl()
