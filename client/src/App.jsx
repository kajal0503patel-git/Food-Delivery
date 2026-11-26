import { Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import Cart from './pages/Cart'
import Home from './pages/Home'
import Login from './pages/Login'
import OrderDetail from './pages/OrderDetail'
import Orders from './pages/Orders'
import Register from './pages/Register'
import Restaurant from './pages/Restaurant'

const customerOnly = (page) => <ProtectedRoute roles={['customer']}>{page}</ProtectedRoute>

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/restaurants/:id" element={<Restaurant />} />
        <Route path="/cart" element={customerOnly(<Cart />)} />
        <Route path="/orders" element={customerOnly(<Orders />)} />
        <Route path="/orders/:id" element={customerOnly(<OrderDetail />)} />
        <Route path="*" element={<p className="p-8 text-center text-gray-500">Page not found</p>} />
      </Routes>
    </>
  )
}