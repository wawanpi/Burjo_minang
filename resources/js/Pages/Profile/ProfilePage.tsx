import React, { useRef, useState, useMemo } from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import CustomerLayout from '@/Layouts/CustomerLayout';
import OwnerLayout from '@/Layouts/OwnerLayout';

// ─── Utilitas Validasi Password ───
interface PasswordCheck { label: string; test: (password: string) => boolean; }
const PASSWORD_CHECKS: PasswordCheck[] = [
    { label: 'Minimal 8 karakter', test: (p) => p.length >= 8 },
    { label: 'Huruf besar (A-Z)', test: (p) => /[A-Z]/.test(p) },
    { label: 'Huruf kecil (a-z)', test: (p) => /[a-z]/.test(p) },
    { label: 'Angka (0-9)', test: (p) => /[0-9]/.test(p) },
    { label: 'Simbol (!@#$%^&*)', test: (p) => /[^A-Za-z0-9]/.test(p) },
];

function getStrengthLevel(password: string) {
    const passed = PASSWORD_CHECKS.filter((c) => c.test(password)).length;
    if (passed <= 1) return { level: 1, label: 'Sangat Lemah', color: 'bg-red-500', bgColor: 'text-red-500' };
    if (passed === 2) return { level: 2, label: 'Lemah', color: 'bg-orange-500', bgColor: 'text-orange-500' };
    if (passed === 3) return { level: 3, label: 'Sedang', color: 'bg-yellow-500', bgColor: 'text-yellow-500' };
    if (passed === 4) return { level: 4, label: 'Kuat', color: 'bg-blue-500', bgColor: 'text-blue-500' };
    return { level: 5, label: 'Sangat Kuat', color: 'bg-green-500', bgColor: 'text-green-500' };
}

const EyeIcon = ({ show, onClick }: { show: boolean; onClick: () => void }) => (
    <button type="button" onClick={onClick} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors" tabIndex={-1}>
        {show ? (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
        ) : (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
        )}
    </button>
);

interface User {
    id: number;
    name: string;
    email: string;
    no_hp: string | null;
    role: 'owner' | 'kasir' | 'pelanggan';
    foto_profil: string | null;
    created_at: string;
}

interface Props {
    status?: string;
    mustVerifyEmail: boolean;
    auth: {
        user: User;
    };
}

export default function ProfilePage({ status, auth }: Props) {
    const user = auth.user;
    const isCustomer = user.role === 'pelanggan';
    
    // Gunakan layout yang sesuai dengan role
    const Layout = isCustomer ? CustomerLayout : OwnerLayout;
    
    // State untuk mode edit (sesuai request)
    const [isEditing, setIsEditing] = useState(false);

    // Ref untuk input file (hidden)
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(
        user.foto_profil ? `/storage/${user.foto_profil}` : null
    );

    const passwordInputRef = useRef<HTMLInputElement>(null);
    const currentPasswordInputRef = useRef<HTMLInputElement>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const { data, setData, post, processing, errors, recentlySuccessful, reset, clearErrors } = useForm({
        _method: 'PATCH',
        name: user.name,
        email: user.email,
        no_hp: user.no_hp || '',
        foto_profil: null as File | null,
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    // Handle pemilihan foto (hanya aktif saat mode edit)
    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 7 * 1024 * 1024) {
                alert('Ukuran foto maksimal adalah 7MB.');
                return;
            }
            if (!file.type.startsWith('image/')) {
                alert('File harus berupa gambar');
                return;
            }

            setData('foto_profil', file);
            
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        reset(); // Kembalikan ke data awal (dari props database)
        clearErrors();
        setPreviewUrl(user.foto_profil ? `/storage/${user.foto_profil}` : null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        
        post(route('profile.update'), {
            preserveScroll: true,
            onSuccess: () => {
                setIsEditing(false);
                if (fileInputRef.current) fileInputRef.current.value = '';
                setData('foto_profil', null);
                reset('current_password', 'password', 'password_confirmation');
            },
            onError: (errors) => {
                if (errors.password) { reset('password', 'password_confirmation'); passwordInputRef.current?.focus(); }
                if (errors.current_password) { reset('current_password'); currentPasswordInputRef.current?.focus(); }
            }
        });
    };

    // Validasi Password Real-time
    const strength = useMemo(() => getStrengthLevel(data.password), [data.password]);
    const checksResults = useMemo(() => PASSWORD_CHECKS.map((c) => ({ ...c, passed: c.test(data.password) })), [data.password]);
    const passwordsMatch = data.password !== '' && data.password === data.password_confirmation;
    const confirmTouched = data.password_confirmation.length > 0;
    
    // Syarat tombol bisa ditekan:
    // 1. Sedang tidak loading request (processing)
    // 2. Jika password DIISI, maka harus memenuhi syarat validasi kustom (passed >= 2) dan cocok.
    // 3. Jika password KOSONG (user hanya edit profil nama/hp), maka boleh submit langsung.
    const isPasswordFilled = data.password.length > 0;
    const passwordIsValid = checksResults.filter(c => c.passed).length >= 2 && passwordsMatch && data.current_password !== '';
    const canSubmit = !processing && (!isPasswordFilled || passwordIsValid);

    // Helper: Konfigurasi badge berdasarkan role
    const getRoleBadgeConfig = () => {
        switch (user.role) {
            case 'owner':
                return { bg: 'bg-[#990000]', text: 'text-white', label: 'Owner', icon: '👑' };
            case 'kasir':
                return { bg: 'bg-blue-600', text: 'text-white', label: 'Kasir', icon: '💻' };
            case 'pelanggan':
                return { bg: 'bg-green-600', text: 'text-white', label: 'Pelanggan', icon: '👤' };
            default:
                return { bg: 'bg-gray-500', text: 'text-white', label: 'User', icon: '❓' };
        }
    };
    
    const roleBadge = getRoleBadgeConfig();

    return (
        <Layout>
            <Head title="Profil Saya" />

            <div className="bg-gray-50 min-h-screen flex flex-col">
                
                {/* Bagian Header/Navbar (Gelap) */}
                <div className="bg-gray-900 pt-32 pb-20 px-4 sm:px-6 lg:px-8">
                    <div className="max-w-4xl mx-auto flex justify-between items-end">
                        <div>
                            <h2 className="text-3xl font-serif font-bold text-white tracking-tight">
                                Profil Saya
                            </h2>
                            <p className="mt-2 text-sm text-gray-400">
                                Kelola informasi profil dan pengaturan akun Anda.
                            </p>
                        </div>
                        
                        {/* Tombol Edit (muncul jika tidak sedang edit) */}
                        {!isEditing && (
                            <button
                                type="button"
                                onClick={() => setIsEditing(true)}
                                className="px-6 py-2.5 bg-red-700 border border-transparent text-white font-semibold rounded-xl hover:bg-red-800 transition-colors shadow-lg shadow-red-700/20 flex items-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                                Edit Profil
                            </button>
                        )}
                    </div>
                </div>

                {/* Konten Utama (Terang) - Naik Sedikit Overlap dengan Header */}
                <main className="flex-1 -mt-10 px-4 sm:px-6 lg:px-8 pb-12 max-w-4xl mx-auto w-full relative z-10">
                    
                    {/* Card Profil Utama (Terang & Bersih) */}
                    <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 relative">
                        
                        {/* Notifikasi Flash Session */}
                        {status && (
                            <div className="bg-green-50 px-8 py-4 border-b border-green-100 flex items-center gap-3 animate-fade-in absolute top-0 left-0 right-0 z-10">
                                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                                    <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <p className="text-sm font-semibold text-green-800">
                                    {status}
                                </p>
                            </div>
                        )}

                        <div className={`p-8 sm:p-10 ${status ? 'pt-20' : ''}`}>
                            
                            <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-10">
                                
                                {/* Kolom Kiri: Foto Profil & Info Basic */}
                                <div className="flex flex-col items-center">
                                    
                                    {/* Avatar Wrapper */}
                                    <div className="relative group mb-6">
                                        <div className={`w-40 h-40 rounded-full overflow-hidden shadow-xl shadow-gray-200 flex items-center justify-center border-4 border-white ${!previewUrl ? 'bg-gradient-to-br from-gray-100 to-gray-200' : ''}`}>
                                            {previewUrl ? (
                                                <img 
                                                    src={previewUrl} 
                                                    alt="Foto Profil" 
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <span className="text-5xl font-bold text-gray-400 uppercase">
                                                    {user.name.charAt(0)}
                                                </span>
                                            )}
                                        </div>
                                        
                                        {/* Overlay Hover (Hanya aktif saat isEditing) */}
                                        {isEditing && (
                                            <button 
                                                type="button"
                                                onClick={() => fileInputRef.current?.click()}
                                                className="absolute inset-0 bg-black/50 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer backdrop-blur-sm"
                                            >
                                                <svg className="w-8 h-8 text-white mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                                <span className="text-xs font-bold text-white tracking-wider uppercase">Ubah Foto</span>
                                            </button>
                                        )}
                                        
                                        {/* Hidden File Input */}
                                        <input 
                                            type="file" 
                                            ref={fileInputRef}
                                            className="hidden" 
                                            accept="image/jpeg,image/png,image/webp"
                                            onChange={handlePhotoChange}
                                            disabled={!isEditing}
                                        />
                                    </div>
                                    
                                    {isEditing && (
                                        <p className="text-xs text-gray-500 font-medium mb-3 text-center">
                                            Format: JPG, PNG. Maksimal 7MB.
                                        </p>
                                    )}
                                    
                                    {errors.foto_profil && (
                                        <p className="text-red-600 text-xs font-bold text-center mb-4 px-4 bg-red-50 py-2 rounded-lg border border-red-100">
                                            {errors.foto_profil}
                                        </p>
                                    )}

                                    {/* Role Badge (Visual Indicator) */}
                                    <div className="w-full text-center">
                                        <span className="text-[10px] uppercase font-bold text-gray-400 tracking-[0.2em] block mb-2">Role Anda</span>
                                        <div className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full shadow-sm ${roleBadge.bg} ${roleBadge.text}`}>
                                            <span className="text-sm">{roleBadge.icon}</span>
                                            <span className="text-xs font-bold tracking-widest uppercase">{roleBadge.label}</span>
                                        </div>
                                    </div>

                                    <div className="mt-8 text-center text-xs text-gray-500 font-medium bg-gray-50 w-full py-4 rounded-2xl border border-gray-100">
                                        Bergabung sejak<br/>
                                        <strong className="text-gray-900 mt-1 block">
                                            {new Date(user.created_at).toLocaleDateString('id-ID', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </strong>
                                    </div>

                                    {/* Conditional rendering berdasarkan role */}
                                    {user.role === 'owner' && (
                                        <div className="mt-4 w-full bg-yellow-50 border border-yellow-200 rounded-2xl p-4 text-center">
                                            <span className="text-[10px] font-bold text-yellow-800 uppercase tracking-wider block mb-1">Owner Privileges</span>
                                            <p className="text-xs text-yellow-700">Anda memiliki akses penuh ke seluruh fitur aplikasi dan laporan.</p>
                                        </div>
                                    )}
                                </div>

                                {/* Kolom Kanan: Form Inputs */}
                                <div className="space-y-8">
                                    <form onSubmit={submit} className="space-y-6">
                                    
                                    {/* Nama */}
                                    <div>
                                        <label htmlFor="name" className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-2">
                                            Nama Lengkap
                                        </label>
                                        <input
                                            id="name"
                                            type="text"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            disabled={!isEditing}
                                            className={`block w-full px-4 py-3.5 rounded-xl font-medium transition-all duration-300 ${
                                                !isEditing
                                                    ? 'bg-transparent border-transparent text-gray-800 pl-0 cursor-default outline-none shadow-none focus:ring-0 focus:border-transparent'
                                                    : `bg-gray-50 text-gray-900 border focus:ring-1 focus:ring-red-700 focus:border-red-700 outline-none ${
                                                        errors.name ? 'border-red-500' : 'border-gray-300'
                                                    }`
                                            }`}
                                            placeholder="Masukkan nama lengkap Anda"
                                        />
                                        {errors.name && (
                                            <p className="mt-2 text-sm font-medium text-red-600">{errors.name}</p>
                                        )}
                                    </div>

                                    {/* Email */}
                                    <div>
                                        <label htmlFor="email" className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-2">
                                            Alamat Email
                                        </label>
                                        <input
                                            id="email"
                                            type="email"
                                            value={data.email}
                                            onChange={(e) => setData('email', e.target.value)}
                                            disabled={!isEditing}
                                            className={`block w-full px-4 py-3.5 rounded-xl font-medium transition-all duration-300 ${
                                                !isEditing
                                                    ? 'bg-transparent border-transparent text-gray-800 pl-0 cursor-default outline-none shadow-none focus:ring-0 focus:border-transparent'
                                                    : `bg-gray-50 text-gray-900 border focus:ring-1 focus:ring-red-700 focus:border-red-700 outline-none ${
                                                        errors.email ? 'border-red-500' : 'border-gray-300'
                                                    }`
                                            }`}
                                            placeholder="email@contoh.com"
                                        />
                                        {errors.email && (
                                            <p className="mt-2 text-sm font-medium text-red-600">{errors.email}</p>
                                        )}
                                    </div>

                                    {/* No HP */}
                                    <div>
                                        <label htmlFor="no_hp" className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-2">
                                            Nomor WhatsApp / HP
                                        </label>
                                        <div className="relative">
                                            <div className={`absolute inset-y-0 left-0 flex items-center pointer-events-none transition-all ${!isEditing ? 'pl-0' : 'pl-4'}`}>
                                                <span className={`font-medium text-sm ${!isEditing ? 'text-gray-800' : 'text-gray-500'}`}>🇮🇩</span>
                                            </div>
                                            <input
                                                id="no_hp"
                                                type="tel"
                                                value={data.no_hp}
                                                onChange={(e) => {
                                                    const val = e.target.value.replace(/[^0-9+]/g, '');
                                                    setData('no_hp', val);
                                                }}
                                                disabled={!isEditing}
                                                className={`block w-full py-3.5 rounded-xl font-medium transition-all duration-300 ${
                                                    !isEditing
                                                        ? 'bg-transparent border-transparent text-gray-800 pl-8 cursor-default outline-none shadow-none focus:ring-0 focus:border-transparent'
                                                        : `bg-gray-50 text-gray-900 border pl-12 pr-4 focus:ring-1 focus:ring-red-700 focus:border-red-700 outline-none ${
                                                            errors.no_hp ? 'border-red-500' : 'border-gray-300'
                                                        }`
                                                }`}
                                                placeholder="0812xxxxxx"
                                                maxLength={15}
                                            />
                                        </div>
                                        {isEditing && (
                                            <p className="mt-2 text-xs text-gray-500">Maksimal 15 karakter angka.</p>
                                        )}
                                        {errors.no_hp && (
                                            <p className="mt-1 text-sm font-medium text-red-600">{errors.no_hp}</p>
                                        )}
                                    </div>

                                    {/* --- PASSWORD FIELDS --- */}
                                    {isEditing && (
                                        <div className="animate-fade-in-up mt-8">
                                            <hr className="border-gray-100 my-8" />
                                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-6">Keamanan Akun (Opsional)</h3>
                                            
                                            <div className="space-y-6">
                                                {/* Current Password */}
                                                <div>
                                                    <label htmlFor="current_password" className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-2">Password Saat Ini</label>
                                                    <input id="current_password" ref={currentPasswordInputRef} type="password" value={data.current_password} onChange={(e) => setData('current_password', e.target.value)} autoComplete="current-password"
                                                        className={`block w-full px-4 py-3.5 rounded-xl font-medium transition-all duration-300 bg-gray-50 text-gray-900 border focus:ring-1 focus:ring-red-700 focus:border-red-700 outline-none ${errors.current_password ? 'border-red-500' : 'border-gray-300'}`} placeholder="••••••••" />
                                                    {errors.current_password && <p className="text-xs font-medium text-red-600 mt-2">{errors.current_password}</p>}
                                                </div>

                                                {/* New Password */}
                                                <div>
                                                    <label htmlFor="password" className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-2">Password Baru <span className="text-gray-400 font-medium normal-case ml-1">(Biarkan kosong jika tidak diubah)</span></label>
                                                    <div className="relative">
                                                        <input id="password" ref={passwordInputRef} type={showPassword ? 'text' : 'password'} value={data.password} onChange={(e) => setData('password', e.target.value)} autoComplete="new-password"
                                                            className={`block w-full px-4 py-3.5 rounded-xl font-medium transition-all duration-300 bg-gray-50 text-gray-900 border focus:ring-1 focus:ring-red-700 focus:border-red-700 outline-none pr-12 ${errors.password ? 'border-red-500' : 'border-gray-300'}`} placeholder="••••••••" />
                                                        <EyeIcon show={showPassword} onClick={() => setShowPassword(!showPassword)} />
                                                    </div>
                                                    {errors.password && <p className="text-xs font-medium text-red-600 mt-2">{errors.password}</p>}

                                                    {data.password.length > 0 && (
                                                        <div className="mt-4 space-y-3">
                                                            <div className="flex items-center gap-3">
                                                                <div className="flex gap-1 flex-1">
                                                                    {[1, 2, 3, 4, 5].map((i) => (<div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i <= strength.level ? strength.color : 'bg-gray-200'}`} />))}
                                                                </div>
                                                                <span className={`text-xs font-bold whitespace-nowrap ${strength.bgColor}`}>{strength.label}</span>
                                                            </div>
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-2">
                                                                {checksResults.map((check, idx) => (
                                                                    <div key={idx} className={`flex items-center gap-1.5 text-xs font-medium transition-all duration-300 ${check.passed ? 'text-green-600' : 'text-gray-400'}`}>
                                                                        {check.passed ? ( <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg> ) : ( <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="9" /></svg> )}
                                                                        <span>{check.label}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Confirm Password */}
                                                <div>
                                                    <label htmlFor="password_confirmation" className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-2">Konfirmasi Password Baru</label>
                                                    <div className="relative">
                                                        <input id="password_confirmation" type={showConfirmPassword ? 'text' : 'password'} value={data.password_confirmation} onChange={(e) => setData('password_confirmation', e.target.value)} autoComplete="new-password"
                                                            className={`block w-full px-4 py-3.5 rounded-xl font-medium transition-all duration-300 bg-gray-50 text-gray-900 border focus:ring-1 outline-none pr-12 ${confirmTouched ? passwordsMatch ? 'border-green-400 focus:ring-green-500 focus:border-green-500' : 'border-red-400 focus:ring-red-500 focus:border-red-500' : errors.password_confirmation ? 'border-red-500 focus:ring-red-700 focus:border-red-700' : 'border-gray-300 focus:ring-red-700 focus:border-red-700'}`} placeholder="••••••••" />
                                                        <EyeIcon show={showConfirmPassword} onClick={() => setShowConfirmPassword(!showConfirmPassword)} />
                                                    </div>
                                                    
                                                    {confirmTouched && (
                                                        <div className={`flex items-center gap-1.5 mt-2 text-xs font-medium ${passwordsMatch ? 'text-green-600' : 'text-red-500'}`}>
                                                            {passwordsMatch ? ( <><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg> Password cocok</> ) : ( <><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg> Password tidak cocok</> )}
                                                        </div>
                                                    )}
                                                    {errors.password_confirmation && <p className="text-xs font-medium text-red-600 mt-2">{errors.password_confirmation}</p>}
                                                </div>
                                            </div>

                                            <hr className="border-gray-100 my-8" />
                                            
                                            <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-2">
                                                <button
                                                    type="button"
                                                    onClick={handleCancel}
                                                    disabled={processing}
                                                    className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-gray-200 text-gray-800 font-bold hover:bg-gray-300 transition-colors duration-300"
                                                >
                                                    Batal
                                                </button>
                                                
                                                <button
                                                    type="submit"
                                                    disabled={!canSubmit}
                                                    className={`w-full sm:w-auto px-8 py-3.5 rounded-xl text-white font-bold tracking-wide transition-colors duration-300 shadow-lg flex items-center justify-center gap-2 ${
                                                        canSubmit 
                                                            ? 'bg-red-700 hover:bg-red-800 shadow-red-700/30'
                                                            : 'bg-gray-400 cursor-not-allowed shadow-none'
                                                    }`}
                                                >
                                                    {processing && (
                                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                        </svg>
                                                    )}
                                                    {processing ? 'Menyimpan...' : 'Simpan Perubahan'}
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                </main>
            </div>
        </Layout>
    );
}
