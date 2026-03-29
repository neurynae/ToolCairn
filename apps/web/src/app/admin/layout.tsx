import { AdminNav } from '@/components/admin/admin-nav';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-white">
      <AdminNav />
      <main className="flex-1 overflow-auto p-6">{children}</main>
    </div>
  );
}
