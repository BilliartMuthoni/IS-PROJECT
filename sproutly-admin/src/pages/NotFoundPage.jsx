import { Link } from 'react-router'

export default function NotFoundPage() {
  return (
    <section className="py-16 text-center">
      <h1 className="text-xl font-bold text-forest-deep">Page not found</h1>
      <Link to="/" className="mt-3 inline-block text-sm font-semibold text-primary underline">
        Back to home
      </Link>
    </section>
  )
}
