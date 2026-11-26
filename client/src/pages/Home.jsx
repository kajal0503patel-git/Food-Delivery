import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api, { getError } from '../services/api'

export default function Home() {
    const [restaurants, setRestaurants] = useState([])
    const [search, setSearch] = useState('')
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    // send the request 400ms after the user stops typing
    useEffect(() => {
        const timer = setTimeout(async () => {
            setLoading(true)
            setError('')
            try {
                const res = await api.get('/restaurants', { params: search.trim() ? { q: search.trim() } : {} })
                setRestaurants(res.data.restaurants)
            } catch (err) {
                setError(getError(err))
            } finally {
                setLoading(false)
            }
        }, 400)
        return () => clearTimeout(timer)
    }, [search])

    return (
        <div className="mx-auto max-w-5xl p-4">
            <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search restaurants by name..."
                className="mb-6 w-full rounded-xl border border-gray-300 bg-white p-3 outline-none focus:border-orange-500"
            />

            {error && <p className="mb-4 rounded bg-red-50 p-3 text-red-600">{error}</p>}
            {loading && <p className="text-gray-500">Loading...</p>}
            {!loading && !error && restaurants.length === 0 && <p className="text-gray-500">No restaurants found.</p>}

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {restaurants.map((r) => (
                    <Link key={r._id} to={`/restaurants/${r._id}`} className="rounded-xl bg-white p-4 shadow-sm transition hover:shadow-md">
                        <div className="flex items-start justify-between gap-2">
                            <h2 className="text-lg font-semibold">{r.name}</h2>
                            <span className={`rounded px-2 py-0.5 text-xs ${r.isOpen ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                                {r.isOpen ? 'Open' : 'Closed'}
                            </span>
                        </div>
                        <p className="mt-1 text-sm text-gray-500">{r.cuisine.join(', ') || 'No cuisine listed'}</p>
                        <p className="text-sm text-gray-500">{r.address}</p>
                        <p className="mt-2 text-sm">{r.avgRating > 0 ? `⭐ ${r.avgRating}` : 'No ratings yet'}</p>
                    </Link>
                ))}
            </div>
        </div>
    )
}