import { NavLink, useNavigate } from 'react-router-dom';
import { Activity, LogOut, Wrench } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/cn';

const LINKS = [
  { to: '/iot', label: 'SedIoT', icon: Activity },
  { to: '/service', label: 'SedService', icon: Wrench },
];

/** Persistent top nav so users can switch modules from anywhere. */
export function TopNav() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center gap-6">
        <NavLink to="/" data-testid="nav-home" className="text-xl font-bold tracking-tight">
          Sed<span className="text-brand-500">ERP</span>
        </NavLink>
        <nav className="flex items-center gap-1">
          {LINKS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              data-testid={`nav-${to.replace('/', '')}`}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive ? 'bg-brand-500/15 text-brand-500' : 'text-muted-foreground hover:bg-surface-2 hover:text-foreground',
                )
              }
            >
              <Icon className="size-4" /> {label}
            </NavLink>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          {user ? (
            <>
              <span className="hidden text-sm text-muted-foreground sm:inline">
                {user.name} · <span className="capitalize">{user.role}</span>
              </span>
              <button
                data-testid="logout"
                onClick={() => { logout(); navigate('/login'); }}
                className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-surface-2"
              >
                <LogOut className="size-4" /> Logout
              </button>
            </>
          ) : (
            <NavLink to="/login" data-testid="nav-signin" className="rounded-lg bg-brand-gradient px-4 py-1.5 text-sm font-medium text-white">
              Sign in
            </NavLink>
          )}
        </div>
      </div>
    </header>
  );
}
