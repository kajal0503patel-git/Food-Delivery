// 440 -> ₹440
export const formatPrice = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`

export const formatDate = (iso) =>
    new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })

// colour for an order status
export const statusStyle = (status) => {
    if (status === 'Delivered') {
        return 'bg-green-100 text-green-700'
    }
    if (status === 'Cancelled' || status === 'Rejected') {
        return 'bg-red-100 text-red-700'
    }
    if (status === 'Placed') {
        return 'bg-yellow-100 text-yellow-700'
    }
    return 'bg-blue-100 text-blue-700'
}

// steps of the tracking timeline (the normal order path)
export const STATUS_STEPS = ['Placed', 'Accepted', 'Preparing', 'Ready for Pickup', 'Out for Delivery', 'Delivered']