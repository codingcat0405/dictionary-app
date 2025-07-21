export const ACCESS_TOKEN_KEY = 'access_token'

export const getApiUrl = (): string => {
  const hostIp = localStorage.getItem('hostIp')
  if (hostIp) {
    return `http://${hostIp}:3000/api`
  }
  // Fallback to localhost for development
  return 'http://localhost:3000/api'
}

export const API_URL = getApiUrl()
