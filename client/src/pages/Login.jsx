import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getError } from '../services/api'

export default function Login() {
    const { user, login } = useAuth()
    const navigate = useNavigate()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [busy, setBusy] = useState(false)

    if (user) return <Navigate to="/" replace />

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setBusy(true)
        try {
            await login(email, password)
            navigate('/')
        } catch (err) {
            setError(getError(err))
        } finally {
            setBusy(false)
        }
    }

    return (
        <div className="mx-auto mt-12 max-w-sm rounded-xl bg-white p-6 shadow">
            <h1 className="mb-4 text-2xl font-bold">Login</h1>

            {error && <p className="mb-3 rounded bg-red-50 p-2 text-sm text-red-600">{error}</p>}

            <form onSubmit={handleSubmit} className="space-y-3">
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full rounded-lg border border-gray-300 p-2 outline-none focus:border-orange-500"
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full rounded-lg border border-gray-300 p-2 outline-none focus:border-orange-500"
                />
                <button
                    disabled={busy}
                    className="w-full rounded-lg bg-orange-600 p-2 font-medium text-white hover:bg-orange-700 disabled:opacity-60"
                >
                    {busy ? 'Please wait...' : 'Login'}
                </button>
            </form>

            <p className="mt-4 text-center text-sm text-gray-600">
                Account nahi hai?{' '}
                <Link to="/register" className="text-orange-600 hover:underline">
                    Register karein
                </Link>
            </p>
        </div>
    )
}