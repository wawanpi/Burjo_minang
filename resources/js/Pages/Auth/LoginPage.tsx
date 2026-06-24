// resources/js/Pages/Auth/LoginPage.tsx
import { useEffect, useState, FormEventHandler } from 'react';
import { Head, useForm, Link } from '@inertiajs/react';

declare function route(name: string, params?: any, absolute?: boolean): string;

export default function LoginPage({ status }: { status?: string }) {
  // State untuk memicu animasi saat halaman pertama kali dimuat
  const [loaded, setLoaded] = useState(false);

  const { data, setData, post, processing, errors, reset } = useForm({
    email: '',
    password: '',
    remember: false,
  });

  useEffect(() => {
    // Aktifkan animasi 50ms setelah render pertama
    const timer = setTimeout(() => setLoaded(true), 50);
    return () => {
      clearTimeout(timer);
      reset('password');
    };
  }, []);

  const submit: FormEventHandler = (e) => {
    e.preventDefault();
    post(route('login'));
  };

  return (
    <>
      <Head title="Masuk Akun - Burjo Minang" />
      
      {/* Override autofill browser */}
      <style>{`
        input:-webkit-autofill,
        input:-webkit-autofill:hover, 
        input:-webkit-autofill:focus, 
        input:-webkit-autofill:active {
            -webkit-box-shadow: 0 0 0 30px white inset !important;
            -webkit-text-fill-color: #1f2937 !important;
            transition: background-color 5000s ease-in-out 0s;
        }
      `}</style>

      <div className="w-full min-h-screen flex flex-col lg:flex-row relative overflow-hidden bg-white">
        
        {/* KOLOM KIRI (Merah Marun dengan SVG Curve) */}
        <div className="relative w-full lg:w-[45%] bg-[#990000] text-white flex flex-col justify-center items-center p-8 lg:p-12 z-10">
            
            {/* Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#b30000] to-[#660000] z-0"></div>

            <div className="relative z-30 flex flex-col items-center text-center mb-16 lg:mb-0 lg:pr-16">
                {/* Animasi Scale pada Logo */}
                <div className={`bg-white rounded-full p-2 mb-6 shadow-xl w-40 h-40 flex items-center justify-center transform hover:scale-105 transition-all duration-1000 ease-out overflow-hidden border-4 border-red-900/10 delay-200 ${
                  loaded ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
                }`}>
                    <img src="/images/logo-burjo.jpg" alt="Logo Burjo Minang" className="w-full h-full object-cover rounded-full" />
                </div>
    
                {/* Animasi Slide Up pada Judul */}
                <h1 className={`text-4xl lg:text-5xl font-extrabold tracking-wider mb-3 drop-shadow-md whitespace-nowrap transition-all duration-1000 ease-out delay-500 ${
                  loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                }`}>
                    BURJO MINANG
                </h1>
                
                {/* Animasi Slide Up pada Subjudul */}
                <p className={`text-base text-yellow-400 font-medium tracking-wide opacity-90 px-4 transition-all duration-1000 ease-out delay-700 ${
                  loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
                }`}>
                    Cita rasa otentik dalam setiap sajian.
                </p>
            </div>

            {/* SVG Curve Desktop (Kanan) */}
            <div className="hidden lg:block absolute top-0 right-[-1px] h-full w-28 z-20 pointer-events-none text-white">
                 <svg viewBox="0 0 100 800" preserveAspectRatio="none" className="h-full w-full fill-current">
                    <path d="M100,0 H0 C20,150 60,250 30,400 C0,550 60,680 20,800 H100 Z"></path>
                </svg>
            </div>
            
            {/* SVG Curve Mobile (Bawah) */}
            <div className="absolute bottom-[-1px] left-0 w-full lg:hidden z-20 leading-[0] text-white">
                <svg viewBox="0 0 1440 320" className="w-full h-auto fill-current">
                    <path d="M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,224C672,245,768,267,864,261.3C960,256,1056,224,1152,208C1248,192,1344,192,1392,192L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
                </svg>
            </div>
        </div>

        {/* KOLOM KANAN (Form Putih) */}
        <div className="w-full lg:w-[55%] bg-white flex flex-col justify-center relative z-0 px-8 sm:px-12 lg:px-24 py-12">
            
            <div className="w-full max-w-md mx-auto">
                {/* Header Form dengan Animasi */}
                <div className={`transition-all duration-1000 ease-out delay-300 ${
                  loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}>
                  <h2 className="text-4xl font-bold text-gray-800 mb-2 text-center lg:text-left">Masuk Akun</h2>
                  <p className="text-gray-400 mb-12 text-sm text-center lg:text-left">Selamat datang kembali! Silakan login data Anda.</p>
                </div>

                {status && (
                  <div className={`mb-4 font-medium text-sm text-green-600 transition-all duration-500 ${
                    loaded ? 'opacity-100' : 'opacity-0'
                  }`}>
                    {status}
                  </div>
                )}

                <form onSubmit={submit} className="space-y-6">
                    {/* Input Email */}
                    <div className={`relative group transition-all duration-1000 ease-out delay-[400ms] ${
                      loaded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'
                    }`}>
                        <label htmlFor="email" className="block text-sm font-bold text-gray-700 mb-1">Email Address</label>
                        <input 
                            id="email" 
                            type="email" 
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            required 
                            autoFocus 
                            className="w-full border-b-2 border-t-0 border-l-0 border-r-0 border-gray-200 focus:border-red-600 focus:ring-0 px-0 py-3 bg-transparent text-gray-900 placeholder-gray-300 transition-colors text-lg"
                            placeholder="nama@email.com"
                        />
                        
                        <div className="absolute right-0 bottom-4 text-red-500 pointer-events-none">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                    </div>

                    {/* Input Password */}
                    <div className={`relative group mt-8 transition-all duration-1000 ease-out delay-[500ms] ${
                      loaded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'
                    }`}>
                        <label htmlFor="password" className="block text-sm font-bold text-gray-700 mb-1">Password</label>
                        <input 
                            id="password" 
                            type="password" 
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            required 
                            autoComplete="current-password"
                            className="w-full border-b-2 border-t-0 border-l-0 border-r-0 border-gray-200 focus:border-red-600 focus:ring-0 px-0 py-3 bg-transparent text-gray-900 placeholder-gray-300 transition-colors text-lg"
                            placeholder="••••••••"
                        />
                        
                        <div className="absolute right-0 bottom-4 text-gray-300 pointer-events-none">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                    </div>

                    {/* Checkbox */}
                    <div className={`flex items-center justify-between mt-8 transition-all duration-1000 ease-out delay-[600ms] ${
                      loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                    }`}>
                        <label className="flex items-center cursor-pointer select-none">
                            <input 
                                id="remember_me" 
                                type="checkbox" 
                                checked={data.remember}
                                onChange={(e) => setData('remember', e.target.checked)}
                                className="rounded border-gray-300 text-red-600 shadow-sm focus:ring-red-500 h-4 w-4 transition-colors" 
                            />
                            <span className="ml-2 text-sm text-gray-500">Ingat saya</span>
                        </label>
                        <div className="text-sm">
                            <span className="text-gray-400">Setuju dengan</span> 
                            <Link href="#" className="text-red-600 font-bold hover:underline ml-1">Ketentuan & Syarat</Link>
                        </div>
                    </div>

                    {/* Tombol Masuk & Daftar */}
                    <div className={`flex items-center gap-4 mt-10 transition-all duration-1000 ease-out delay-[700ms] ${
                      loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
                    }`}>
                        <button 
                            type="submit" 
                            disabled={processing}
                            className="flex-1 px-6 py-3 bg-[#c70024] hover:bg-[#a3001e] text-white rounded-full font-bold shadow-lg hover:shadow-red-500/30 hover:-translate-y-1 transition-all duration-300 text-base disabled:opacity-50 disabled:hover:translate-y-0"
                        >
                            Masuk
                        </button>
                        
                        <Link 
                            href={route('register')} 
                            className="flex-1 px-6 py-3 bg-white border border-gray-200 text-gray-600 rounded-full font-bold text-center shadow-md hover:shadow-lg hover:bg-gray-50 hover:text-gray-900 hover:-translate-y-1 transition-all duration-300 text-base"
                        >
                            Daftar
                        </Link>
                    </div>
                     
                    {/* Lupa Password */}
                    <div className={`mt-8 w-full text-center transition-all duration-1000 ease-out delay-[800ms] ${
                      loaded ? 'opacity-100' : 'opacity-0'
                    }`}>
                        <Link className="text-sm text-gray-400 hover:text-red-600 transition-colors" href={route('password.request')}>
                            Lupa password anda?
                        </Link>
                    </div>
                </form>

                {/* Footer Copy */}
                <div className={`mt-12 text-xs text-gray-400 text-center transition-all duration-1000 delay-1000 ${
                  loaded ? 'opacity-100' : 'opacity-0'
                }`}>
                    &copy; {new Date().getFullYear()} Burjo Minang. All Rights Reserved.
                </div>
            </div>
        </div>
      </div>
    </>
  );
}