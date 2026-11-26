import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import api, { getError } from '../services/api'
import { formatPrice } from '../utils/format'

export default function Cart() {
    const navigate = useNavigate()
    const { cart, setQuantity, removeItem, clearCart, reloadCart } = useCart()
    const [address, setAddress] = useState('')
    const [paymentMethod, setPaymentMethod] = useState('cod')
    const [error, setError] = useState('')
    const [busy, setBusy] = useState(false)

    if (cart.items.length === 0) {
        return (
            <div className="mx-auto mt-16 max-w-md p-4 text-center">
                <p className="mb-4 text-gray-500">Your cart is empty.</p>
                <Link to="/" className="rounded-lg bg-orange-600 px-4 py-2 text-white hover:bg-orange-700">
                    Browse restaurants
                </Link>
            </div>
        )
    }

    const hasUnavailable = cart.items.some((i) => !i.isAvailable)

    const run = async (action) => {
        setError('')
        try {
            await action()
        } catch (err) {
            setError(getError(err))
        }
    }

    const placeOrder = async () => {
        setError('')
        if (address.trim().length < 10) return setError('Please enter your full delivery address (at least 10 characters)')
        if (hasUnavailable) return setError('Some items in your cart are not available right now. Please remove them')

        setBusy(true)
        try {
            const res = await api.post('/orders', { deliveryAddress: address.trim(), paymentMethod })
            await reloadCart().catch(() => { })
            navigate(`/orders/${res.data.order._id}`)
        } catch (err) {
            setError(getError(err))
        } finally {
            setBusy(false)
        }
    }

    return (
        <div className="mx-auto max-w-3xl p-4">
            <div className="mb-4 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Your cart</h1>
                    <p className="text-sm text-gray-500">{cart.restaurant?.name}</p>
                </div>
                <button onClick={() => run(clearCart)} className="text-sm text-red-600 hover:underline">
                    Clear cart
                </button>
            </div>

            {error && <p className="mb-4 rounded bg-red-50 p-3 text-sm text-red-600">{error}</p>}

            <div className="mb-4 space-y-2">
                {cart.items.map((item) => (
                    <div key={item.menuItemId} className="flex items-center justify-between gap-3 rounded-xl bg-white p-3 shadow-sm">
                        <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-sm text-gray-500">{formatPrice(item.price)} each</p>
                            {!item.isAvailable && <p className="text-xs text-red-600">Not available right now</p>}
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => run(() => setQuantity(item.menuItemId, item.quantity - 1))}
                                    className="h-8 w-8 rounded-lg border border-orange-600 text-orange-600"
                                >
                                    −
                                </button>
                                <span className="w-5 text-center">{item.quantity}</span>
                                <button
                                    onClick={() => run(() => setQuantity(item.menuItemId, item.quantity + 1))}
                                    className="h-8 w-8 rounded-lg bg-orange-600 text-white"
                                >
                                    +
                                </button>
                            </div>
                            <span className="w-16 text-right font-medium">{formatPrice(item.subtotal)}</span>
                            <button onClick={() => run(() => removeItem(item.menuItemId))} className="text-sm text-red-600 hover:underline">
                                Remove
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mb-4 rounded-xl bg-white p-4 shadow-sm">
                <label className="mb-1 block text-sm font-medium">Delivery address</label>
                <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    rows={3}
                    placeholder="House number, area, city..."
                    className="w-full rounded-lg border border-gray-300 p-2 outline-none focus:border-orange-500"
                />

                <p className="mb-1 mt-4 text-sm font-medium">Payment</p>
                <label className="mb-1 flex items-center gap-2 text-sm">
                    <input type="radio" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} />
                    Cash on Delivery
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-400">
                    <input type="radio" disabled />
                    Online payment (coming soon)
                </label>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm">
                <div>
                    <p className="text-sm text-gray-500">Total</p>
                    <p className="text-xl font-bold">{formatPrice(cart.totalAmount)}</p>
                </div>
                <button
                    onClick={placeOrder}
                    disabled={busy}
                    className="rounded-lg bg-orange-600 px-6 py-2 font-medium text-white hover:bg-orange-700 disabled:opacity-60"
                >
                    {busy ? 'Please wait...' : 'Place order'}
                </button>
            </div>
        </div>
    )
}