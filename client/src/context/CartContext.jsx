import { createContext, useContext, useEffect, useState } from 'react'
import api from '../services/api'
import { useAuth } from './AuthContext'

const CartContext = createContext(null)
const EMPTY = { restaurant: null, items: [], totalAmount: 0 }

export function CartProvider({ children }) {
    const { user } = useAuth()
    const isCustomer = user?.role === 'customer'
    const [cart, setCart] = useState(EMPTY)

    // load the cart from the server when a customer is logged in
    useEffect(() => {
        if (!isCustomer) return
        api
            .get('/cart')
            .then((res) => setCart(res.data.cart))
            .catch(() => { })
    }, [isCustomer])

    const apply = (res) => {
        setCart(res.data.cart)
        return res.data.cart
    }

    // these throw on error; show the message with getError(err) where they are used
    const addItem = (menuItemId, quantity = 1) => api.post('/cart/add', { menuItemId, quantity }).then(apply)
    const setQuantity = (menuItemId, quantity) => api.put('/cart/update', { menuItemId, quantity }).then(apply)
    const removeItem = (menuItemId) => api.delete(`/cart/remove/${menuItemId}`).then(apply)
    const clearCart = () => api.delete('/cart/clear').then(() => setCart(EMPTY))
    const reloadCart = () => api.get('/cart').then(apply)

    // anyone who is not a customer always sees an empty cart
    const current = isCustomer ? cart : EMPTY
    const count = current.items.reduce((sum, i) => sum + i.quantity, 0)

    return (
        <CartContext.Provider value={{
            cart: current, count, addItem, setQuantity, removeItem, clearCart, reloadCart
        }}>
            {children}
        </CartContext.Provider>
    )
}

export const useCart = () => useContext(CartContext)