import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, getApiError } from '@/lib/api';
import { useAuthStore, type AuthUser } from '@/store/authStore';
import { refreshSocketAuth } from '@/socket/socket';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

const DEMO = [
  { label: 'Admin', email: 'admin@sederp.com', password: 'Admin@123' },
  { label: 'User', email: 'user1@sederp.com', password: 'User@123' },
  { label: 'Technician', email: 'tech1@sederp.com', password: 'Tech@123' },
];

export function Login() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.post<{ data: { user: AuthUser; accessToken: string } }>('/auth/login', { email, password });
      login(res.data.data.user, res.data.data.accessToken);
      refreshSocketAuth();
      navigate('/');
    } catch (err) {
      setError(getApiError(err, 'Invalid email or password'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container flex min-h-[calc(100vh-4rem)] items-center justify-center py-12">
      <Card className="w-full max-w-sm">
        <CardBody className="space-y-5">
          <div>
            <h1 className="text-xl">Sign in to SedERP</h1>
            <p className="mt-1 text-sm text-muted-foreground">Use a demo account below or your credentials.</p>
          </div>
          <form onSubmit={submit} className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Email</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                data-testid="login-email"
                className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Password</label>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                data-testid="login-password"
                className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm"
              />
            </div>
            {error && <p className="text-sm text-danger">{error}</p>}
            <Button type="submit" className="w-full" isLoading={loading} data-testid="login-submit">
              Sign in
            </Button>
          </form>
          <div className="space-y-1 border-t border-border pt-3 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">Demo accounts</p>
            {DEMO.map((d) => (
              <button
                key={d.email}
                type="button"
                onClick={() => { setEmail(d.email); setPassword(d.password); }}
                className="block w-full text-left hover:text-foreground"
              >
                {d.label}: {d.email} · {d.password}
              </button>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
