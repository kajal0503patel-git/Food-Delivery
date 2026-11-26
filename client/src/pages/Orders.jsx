import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api, { getError } from '../services/api'
import { formatDate, formatPrice, statusStyle } from '../utils/format'

export default function Orders() {
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        api
            .get('/orders')
            .then((res) => setOrders(res.data.orders))
            .catch((err) => setError(getError(err)))
            .finally(() => setLoading(false))
    }, [])

    return (
        <div className="mx-auto max-w-3xl p-4">
            <h1 className="mb-4 text-2xl font-bold">My orders</h1>

            {error && <p className="mb-4 rounded bg-red-50 p-3 text-red-600">{error}</p>}
            {loading && <p className="text-gray-500">Loading...</p>}
            {!loading && !error && orders.length === 0 && (
                <p className="text-gray-500">
                    You have no orders yet.{' '}
                    <Link to="/" className="text-orange-600 hover:underline">
                        Order food
                    </Link>
                </p>
            )}

            <div className="space-y-3">
                {orders.map((o) => (
                    <Link key={o._id} to={`/orders/${o._id}`} className="block rounded-xl bg-white p-4 shadow-sm transition hover:shadow-md">
                        <div className="flex items-start justify-between gap-2">
                            <h2 className="font-semibold">{o.restaurant?.name || 'Restaurant'}</h2>
                            <span className={`rounded px-2 py-0.5 text-xs ${statusStyle(o.status)}`}>{o.status}</span>
                        </div>
                        <p className="mt-1 text-sm text-gray-500">{o.items.map((i) => `${i.name} × ${i.quantity}`).join(', ')}</p>
                        <div className="mt-2 flex justify-between text-sm">
                            <span className="text-gray-500">{formatDate(o.createdAt)}</span>
                            <span className="font-medium">{formatPrice(o.totalAmount)}</span>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    )
}