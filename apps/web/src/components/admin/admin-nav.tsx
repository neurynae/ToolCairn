import Link from 'next/link';

const NAV_ITEMS = [
  { href: '/admin/graph', label: 'Graph Mesh', icon: '⬡' },
  { href: '/admin/weights', label: 'Weights', icon: '⚖' },
  { href: '/admin/review', label: 'Review Queue', icon: '✓' },
  { href: '/admin/metrics', label: 'Metrics', icon: '◑' },
  { href: '/admin/indexer', label: 'Indexer', icon: '⟳' },
  { href: '/admin/settings', label: 'Settings', icon: '⚙' },
] as const;

export function AdminNav() {
  return (
    <nav className="flex flex-col gap-1 p-4 w-56 shrink-0 border-r border-gray-200 bg-gray-50 min-h-screen">
      <div className="mb-6 px-2">
        <span className="text-sm font-semibold text-gray-900 tracking-tight">ToolPilot</span>
        <span className="ml-2 text-xs text-gray-400 font-medium uppercase tracking-wider">
          Admin
        </span>
      </div>
      {NAV_ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-100 hover:text-gray-900 transition-colors"
        >
          <span className="text-base leading-none">{item.icon}</span>
          {item.label}
        </Link>
      ))}
      <div className="mt-auto pt-4 border-t border-gray-200">
        <form action="/api/admin/logout" method="POST">
          <button
            type="submit"
            className="w-full text-left px-3 py-2 text-sm text-gray-500 rounded-md hover:bg-gray-100 hover:text-gray-700 transition-colors"
          >
            Sign out
          </button>
        </form>
      </div>
    </nav>
  );
}
