import axios from 'axios'

export const clientApi = axios.create({
  baseURL: '/api/v1/client',
  headers: { 'Content-Type': 'application/json' },
})

clientApi.interceptors.request.use(config => {
  const token = localStorage.getItem('bmi_client_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

clientApi.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      const url: string = err.config?.url ?? ''
      const isAuthEndpoint = url === '/login' || url.endsWith('/login')
      if (!isAuthEndpoint) {
        localStorage.removeItem('bmi_client_token')
        window.location.href = '/client/login'
      }
    }
    return Promise.reject(err)
  }
)
