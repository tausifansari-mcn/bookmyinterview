import axios from 'axios'

export const questionBankApi = axios.create({
  baseURL: '/api/v1/question-bank',
  headers: { 'Content-Type': 'application/json' },
})

questionBankApi.interceptors.request.use(config => {
  const token = localStorage.getItem('bmi_admin_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

questionBankApi.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('bmi_admin_token')
      window.location.href = '/super-admin/login'
    }
    return Promise.reject(err)
  }
)
