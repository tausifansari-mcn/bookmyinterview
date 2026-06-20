import axios from 'axios'

export const portalApi = axios.create({
  baseURL: '/api/v1/portal',
  headers: { 'Content-Type': 'application/json' },
})

portalApi.interceptors.request.use(config => {
  const token = localStorage.getItem('bmi_candidate_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

portalApi.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      // Don't redirect for auth endpoints — let the form handle the error
      const url: string = err.config?.url ?? ''
      const isAuthEndpoint = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-otp']
        .some(p => url === p || url.endsWith(p))
      if (!isAuthEndpoint) {
        localStorage.removeItem('bmi_candidate_token')
        window.location.href = '/portal/login'
      }
    }
    return Promise.reject(err)
  }
)

export const uploadApi = axios.create({
  baseURL: '/api/v1/upload',
  headers: { 'Content-Type': 'application/json' },
})

uploadApi.interceptors.request.use(config => {
  const token = localStorage.getItem('bmi_candidate_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})
