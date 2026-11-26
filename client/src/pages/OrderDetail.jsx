import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import api, { getError } from '../services/api'
import { formatDate, formatPrice, STATUS_STEPS, statusStyle } from '../utils/format'

export default function OrderDetail() {
    const { id } = useParams()
    const [order, setOrder] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [busy, setBusy] = useState(false)

    const load = useCallback(async () => {
        try {
            const res = await api.get(`/orders/${id}`)
            setOrder(res.data.order)
            setError('')
        } catch (err) {
            setError(getError(err))
        } finally {
            setLoading(false)
        }
    }, [id])

    useEffect(() => {
        load()
    }, [load])

    const cancel = async () => {
        if (!window.confirm('Do you want to cancel this order?')) return
        setBusy(true)
        try {
            const res = await api.put(`/orders/${id}/cancel`)
            setOrder((prev) => ({ ...prev, ...res.data.order }))
            setError('')
        } catch (err) {
            setError(getError(err))
        } finally {
            setBusy(false)
        }
    }

    if (loading) return <p className="p-8 text-center text-gray-500">Loading...</p>
    if (!order) return <p className="m-4 rounded bg-red-50 p-3 text-center text-red-600">{error || 'Order not found'}</p>

    const stepIndex = STATUS_STEPS.indexOf(order.status)
    const ended = order.status === 'Cancelled' || order.status === 'Rejected'

    return (
        <div className="mx-auto max-w-3xl p-4">
            <Link to="/orders" className="text-sm text-orange-600 hover:underline">
                ← All orders
            </Link>

            <div className="mt-2 mb-4 flex items-start justify-between gap-2">
                <div>
                    <h1 className="text-2xl font-bold">{order.restaurant?.name}</h1>
                    <p className="text-sm text-gray-500">{formatDate(order.createdAt)}</p>
                </div>
                <span className={`rounded px-2 py-0.5 text-sm ${statusStyle(order.status)}`}>{order.status}</span>
            </div>

            {error && <p className="mb-4 rounded bg-red-50 p-3 text-sm text-red-600">{error}</p>}

            <div className="mb-4 rounded-xl bg-white p-4 shadow-sm">
                {ended ? (
                    <p className="text-sm text-red-600">This order has been {order.status === 'Cancelled' ? 'cancelled' : 'rejected'}.</p>
                ) : (
                    <ol className="space-y-2">
                        {STATUS_STEPS.map((step, i) => (
                            <li key={step} className="flex items-center gap-3 text-sm">
                                <span
                                    className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${i <= stepIndex ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
                                        }`}
                                >
                                    {i <= stepIndex ? '✓' : i + 1}
                                </span>
                                <span className={i === stepIndex ? 'font-semibold' : i < stepIndex ? '' : 'text-gray-400'}>{step}</span>
                            </li>
                        ))}
                    </ol>
                )}
                <button onClick={load} className="mt-4 text-sm text-orange-600 hover:underline">
                    Refresh status
                </button>
            </div>

            <div className="mb-4 rounded-xl bg-white p-4 shadow-sm">
                {order.items.map((i) => (
                    <div key={i.menuItem} className="flex justify-between py-1 text-sm">
                        <span>
                            {i.name} × {i.quantity}
                        </span>
                        <span>{formatPrice(i.price * i.quantity)}</span>
                    </div>
                ))}
                <div className="mt-2 flex justify-between border-t pt-2 font-semibold">
                    <span>Total</span>
                    <span>{formatPrice(order.totalAmount)}</span>
                </div>
            </div>

            <div className="mb-4 rounded-xl bg-white p-4 text-sm shadow-sm">
                <p>
                    <span className="text-gray-500">Address:</span> {order.deliveryAddress}
                </p>
                <p>
                    <span className="text-gray-500">Payment:</span> {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online'} ({order.paymentStatus})
                </p>
            </div>

            {order.status === 'Placed' && (
                <button
                    onClick={cancel}
                    disabled={busy}
                    className="rounded-lg border border-red-500 px-4 py-2 text-red-600 hover:bg-red-50 disabled:opacity-60"
                >
                    {busy ? 'Please wait...' : 'Cancel order'}
                </button>
            )}
        </div>
    )
}