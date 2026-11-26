import { createContext, useContext, useEffect, useState } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    // token hai tabhi loading shuru hoti hai, nahi to seedha login/home dikhta hai
    const [loading, setLoading] = useState(() => !!localStorage.getItem('token'))

    // page khulte hi token se user ko pehchano
    useEffect(() => {
        if (!localStorage.getItem('token')) {
            return;
        }
        api
            .get('/auth/me')
            .then((res) => setUser(res.data.user))
            .catch(() => localStorage.removeItem('token'))
            .finally(() => setLoading(false))
    }, [])

    const saveSession = (data) => {
        localStorage.setItem('token', data.token)
        setUser(data.user)
        return data.user
    }

    const login = async (email, password) => {
        const res = await api.post('/auth/login', { email, password })
        return saveSession(res.data)
    }

    const register = async (form) => {
        const res = await api.post('/auth/register', form)
        return saveSession(res.data)
    }

    const logout = () => {
        localStorage.removeItem('token')
        setUser(null)
    }

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)