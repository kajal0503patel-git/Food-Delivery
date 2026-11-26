import axios from 'axios'

// baseURL is '/api'; the Vite proxy forwards it to the backend (localhost:5000)
const api = axios.create({ baseURL: '/api' })

// attach the token to every request automatically
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
})

// if the token has expired, send the user to the login page (but not for a failed login attempt)
api.interceptors.response.use(
    (res) => res,
    (err) => {
        const url = err.config?.url || ''
        if (err.response?.status === 401 && !url.startsWith('/auth/login') && localStorage.getItem('token')) {
            localStorage.removeItem('token')
            window.location.href = '/login'
        }
        return Promise.reject(err)
    },
)

// get the backend's error message, or a default one
export const getError = (err) =>
    err.response?.data?.message || (err.request ? 'Cannot connect to the server' : 'Something went wrong')

export default api