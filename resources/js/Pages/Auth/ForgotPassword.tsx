// resources/js/Pages/Auth/ForgotPassword.tsx
import { useEffect, useState, FormEventHandler } from 'react';
import { Head, useForm, Link } from '@inertiajs/react';

declare function route(name: string, params?: any, absolute?: boolean): string;

export default function ForgotPassword({ status }: { status?: string }) {
    const [loaded, setLoaded] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [emailError, setEmailError] = useState('');

    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    useEffect(() => {
        const timer = setTimeout(() => setLoaded(true), 50);
        return () => clearTimeout(timer);
    }, []);

    // Validasi format email di sisi client
    const validateEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email) {
            setEmailError('Email wajib diisi.');
            return false;
        }
        if (!emailRegex.test(email)) {
            setEmailError('Format email tidak valid.');
            return false;
        }
        setEmailError('');
        return true;
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        // Validasi client-side sebelum kirim ke server
        if (!validateEmail(data.email)) return;

        post(route('password.email'), {
            onSuccess: () => {
                setSubmitted(true); // Cegah double-submit
            },
        });
    };

    return (
        <>
            <Head title="Lupa Password - Burjo Minang" />
            
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
                            <h2 className="text-4xl font-bold text-gray-800 mb-4 text-center lg:text-left">Lupa Password?</h2>
                            <p className="text-gray-500 mb-8 text-sm leading-relaxed text-center lg:text-left">
                                Tidak masalah. Cukup beri tahu kami alamat email Anda dan kami akan mengirimkan tautan untuk mereset password agar Anda dapat membuat yang baru.
                            </p>
                        </div>

                        {/* Status Message (Pesan sukses kirim email) */}
                        {status && (
                            <div className={`mb-6 p-4 rounded-lg bg-green-50 border border-green-200 transition-all duration-500 ${
                                loaded ? 'opacity-100' : 'opacity-0'
                            }`}>
                                <div className="flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span className="text-sm font-bold text-green-600">{status}</span>
                                </div>
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
                                    name="email"
                                    value={data.email}
                                    onChange={(e) => {
                                        setData('email', e.target.value);
                                        if (emailError) validateEmail(e.target.value);
                                    }}
                                    required 
                                    autoFocus 
                                    disabled={submitted}
                                    className={`w-full border-b-2 border-t-0 border-l-0 border-r-0 border-gray-200 focus:border-red-600 focus:ring-0 px-0 py-3 bg-transparent text-gray-900 placeholder-gray-300 transition-colors text-lg ${
                                        submitted ? 'cursor-not-allowed opacity-60' : ''
                                    }`}
                                    placeholder="nama@email.com"
                                />
                                
                                <div className="absolute right-0 bottom-4 text-red-500 pointer-events-none">
                                     <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                {/* Tampilkan error validasi client-side ATAU server-side */}
                                {(emailError || errors.email) && (
                                    <div className="mt-2 p-2.5 rounded-md bg-red-50 border border-red-200 flex items-start gap-2 animate-fadeIn">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                        <p className="text-red-600 text-xs font-medium leading-tight">
                                            {emailError || errors.email}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Tombol Submit */}
                            <div className={`flex items-center gap-4 mt-10 transition-all duration-1000 ease-out delay-[500ms] ${
                                loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
                            }`}>
                                <button 
                                    type="submit" 
                                    disabled={processing || submitted}
                                    className="w-full px-6 py-3.5 bg-[#c70024] hover:bg-[#a3001e] text-white rounded-full font-bold shadow-lg hover:shadow-red-500/30 hover:-translate-y-1 transition-all duration-300 text-base disabled:opacity-50 disabled:hover:translate-y-0 flex items-center justify-center gap-2"
                                >
                                    {/* Loading Spinner */}
                                    {processing && (
                                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                    )}
                                    {submitted ? '✓ Link Terkirim' : processing ? 'Mengirim...' : 'Kirim Link Reset Password'}
                                </button>
                            </div>
                             
                            {/* Kembali ke Login */}
                            <div className={`mt-8 w-full text-center transition-all duration-1000 ease-out delay-[600ms] ${
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