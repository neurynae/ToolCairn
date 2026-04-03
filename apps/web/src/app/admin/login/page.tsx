import { Suspense } from 'react';
import { LoginForm } from '@/components/admin/login-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-sm">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2 mb-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground text-xs font-bold">
              TC
            </div>
            <span className="font-semibold">ToolCairn</span>
          </div>
          <CardTitle className="text-xl">Admin sign in</CardTitle>
          <CardDescription>Enter your passphrase to access the dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense>
            <LoginForm />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
