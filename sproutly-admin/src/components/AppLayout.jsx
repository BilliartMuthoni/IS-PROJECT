import { Outlet } from 'react-router'

export default function AppLayout() {
  return (
    <div className="min-h-screen">
      <header className="bg-forest-deep text-white">
        <div className="mx-auto flex max-w-6xl items-center px-6 py-4">
          <span className="text-lg font-bold">Admin</span>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">
        <Outlet />
      </main>
    </div>
  )
}
