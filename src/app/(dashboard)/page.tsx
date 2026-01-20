import Link from 'next/link';

export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          href="/products"
          className="block p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
        >
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Products</h2>
          <p className="text-gray-600">Manage your products and services</p>
        </Link>
        <Link
          href="/kanban"
          className="block p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
        >
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Kanban</h2>
          <p className="text-gray-600">Manage leads with drag-and-drop</p>
        </Link>
      </div>
    </div>
  );
}
