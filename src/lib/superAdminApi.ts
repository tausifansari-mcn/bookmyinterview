import axios from 'axios'

export const superAdminApi = axios.create({
  baseURL: '/api/v1/super-admin',
  headers: { 'Content-Type': 'application/json' },
})

superAdminApi.interceptors.request.use(config => {
  const token = localStorage.getItem('bmi_admin_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

superAdminApi.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      const url: string = err.config?.url ?? ''
      const isAuthEndpoint = url === '/login' || url.endsWith('/login')
      if (!isAuthEndpoint) {
        localStorage.removeItem('bmi_admin_token')
        window.location.href = '/super-admin/login'
      }
    }
    return Promise.reject(err)
  }
)
