import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
    const { user, logout } = useAuth()

    return (
        <nav className="bg-white shadow-sm">
            <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
                <Link to="/" className="text-xl font-bold text-orange-600">
                    FoodGo
                </Link>

                <div className="flex items-center gap-4 text-sm">
                    {user ? (
                        <>
                            <span className="text-gray-600">
                                {user.name} <span className="rounded bg-orange-100 px-2 py-0.5 text-xs text-orange-700">{user.role}</span>
                            </span>
                            <button onClick={logout} className="rounded-lg border border-gray-300 px-3 py-1 hover:bg-gray-100">
                                Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="hover:text-orange-600">
                                Login
                            </Link>
                            <Link to="/register" className="rounded-lg bg-orange-600 px-3 py-1 text-white hover:bg-orange-700">
                                Register
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    )
}