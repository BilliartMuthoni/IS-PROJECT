import { useEffect, useState } from 'react'

import { API_URL, apiFetch } from '../api/client.js'

export default function HomePage() {
  const [api, setApi] = useState({ state: 'checking' })

  useEffect(() => {
    apiFetch('/')
      .then(() => setApi({ state: 'up' }))
      .catch((error) => setApi({ state: 'down', message: error.message }))
  }, [])

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6">
      <h1 className="text-xl font-bold text-forest-deep">Admin portal</h1>
      <p className="mt-1 text-sm text-gray-500">Setup complete. Pages will be added here.</p>

      <div className="mt-6 flex items-center gap-2 text-sm">
        <span
          className={`h-2.5 w-2.5 rounded-full ${
            { checking: 'bg-gray-300', up: 'bg-healthy', down: 'bg-attention' }[api.state]
          }`}
        />
        <span>
          Backend at <code className="text-gray-600">{API_URL}</code>:{' '}
          {{ checking: 'checking…', up: 'reachable', down: `unreachable — ${api.message}` }[api.state]}
        </span>
      </div>
    </section>
  )
}
