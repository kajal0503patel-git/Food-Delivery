import axios from 'axios'

// baseURL '/api' hai, vite proxy use backend (localhost:5000) tak pahunchata hai
const api = axios.create({ baseURL: '/api' })

// har request mein token apne aap lagta hai
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
})

// token expire ho gaya to login page par bhej do (login ki apni galti par nahi)
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

// backend ka message nikalta hai, nahi mila to default
export const getError = (err) =>
    err.response?.data?.message || (err.request ? 'Server se connect nahi ho pa raha' : 'Kuch galat ho gaya')

export default api