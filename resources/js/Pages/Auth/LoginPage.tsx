// resources/js/Pages/Auth/LoginPage.tsx
import { useEffect, FormEventHandler } from 'react';
import { Head, useForm, Link } from '@inertiajs/react';

declare function route(name: string, params?: any, absolute?: boolean): string;

export default function LoginPage({ status }: { status?: string }) {
  const { data, setData, post, processing, errors, reset } = useForm({
    email: '',
    password: '',
    remember: false,
  });

  useEffect(() => {
    return () => {
      reset('password');
    };
  }, []);

  const submit: FormEventHandler = (e) => {
    e.preventDefault();
    post(route('login'));
  };

  return (
    <div className="min-h-screen flex font-sans bg-white relative">
      <Head title="Masuk Akun - Burjo Minang" />

      {/* KOLOM KIRI (Merah Marun) - Sembunyi di Mobile */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#990000] relative items-center justify-center overflow-hidden">
        {/* Efek Lengkungan (Tanpa SVG yang bikin error) */}
        <div
          className="absolute top-0 bottom-0 right-0 w-16 bg-white"
          style={{ borderTopLeftRadius: '100%', borderBottomLeftRadius: '100%' }}
        ></div>

        <div className="relative z-10 flex flex-col items-center text-center px-12">
          <div className="bg-white rounded-full w-32 h-32 mb-6 flex items-center justify-center shadow-lg text-5xl">
            🍜
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-widest mb-2">BURJO MINANG</h1>
          <p className="text-yellow-400 text-sm tracking-wider font-medium">
            Cita rasa otentik dalam setiap sajian.
          </p>
        </div>
      </div>

      {/* KOLOM KANAN (Form Putih) */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-16 md:px-24 min-h-screen">
        <div className="w-full max-w-md mx-auto">
          <div className="mb-10">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Masuk Akun</h2>
            <p className="text-sm text-gray-500 font-medium">Selamat datang kembali! Silakan login data Anda.</p>
          </div>

          {status && <div className="mb-4 font-medium text-sm text-green-600">{status}</div>}

          <form onSubmit={submit} className="space-y-6">
            {/* Input Email Standar */}
            <div>
              <label className="block text-xs font-bold text-gray-900 mb-1 uppercase">Email Address</label>
              <input
                type="email"
                value={data.email}
                onChange={(e) => setData('email', e.target.value)}
                className="w-full border-0 border-b-2 border-gray-300 focus:border-[#990000] focus:ring-0 px-0 py-2 bg-transparent text-sm transition-colors"
                placeholder="owner@burjominang.com"
                autoFocus
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            {/* Input Password Standar */}
            <div>
              <label className="block text-xs font-bold text-gray-900 mb-1 uppercase">Password</label>
              <input
                type="password"
                value={data.password}
                onChange={(e) => setData('password', e.target.value)}
                className="w-full border-0 border-b-2 border-gray-300 focus:border-[#990000] focus:ring-0 px-0 py-2 bg-transparent text-sm transition-colors"
                placeholder="••••••••"
              />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>

            {/* Checkbox */}
            <div className="flex items-center justify-between mt-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.remember}
                  onChange={(e) => setData('remember', e.target.checked)}
                  className="rounded border-gray-300 text-[#990000] shadow-sm focus:ring-[#990000]"
                />
                <span className="ms-2 text-xs text-gray-500 font-medium">Ingat saya</span>
              </label>

              <span className="text-xs text-gray-400 font-medium">
                Setuju dengan <a href="#" className="font-bold text-[#990000] hover:underline">Ketentuan & Syarat</a>
              </span>
            </div>

            {/* Tombol Masuk & Daftar */}
            <div className="flex flex-col sm:flex-row items-center gap-4 mt-8">
              <button
                type="submit"
                disabled={processing}
                className="w-full sm:w-1/2 bg-[#990000] hover:bg-[#7a0000] text-white font-bold py-3 px-4 rounded-full transition-colors text-center text-sm shadow-md disabled:opacity-50"
              >
                Masuk
              </button>
              <Link
                href={route('register')}
                className="w-full sm:w-1/2 bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 font-bold py-3 px-4 rounded-full transition-colors text-center text-sm flex items-center justify-center"
              >
                Daftar
              </Link>
            </div>

            <div className="mt-6 text-center">
              <a href="#" className="text-xs text-gray-400 hover:text-gray-600 font-medium transition-colors">
                Lupa password anda?
              </a>
            </div>
          </form>
        </div>
      </div>

      {/* Footer Copyright */}
      <div className="absolute bottom-6 w-full text-center pointer-events-none hidden lg:block">
        <p className="text-xs text-gray-400 font-medium ml-[50%]">
          © {new Date().getFullYear()} Burjo Minang. All Rights Reserved.
        </p>
      </div>
    </div>
  );
}