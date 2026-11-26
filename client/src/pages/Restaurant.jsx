import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import api, { getError } from '../services/api'
import { formatPrice } from '../utils/format'

export default function Restaurant() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { user } = useAuth()
    const { cart, count, addItem, setQuantity, clearCart } = useCart()

    const [restaurant, setRestaurant] = useState(null)
    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [vegOnly, setVegOnly] = useState(false)
    const [message, setMessage] = useState('')
    const [busyId, setBusyId] = useState('')

    useEffect(() => {
        let ignore = false
        Promise.all([api.get(`/restaurants/${id}`), api.get(`/restaurants/${id}/menu`)])
            .then(([r, m]) => {
                if (ignore) return
                setRestaurant(r.data.restaurant)
                setItems(m.data.items)
            })
            .catch((err) => !ignore && setError(getError(err)))
            .finally(() => !ignore && setLoading(false))
        return () => {
            ignore = true
        }
    }, [id])

    if (loading) return <p className="p-8 text-center text-gray-500">Loading...</p>
    if (error) return <p className="m-4 rounded bg-red-50 p-3 text-center text-red-600">{error}</p>

    const isCustomer = user?.role === 'customer'
    const otherRestaurant = cart.restaurant && cart.restaurant._id !== id
    const cartHere = cart.restaurant && cart.restaurant._id === id
    const qtyOf = (itemId) => cart.items.find((i) => i.menuItemId === itemId)?.quantity || 0

    const visible = items.filter((i) => !vegOnly || i.isVeg)
    const groups = visible.reduce((acc, item) => {
        ; (acc[item.category] ||= []).push(item)
        return acc
    }, {})

    const run = async (itemId, action) => {
        setMessage('')
        setBusyId(itemId)
        try {
            await action()
        } catch (err) {
            setMessage(getError(err))
        } finally {
            setBusyId('')
        }
    }

    const handleAdd = (item) => {
        if (!user) return navigate('/login')
        run(item._id, () => addItem(item._id, 1))
    }

    const handleClear = async () => {
        setMessage('')
        try {
            await clearCart()
        } catch (err) {
            setMessage(getError(err))
        }
    }

    return (
        <div className="mx-auto max-w-3xl p-4 pb-24">
            <div className="mb-4 rounded-xl bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                    <h1 className="text-2xl font-bold">{restaurant.name}</h1>
                    <span className={`rounded px-2 py-0.5 text-xs ${restaurant.isOpen ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                        {restaurant.isOpen ? 'Open' : 'Closed'}
                    </span>
                </div>
                <p className="mt-1 text-sm text-gray-500">{restaurant.cuisine.join(', ')}</p>
                <p className="text-sm text-gray-500">{restaurant.address}</p>
                {restaurant.description && <p className="mt-2 text-sm">{restaurant.description}</p>}
                <p className="mt-2 text-sm">{restaurant.avgRating > 0 ? `⭐ ${restaurant.avgRating}` : 'No ratings yet'}</p>
            </div>

            {!restaurant.isOpen && <p className="mb-4 rounded bg-yellow-50 p-3 text-sm text-yellow-700">This restaurant is closed right now, so orders cannot be placed.</p>}

            {otherRestaurant && isCustomer && (
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded bg-yellow-50 p-3 text-sm text-yellow-800">
                    <span>Your cart has items from {cart.restaurant.name}. You can only order from one restaurant at a time.</span>
                    <button onClick={handleClear} className="rounded border border-yellow-600 px-3 py-1 hover:bg-yellow-100">
                        Clear cart
                    </button>
                </div>
            )}

            {message && <p className="mb-4 rounded bg-red-50 p-3 text-sm text-red-600">{message}</p>}

            <label className="mb-4 flex items-center gap-2 text-sm">
                <input type="checkbox" checked={vegOnly} onChange={(e) => setVegOnly(e.target.checked)} />
                Show veg only
            </label>

            {Object.keys(groups).length === 0 && <p className="text-gray-500">No items found on the menu.</p>}

            {Object.entries(groups).map(([category, list]) => (
                <section key={category} className="mb-6">
                    <h2 className="mb-2 text-lg font-semibold">{category}</h2>
                    <div className="space-y-2">
                        {list.map((item) => {
                            const qty = qtyOf(item._id)
                            const canOrder = restaurant.isOpen && item.isAvailable && !otherRestaurant
                            return (
                                <div key={item._id} className="flex items-center justify-between gap-3 rounded-xl bg-white p-3 shadow-sm">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className={`inline-block h-3 w-3 rounded-sm border ${item.isVeg ? 'border-green-600 bg-green-500' : 'border-red-600 bg-red-500'}`} />
                                            <span className="font-medium">{item.name}</span>
                                        </div>
                                        {item.description && <p className="text-sm text-gray-500">{item.description}</p>}
                                        <p className="mt-1 text-sm font-semibold">{formatPrice(item.price)}</p>
                                    </div>

                                    {!item.isAvailable ? (
                                        <span className="text-xs text-gray-500">Not available</span>
                                    ) : user && !isCustomer ? null : qty > 0 && cartHere ? (
                                        <div className="flex items-center gap-2">
                                            <button
                                                disabled={busyId === item._id}
                                                onClick={() => run(item._id, () => setQuantity(item._id, qty - 1))}
                                                className="h-8 w-8 rounded-lg border border-orange-600 text-orange-600 disabled:opacity-50"
                                            >
                                                −
                                            </button>
                                            <span className="w-5 text-center">{qty}</span>
                                            <button
                                                disabled={busyId === item._id}
                                                onClick={() => run(item._id, () => setQuantity(item._id, qty + 1))}
                                                className="h-8 w-8 rounded-lg bg-orange-600 text-white disabled:opacity-50"
                                            >
                                                +
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            disabled={!canOrder || busyId === item._id}
                                            onClick={() => handleAdd(item)}
                                            className="rounded-lg border border-orange-600 px-4 py-1 text-orange-600 hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            Add
                                        </button>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </section>
            ))}

            {isCustomer && cartHere && count > 0 && (
                <Link
                    to="/cart"
                    className="fixed inset-x-4 bottom-4 mx-auto flex max-w-3xl items-center justify-between rounded-xl bg-orange-600 px-4 py-3 text-white shadow-lg"
                >
                    <span>{count === 1 ? '1 item' : `${count} items`}</span>
                    <span className="font-medium">
                        View cart · {formatPrice(cart.totalAmount)}
                    </span>
                </Link>
            )}
        </div>
    )
}