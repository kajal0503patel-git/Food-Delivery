import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getError } from '../services/api'

export default function Register() {
    const { user, register } = useAuth()
    const navigate = useNavigate()
    const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', role: 'customer' })
    const [error, setError] = useState('')
    const [busy, setBusy] = useState(false)

    if (user) return <Navigate to="/" replace />

    const change = (e) => setForm({ ...form, [e.target.name]: e.target.value })

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setBusy(true)
        try {
            await register(form)
            navigate('/')
        } catch (err) {
            setError(getError(err))
        } finally {
            setBusy(false)
        }
    }

    const input = 'w-full rounded-lg border border-gray-300 p-2 outline-none focus:border-orange-500'

    return (
        <div className="mx-auto mt-12 max-w-sm rounded-xl bg-white p-6 shadow">
            <h1 className="mb-4 text-2xl font-bold">Register</h1>

            {error && <p className="mb-3 rounded bg-red-50 p-2 text-sm text-red-600">{error}</p>}

            <form onSubmit={handleSubmit} className="space-y-3">
                <input name="name" placeholder="Name" value={form.name} onChange={change} required className={input} />
                <input name="email" type="email" placeholder="Email" value={form.email} onChange={change} required className={input} />
                <input
                    name="password"
                    type="password"
                    placeholder="Password (at least 6 characters)"
                    value={form.password}
                    onChange={change}
                    minLength={6}
                    required
                    className={input}
                />
                <input name="phone" placeholder="Phone (optional)" value={form.phone} onChange={change} className={input} />
                <select name="role" value={form.role} onChange={change} className={input}>
                    <option value="customer">I'm a customer</option>
                    <option value="owner">I'm a restaurant owner</option>
                </select>
                <button
                    disabled={busy}
                    className="w-full rounded-lg bg-orange-600 p-2 font-medium text-white hover:bg-orange-700 disabled:opacity-60"
                >
                    {busy ? 'Please wait...' : 'Register'}
                </button>
            </form>

            <p className="mt-4 text-center text-sm text-gray-600">
                Already have an account?{' '}
                <Link to="/login" className="text-orange-600 hover:underline">
                    Log in
                </Link>
            </p>
        </div>
    )
}