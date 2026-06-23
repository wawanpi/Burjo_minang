// resources/js/Pages/Auth/ResetPassword.tsx
import { useEffect, useState, FormEventHandler } from 'react';
import { Head, useForm, Link } from '@inertiajs/react';

declare function route(name: string, params?: any, absolute?: boolean): string;

export default function ResetPassword({ token, email }: { token: string; email: string }) {
    // State untuk memicu animasi saat halaman pertama kali dimuat
    const [loaded, setLoaded] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        token: token,
        email: email,
        password: '',
        password_confirmation: '',
    });

    useEffect(() => {
        // Aktifkan animasi 50ms setelah render pertama
        const timer = setTimeout(() => setLoaded(true), 50);
        return () => {
            clearTimeout(timer);
            reset('password', 'password_confirmation');
        };
    }, []);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('password.store'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <>
            <Head title="Reset Password - Burjo Minang" />
            
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
                            <h2 className="text-4xl font-bold text-gray-800 mb-2 text-center lg:text-left">Buat Password Baru</h2>
                            <p className="text-gray-400 mb-12 text-sm text-center lg:text-left">Silakan masukkan password baru untuk akun Anda.</p>
                        </div>

                        <form onSubmit={submit} className="space-y-6">
                            {/* Input Email (Hidden/Readonly, but good practice to show for confirmation) */}
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
                                    readOnly // Usually readonly on reset password pages, but let's follow the standard
                                    className="w-full border-b-2 border-t-0 border-l-0 border-r-0 border-gray-200 focus:border-red-600 focus:ring-0 px-0 py-3 bg-gray-50 text-gray-500 placeholder-gray-300 transition-colors text-lg cursor-not-allowed"
                                />
                                <div className="absolute right-0 bottom-4 text-gray-400 pointer-events-none">
                                     <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                                    </svg>
                                </div>
                                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                            </div>

                            {/* Input Password */}
                            <div className={`relative group mt-8 transition-all duration-1000 ease-out delay-[500ms] ${
                                loaded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'
                            }`}>
                                <label htmlFor="password" className="block text-sm font-bold text-gray-700 mb-1">Password Baru</label>
                                <input 
                                    id="password" 
                                    type="password" 
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    required 
                                    autoFocus
                                    autoComplete="new-password"
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

                            {/* Input Konfirmasi Password */}
                            <div className={`relative group mt-8 transition-all duration-1000 ease-out delay-[600ms] ${
                                loaded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'
                            }`}>
                                <label htmlFor="password_confirmation" className="block text-sm font-bold text-gray-700 mb-1">Konfirmasi Password Baru</label>
                                <input 
                                    id="password_confirmation" 
                                    type="password" 
                                    value={data.password_confirmation}
                                    onChange={(e) => setData('password_confirmation', e.target.value)}
                                    required 
                                    autoComplete="new-password"
                                    className="w-full border-b-2 border-t-0 border-l-0 border-r-0 border-gray-200 focus:border-red-600 focus:ring-0 px-0 py-3 bg-transparent text-gray-900 placeholder-gray-300 transition-colors text-lg"
                                    placeholder="••••••••"
                                />
                                
                                <div className="absolute right-0 bottom-4 text-gray-300 pointer-events-none">
                                     <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                    </svg>
                                </div>
                                {errors.password_confirmation && <p className="text-red-500 text-xs mt-1">{errors.password_confirmation}</p>}
                            </div>

                            {/* Tombol Simpan Password */}
                            <div className={`flex items-center mt-10 transition-all duration-1000 ease-out delay-[700ms] ${
                                loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
                            }`}>
                                <button 
                                    type="submit" 
                                    disabled={processing}
                                    className="w-full px-6 py-3.5 bg-[#c70024] hover:bg-[#a3001e] text-white rounded-full font-bold shadow-lg hover:shadow-red-500/30 hover:-translate-y-1 transition-all duration-300 text-base disabled:opacity-50 disabled:hover:translate-y-0"
                                >
                                    Simpan Password Baru
                                </button>
                            </div>
                             
                            {/* Kembali ke Login */}
                            <div className={`mt-8 w-full text-center transition-all duration-1000 ease-out delay-[800ms] ${
                                loaded ? 'opacity-100' : 'opacity-0'
                            }`}>
                                <Link className="text-sm font-bold text-gray-400 hover:text-red-600 transition-colors flex items-center justify-center gap-1" href={route('login')}>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                    </svg>
                                    Kembali ke Login
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