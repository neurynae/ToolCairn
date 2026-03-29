import { Suspense } from 'react';
import { LoginForm } from '@/components/admin/login-form';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 w-full max-w-sm">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-gray-900">ToolPilot Admin</h1>
          <p className="text-sm text-gray-500 mt-1">Sign in to access the dashboard</p>
        </div>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
