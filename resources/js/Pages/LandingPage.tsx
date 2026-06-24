// resources/js/Pages/LandingPage.tsx
import { Head, Link } from '@inertiajs/react';
import { useEffect, useState } from 'react';

// ─── Shared Components ───────────────────────────────────────────────────────
import Navbar from '@/Components/Frontend/Navbar';
import Footer from '@/Components/Frontend/Footer';
import Divider from '@/Components/Frontend/Divider';
import useScrollReveal from '@/Components/Frontend/useScrollReveal';

// ─── Types ───────────────────────────────────────────────────────────────────
interface FeaturedMenu {
    id: number;
    nama_menu: string;
    harga: number;
    kategori: string;
    gambar: string | null;
    stok: number;
    reviews_avg_rating: number | null;
    reviews_count: number;
}

interface Props {
    featuredMenus: FeaturedMenu[];
}

// ─── Data ────────────────────────────────────────────────────────────────────
const HERO_SLIDES = [
    {
        image: 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?auto=format&fit=crop&w=1920&q=80',
        title: 'Cita Rasa Autentik',
        subtitle: 'Minang',
    },
    {
        image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1920&q=80',
        title: 'Sajian Terbaik',
        subtitle: 'Nusantara',
    },
    {
        image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1920&q=80',
        title: 'Warisan Kuliner',
        subtitle: 'Padang',
    },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
const formatRupiah = (val: number) =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(val);

// ─── Subcomponents ───────────────────────────────────────────────────────────

/** Hero with auto-sliding background */
function HeroSection() {
    const [current, setCurrent] = useState(0);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        setLoaded(true);
        const interval = setInterval(() => {
            setCurrent((prev) => (prev + 1) % HERO_SLIDES.length);
        }, 6000);
        return () => clearInterval(interval);
    }, []);

    return (
        <section id="beranda" className="relative h-screen w-full overflow-hidden">
            {/* Slide Backgrounds */}
            {HERO_SLIDES.map((slide, i) => (
                <div
                    key={i}
                    className={`absolute inset-0 transition-opacity duration-[1500ms] ease-in-out ${
                        i === current ? 'opacity-100' : 'opacity-0'
                    }`}
                >
                    <img
                        src={slide.image}
                        alt={slide.title}
                        className="w-full h-full object-cover scale-110 transition-transform duration-[8000ms] ease-out"
                        style={{ transform: i === current ? 'scale(1)' : 'scale(1.1)' }}
                    />
                </div>
            ))}

            {/* Dark Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />

            {/* Decorative grain texture */}
            <div
                className="absolute inset-0 opacity-[0.03]"
                style={{
                    backgroundImage:
                        'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")',
                }}
            />

            {/* Hero Content */}
            <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-6">
                {/* Overline */}
                <div
                    className={`transition-all duration-700 ${
                        loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
                    }`}
                >
                    <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-white/20 bg-white/5 backdrop-blur-sm text-white/70 text-xs tracking-[0.3em] uppercase font-medium">
                        <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse" />
                        Restoran &amp; Warung Kopi
                    </span>
                </div>

                {/* Main Headline */}
                <h1
                    className={`mt-8 font-serif font-bold text-white leading-[0.95] transition-all duration-1000 delay-200 ${
                        loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                    }`}
                >
                    <span className="block text-5xl sm:text-6xl md:text-7xl lg:text-8xl">Burjo</span>
                    <span className="block text-6xl sm:text-7xl md:text-8xl lg:text-9xl text-yellow-400 mt-1">
                        Minang
                    </span>
                </h1>

                {/* Dynamic Subtitle */}
                <div
                    className={`mt-6 h-8 overflow-hidden transition-all duration-1000 delay-500 ${
                        loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
                    }`}
                >
                    <p
                        className="text-white/60 text-base sm:text-lg tracking-widest uppercase font-light transition-all duration-700"
                        key={current}
                    >
                        {HERO_SLIDES[current].title} — {HERO_SLIDES[current].subtitle}
                    </p>
                </div>

                {/* Divider */}
                <div
                    className={`mt-6 transition-all duration-1000 delay-700 ${
                        loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
                    }`}
                >
                    <Divider light />
                </div>

                {/* Tagline */}
                <p
                    className={`mt-4 text-white/50 text-sm sm:text-base max-w-lg font-light leading-relaxed transition-all duration-1000 delay-[900ms] ${
                        loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
                    }`}
                >
                    Nikmati cita rasa masakan Minang yang autentik, disajikan dengan penuh kehangatan dan tradisi.
                </p>

                {/* CTA Buttons */}
                <div
                    className={`mt-10 flex flex-col sm:flex-row gap-4 transition-all duration-1000 delay-[1100ms] ${
                        loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
                    }`}
                >
                    <a
                        href="#menu"
                        className="group px-8 py-4 bg-[#990000] hover:bg-[#7a0000] text-white rounded-full font-semibold text-sm tracking-wide transition-all duration-300 hover:scale-105 shadow-xl shadow-[#990000]/30 flex items-center gap-2"
                    >
                        Lihat Menu
                        <svg
                            className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17 8l4 4m0 0l-4 4m4-4H3"
                            />
                        </svg>
                    </a>
                    <Link
                        href={route('login')}
                        className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-full font-semibold text-sm tracking-wide transition-all duration-300 hover:scale-105 backdrop-blur-sm"
                    >
                        Pesan Online
                    </Link>
                </div>
            </div>

            {/* Slide Indicators */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-2">
                {HERO_SLIDES.map((_, i) => (
                    <button
                        key={i}
                        onClick={() => setCurrent(i)}
                        className={`h-1.5 rounded-full transition-all duration-500 ${
                            i === current ? 'w-10 bg-yellow-400' : 'w-4 bg-white/30 hover:bg-white/50'
                        }`}
                        aria-label={`Slide ${i + 1}`}
                    />
                ))}
            </div>

            {/* Bottom Curve */}
            <div className="absolute bottom-0 left-0 right-0">
                <svg viewBox="0 0 1440 80" fill="none" className="w-full">
                    <path d="M0 80h1440V30c-240 35-480 50-720 50S240 65 0 30v50z" fill="#f9fafb" />
                </svg>
            </div>
        </section>
    );
}

/** About / Intro Section */
function AboutSection() {
    const ref1 = useScrollReveal();
    const ref2 = useScrollReveal();
    const ref3 = useScrollReveal();

    return (
        <section id="tentang" className="bg-gray-50 relative overflow-hidden">
            {/* Subtle pattern overlay */}
            <div
                className="absolute inset-0 opacity-[0.02]"
                style={{
                    backgroundImage: 'radial-gradient(circle at 1px 1px, #990000 1px, transparent 0)',
                    backgroundSize: '40px 40px',
                }}
            />

            <div className="max-w-7xl mx-auto px-6 lg:px-8 py-24 lg:py-32">
                <div className="grid lg:grid-cols-2 gap-16 lg:gap-20 items-center">
                    {/* Text Side */}
                    <div ref={ref1} className="reveal-left order-2 lg:order-1">
                        <span className="inline-block text-[#990000] text-xs font-bold tracking-[0.3em] uppercase mb-4">
                            Tentang Kami
                        </span>
                        <Divider />
                        <h2 className="mt-4 font-serif text-4xl sm:text-5xl font-bold text-gray-900 leading-tight">
                            Menghadirkan
                            <span className="block text-[#990000] mt-1">Cita Rasa Minang</span>
                            ke Meja Anda
                        </h2>
                        <p className="mt-6 text-gray-600 leading-relaxed text-base lg:text-lg">
                            Burjo Minang lahir dari kecintaan mendalam terhadap masakan Padang yang kaya rempah.
                            Kami berkomitmen menyajikan hidangan autentik dengan bahan-bahan segar pilihan,
                            dimasak mengikuti resep turun-temurun dari jantung Ranah Minang.
                        </p>
                        <p className="mt-4 text-gray-500 leading-relaxed text-sm lg:text-base">
                            Setiap hidangan adalah perpaduan harmonis antara tradisi dan inovasi — memastikan
                            setiap suapan membawa Anda dalam perjalanan kuliner yang tak terlupakan.
                        </p>

                        {/* Stats */}
                        <div className="mt-10 grid grid-cols-3 gap-6">
                            {[
                                { value: '50+', label: 'Menu Pilihan' },
                                { value: '10K+', label: 'Pelanggan Puas' },
                                { value: '5★', label: 'Rating' },
                            ].map((stat) => (
                                <div key={stat.label} className="text-center lg:text-left">
                                    <div className="text-2xl lg:text-3xl font-serif font-bold text-[#990000]">
                                        {stat.value}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1 font-medium tracking-wide uppercase">
                                        {stat.label}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Image Side — Asymmetric Layout */}
                    <div ref={ref2} className="reveal-right order-1 lg:order-2 relative">
                        <div className="relative">
                            {/* Main image */}
                            <div className="rounded-3xl overflow-hidden shadow-2xl shadow-[#990000]/10 aspect-[4/5]">
                                <img
                                    src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=800&q=80"
                                    alt="Interior restoran Burjo Minang"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            {/* Floating accent image */}
                            <div className="absolute -bottom-8 -left-8 w-40 h-40 lg:w-52 lg:h-52 rounded-2xl overflow-hidden shadow-xl border-4 border-gray-50 animate-float hidden sm:block">
                                <img
                                    src="https://images.unsplash.com/photo-1600803907087-f56d462fd26b?auto=format&fit=crop&w=400&q=80"
                                    alt="Nasi Padang lezat"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            {/* Experience badge */}
                            <div
                                ref={ref3}
                                className="reveal-scale absolute -top-4 -right-4 lg:-right-6 bg-[#990000] text-white rounded-2xl p-5 shadow-xl shadow-[#990000]/30"
                            >
                                <div className="text-3xl font-serif font-bold text-yellow-400">5+</div>
                                <div className="text-xs text-white/80 font-medium mt-0.5">
                                    Tahun
                                    <br />
                                    Pengalaman
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

/** Featured Menu Section — Now driven by database props */
function MenuSection({ menus }: { menus: FeaturedMenu[] }) {
    const headerRef = useScrollReveal();

    return (
        <section id="menu" className="bg-white relative overflow-hidden">
            {/* Top curve */}
            <div className="absolute top-0 left-0 right-0 -translate-y-[1px]">
                <svg viewBox="0 0 1440 60" fill="none" className="w-full">
                    <path d="M0 0h1440v30C1200 0 960-10 720 10 480 30 240 60 0 30V0z" fill="#f9fafb" />
                </svg>
            </div>

            <div className="max-w-7xl mx-auto px-6 lg:px-8 py-24 lg:py-32">
                {/* Header */}
                <div ref={headerRef} className="reveal text-center max-w-2xl mx-auto mb-16">
                    <span className="inline-block text-[#990000] text-xs font-bold tracking-[0.3em] uppercase mb-4">
                        Menu Andalan
                    </span>
                    <Divider />
                    <h2 className="mt-4 font-serif text-4xl sm:text-5xl font-bold text-gray-900 leading-tight">
                        Sajian <span className="text-[#990000]">Terbaik</span> Kami
                    </h2>
                    <p className="mt-4 text-gray-500 text-base lg:text-lg leading-relaxed">
                        Setiap hidangan disiapkan dengan bahan segar dan rempah pilihan, mengikuti resep
                        tradisional Minangkabau.
                    </p>
                </div>

                {/* Menu Grid */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {menus.map((item, idx) => (
                        <MenuCard key={item.id} item={item} delay={idx * 100} />
                    ))}
                </div>

                {/* CTA */}
                <div className="text-center mt-16">
                    <Link
                        href={route('login')}
                        className="group inline-flex items-center gap-2 px-8 py-4 bg-[#990000] hover:bg-[#7a0000] text-white rounded-full font-semibold text-sm tracking-wide transition-all duration-300 hover:scale-105 shadow-xl shadow-[#990000]/20"
                    >
                        Lihat Semua Menu
                        <svg
                            className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17 8l4 4m0 0l-4 4m4-4H3"
                            />
                        </svg>
                    </Link>
                </div>
            </div>
        </section>
    );
}

/** Individual Menu Card — Now uses database fields */
function MenuCard({ item, delay }: { item: FeaturedMenu; delay: number }) {
    const ref = useScrollReveal();

    // Build image URL — database images stored in /storage/, fallback to placeholder
    const imageUrl = item.gambar
        ? `/storage/${item.gambar}`
        : 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80';

    return (
        <div ref={ref} className="reveal group" style={{ transitionDelay: `${delay}ms` }}>
            <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-2xl hover:shadow-[#990000]/10 transition-all duration-500 hover:-translate-y-2">
                {/* Image */}
                <div className="relative aspect-[4/3] overflow-hidden">
                    <img
                        src={imageUrl}
                        alt={item.nama_menu}
                        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                    />
                    {/* Gradient overlay on hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    {/* Tag Badge */}
                    <span className="absolute top-4 left-4 px-3 py-1.5 bg-[#990000]/90 backdrop-blur-sm text-white text-[10px] font-bold tracking-widest uppercase rounded-full">
                        {item.kategori}
                    </span>

                    {/* Rating Badge */}
                    {item.reviews_avg_rating !== null && item.reviews_avg_rating > 0 && (
                        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-2.5 py-1.5 rounded-full text-xs font-bold text-gray-900 shadow-lg flex items-center gap-1">
                            <span className="text-yellow-400">★</span>
                            {Number(item.reviews_avg_rating).toFixed(1)}
                        </div>
                    )}

                    {/* Price on hover */}
                    <div className="absolute bottom-4 right-4 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-400">
                        <span className="px-4 py-2 bg-white/90 backdrop-blur-sm rounded-full text-[#990000] font-bold text-sm shadow-lg">
                            {formatRupiah(item.harga)}
                        </span>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    <h3 className="font-serif font-bold text-lg text-gray-900 group-hover:text-[#990000] transition-colors duration-300">
                        {item.nama_menu}
                    </h3>
                    <div className="mt-4 flex items-center justify-between">
                        <span className="text-[#990000] font-bold text-lg">{formatRupiah(item.harga)}</span>
                        {item.reviews_count > 0 && (
                            <span className="text-xs text-gray-400 font-medium">
                                {item.reviews_count} ulasan
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Main Landing Page Component ─────────────────────────────────────────────
export default function LandingPage({ featuredMenus }: Props) {
    return (
        <>
            <Head title="Beranda — Burjo Minang | Cita Rasa Autentik Minang" />
            <meta
                name="description"
                content="Burjo Minang — Restoran masakan Padang autentik dengan cita rasa terbaik. Nikmati Rendang, Nasi Padang, dan sajian khas Minangkabau."
            />

            <div className="min-h-screen bg-white font-sans antialiased custom-scrollbar">
                <Navbar />
                <HeroSection />
                <AboutSection />
                <MenuSection menus={featuredMenus} />
                <Footer />
            </div>
        </>
    );
}