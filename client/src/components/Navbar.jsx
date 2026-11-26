import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'

export default function Navbar() {
    const { user, logout } = useAuth()
    const { count } = useCart()

    return (
        <nav className="bg-white shadow-sm">
            <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
                <Link to="/" className="text-xl font-bold text-orange-600">
                    FoodGo
                </Link>

                <div className="flex items-center gap-4 text-sm">
                    {user?.role === 'customer' && (
                        <>
                            <Link to="/orders" className="hover:text-orange-600">
                                My Orders
                            </Link>
                            <Link to="/cart" className="relative hover:text-orange-600">
                                Cart
                                {count > 0 && (
                                    <span className="absolute -right-4 -top-2 rounded-full bg-orange-600 px-1.5 text-xs text-white">{count}</span>
                                )}
                            </Link>
                        </>
                    )}

                    {user ? (
                        <>
                            <span className="hidden text-gray-600 sm:inline">
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