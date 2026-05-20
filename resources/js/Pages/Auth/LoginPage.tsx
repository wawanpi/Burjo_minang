// resources/js/Pages/Auth/LoginPage.tsx
import { useForm, Head } from '@inertiajs/react';
import Input from '../../Components/ui/Input';
import Button from '../../Components/ui/Button';

declare function route(name: string, params?: any, absolute?: boolean): string;

interface LoginForm {
  email: string;
  password: string;
  remember: boolean;
}

export default function LoginPage() {
  const { data, setData, post, processing, errors } = useForm<LoginForm>({
    email: '',
    password: '',
    remember: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Inertia POST ke route 'login' di web.php → AuthenticatedSessionController
    post(route('login'));
  };

  return (
    <>
      <Head title="Login — Warmindo Burjo Minang" />

      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
        <div className="w-full max-w-sm">

          {/* Brand */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500 text-white text-2xl mb-4">
              🍜
            </div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Warmindo Burjo Minang
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Masuk ke panel manajemen
            </p>
          </div>

          {/* Card */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email"
                type="email"
                placeholder="owner@warmindo.com"
                value={data.email}
                onChange={(e) => setData('email', e.target.value)}
                error={errors.email}
                autoComplete="email"
                autoFocus
              />

              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                value={data.password}
                onChange={(e) => setData('password', e.target.value)}
                error={errors.password}
                autoComplete="current-password"
              />

              {/* Remember me */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-gray-300 text-amber-500 focus:ring-amber-400"
                  checked={data.remember}
                  onChange={(e) => setData('remember', e.target.checked)}
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Ingat saya
                </span>
              </label>

              <Button
                type="submit"
                className="w-full mt-2"
                isLoading={processing}
              >
                Masuk
              </Button>
            </form>
          </div>

          <p className="text-center text-xs text-gray-400 dark:text-gray-600 mt-6">
            Warmindo Burjo Minang © {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </>
  );
}