// resources/js/Pages/Auth/ResetPassword.tsx
import { useEffect, useState, useMemo, FormEventHandler } from 'react';
import { Head, useForm, Link } from '@inertiajs/react';

declare function route(name: string, params?: any, absolute?: boolean): string;

// ─── Utilitas Validasi Password ───
interface PasswordCheck {
    label: string;
    test: (password: string) => boolean;
}

const PASSWORD_CHECKS: PasswordCheck[] = [
    { label: 'Minimal 8 karakter', test: (p) => p.length >= 8 },
    { label: 'Huruf besar (A-Z)', test: (p) => /[A-Z]/.test(p) },
    { label: 'Huruf kecil (a-z)', test: (p) => /[a-z]/.test(p) },
    { label: 'Angka (0-9)', test: (p) => /[0-9]/.test(p) },
    { label: 'Simbol (!@#$%^&*)', test: (p) => /[^A-Za-z0-9]/.test(p) },
];

function getStrengthLevel(password: string): { level: number; label: string; color: string; bgColor: string } {
    const passed = PASSWORD_CHECKS.filter((c) => c.test(password)).length;
    if (passed <= 1) return { level: 1, label: 'Sangat Lemah', color: 'bg-red-500', bgColor: 'text-red-500' };
    if (passed === 2) return { level: 2, label: 'Lemah', color: 'bg-orange-500', bgColor: 'text-orange-500' };
    if (passed === 3) return { level: 3, label: 'Sedang', color: 'bg-yellow-500', bgColor: 'text-yellow-500' };
    if (passed === 4) return { level: 4, label: 'Kuat', color: 'bg-blue-500', bgColor: 'text-blue-500' };
    return { level: 5, label: 'Sangat Kuat', color: 'bg-green-500', bgColor: 'text-green-500' };
}

export default function ResetPassword({ token, email }: { token: string; email: string }) {
    // State untuk memicu animasi saat halaman pertama kali dimuat
    const [loaded, setLoaded] = useState(false);
    // Toggle show/hide password
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

    // ─── Validasi Real-time ───
    const strength = useMemo(() => getStrengthLevel(data.password), [data.password]);
    const checksResults = useMemo(
        () => PASSWORD_CHECKS.map((c) => ({ ...c, passed: c.test(data.password) })),
        [data.password]
    );
    const passwordsMatch = data.password !== '' && data.password === data.password_confirmation;
    const confirmTouched = data.password_confirmation.length > 0;
    const passedCount = checksResults.filter((c) => c.passed).length;
    const canSubmit = passedCount >= 2 && passwordsMatch && !processing;

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('password.store'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    // ─── Ikon Mata (Show/Hide Password) ───
    const EyeIcon = ({ show, onClick }: { show: boolean; onClick: () => void }) => (
        <button
            type="button"
            onClick={onClick}
            className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer p-1"
            tabIndex={-1}
            aria-label={show ? 'Sembunyikan password' : 'Tampilkan password'}
        >
            {show ? (
                // Eye-off icon
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
            ) : (
                // Eye icon
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
            )}
        </button>
    );

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
                            {/* Input Email (Hidden/Readonly) */}
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
                                    readOnly
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
                                <div className="relative">
                                    <input 
                                        id="password" 
                                        type={showPassword ? 'text' : 'password'}
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        required 
                                        autoFocus
                                        autoComplete="new-password"
                                        className="w-full border-b-2 border-t-0 border-l-0 border-r-0 border-gray-200 focus:border-red-600 focus:ring-0 px-0 py-3 pr-10 bg-transparent text-gray-900 placeholder-gray-300 transition-colors text-lg"
                                        placeholder="••••••••"
                                    />
                                    
                                    <EyeIcon show={showPassword} onClick={() => setShowPassword(!showPassword)} />
                                </div>
                                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}

                                {/* ─── PASSWORD STRENGTH INDICATOR ─── */}
                                {data.password.length > 0 && (
                                    <div className="mt-4 space-y-3 animate-fadeIn">
                                        {/* Strength Bar */}
                                        <div className="flex items-center gap-3">
                                            <div className="flex gap-1 flex-1">
                                                {[1, 2, 3, 4, 5].map((i) => (
                                                    <div
                                                        key={i}
                                                        className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                                                            i <= strength.level
                                                                ? strength.color
                                                                : 'bg-gray-200'
                                                        }`}
                                                    />
                                                ))}
                                            </div>
                                            <span className={`text-xs font-bold whitespace-nowrap ${strength.bgColor}`}>
                                                {strength.label}
                                            </span>
                                        </div>

                                        {/* Checklist Persyaratan */}
                                        <div className="grid grid-cols-1 gap-1.5">
                                            {checksResults.map((check, idx) => (
                                                <div
                                                    key={idx}
                                                    className={`flex items-center gap-2 text-xs transition-all duration-300 ${
                                                        check.passed ? 'text-green-600' : 'text-gray-400'
                                                    }`}
                                                >
                                                    {check.passed ? (
                                                        <svg className="h-3.5 w-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    ) : (
                                                        <svg className="h-3.5 w-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                            <circle cx="12" cy="12" r="9" />
                                                        </svg>
                                                    )}
                                                    <span>{check.label}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Input Konfirmasi Password */}
                            <div className={`relative group mt-8 transition-all duration-1000 ease-out delay-[600ms] ${
                                loaded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'
                            }`}>
                                <label htmlFor="password_confirmation" className="block text-sm font-bold text-gray-700 mb-1">Konfirmasi Password Baru</label>
                                <div className="relative">
                                    <input 
                                        id="password_confirmation" 
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        value={data.password_confirmation}
                                        onChange={(e) => setData('password_confirmation', e.target.value)}
                                        required 
                                        autoComplete="new-password"
                                        className={`w-full border-b-2 border-t-0 border-l-0 border-r-0 focus:ring-0 px-0 py-3 pr-10 bg-transparent text-gray-900 placeholder-gray-300 transition-colors text-lg ${
                                            confirmTouched
                                                ? passwordsMatch
                                                    ? 'border-green-400 focus:border-green-500'
                                                    : 'border-red-400 focus:border-red-500'
                                                : 'border-gray-200 focus:border-red-600'
                                        }`}
                                        placeholder="••••••••"
                                    />
                                    
                                    <EyeIcon show={showConfirmPassword} onClick={() => setShowConfirmPassword(!showConfirmPassword)} />
                                </div>

                                {/* Feedback cocok / tidak cocok */}
                                {confirmTouched && (
                                    <div className={`flex items-center gap-1.5 mt-2 text-xs font-medium transition-all duration-300 ${
                                        passwordsMatch ? 'text-green-600' : 'text-red-500'
                                    }`}>
                                        {passwordsMatch ? (
                                            <>
                                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                </svg>
                                                Password cocok
                                            </>
                                        ) : (
                                            <>
                                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                                Password tidak cocok
                                            </>
                                        )}
                                    </div>
                                )}
                                {errors.password_confirmation && <p className="text-red-500 text-xs mt-1">{errors.password_confirmation}</p>}
                            </div>

                            {/* Tombol Simpan Password */}
                            <div className={`flex items-center mt-10 transition-all duration-1000 ease-out delay-[700ms] ${
                                loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
                            }`}>
                                <button 
                                    type="submit" 
                                    disabled={!canSubmit}
                                    className={`w-full px-6 py-3.5 text-white rounded-full font-bold shadow-lg transition-all duration-300 text-base flex items-center justify-center gap-2 ${
                                        canSubmit
                                            ? 'bg-[#c70024] hover:bg-[#a3001e] hover:shadow-red-500/30 hover:-translate-y-1'
                                            : 'bg-gray-300 cursor-not-allowed'
                                    }`}
                                >
                                    {/* Loading Spinner */}
                                    {processing && (
                                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                    )}
                                    {processing ? 'Menyimpan...' : 'Simpan Password Baru'}
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