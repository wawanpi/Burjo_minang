// resources/js/Pages/LandingPage.tsx
import { Head, Link } from '@inertiajs/react';
import { useEffect, useRef, useState, useCallback } from 'react';

// ─── Custom Hook: Intersection Observer for Scroll-Reveal ────────────────────
function useScrollReveal() {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    el.classList.add('is-visible');
                    observer.unobserve(el);
                }
            },
            { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
        );

        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    return ref;
}

// ─── Custom Hook: Navbar Scroll State ────────────────────────────────────────
function useScrolled(threshold = 60) {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > threshold);
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
        return () => window.removeEventListener('scroll', onScroll);
    }, [threshold]);

    return scrolled;
}

// ─── Data ────────────────────────────────────────────────────────────────────
const NAV_LINKS = [
    { label: 'Beranda', href: '#beranda' },
    { label: 'Tentang', href: '#tentang' },
    { label: 'Menu', href: '#menu' },
    { label: 'Kontak', href: '#kontak' },
];

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

const FEATURED_MENUS = [
    {
        name: 'Nasi Padang Komplit',
        desc: 'Nasi putih pulen dengan rendang, ayam pop, gulai nangka, dan sambal hijau khas Minang.',
        price: 'Rp 35.000',
        image: 'https://images.unsplash.com/photo-1600803907087-f56d462fd26b?auto=format&fit=crop&w=600&q=80',
        tag: 'Best Seller',
    },
    {
        name: 'Rendang Sapi',
        desc: 'Daging sapi pilihan yang dimasak rendah dengan rempah khas selama berjam-jam.',
        price: 'Rp 40.000',
        image: 'https://images.unsplash.com/photo-1606491956689-2ea866880049?auto=format&fit=crop&w=600&q=80',
        tag: 'Favorit',
    },
    {
        name: 'Mie Rebus Spesial',
        desc: 'Mie kuning dengan kuah kaldu gurih, telur rebus, sayuran segar, dan kerupuk renyah.',
        price: 'Rp 20.000',
        image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=600&q=80',
        tag: 'Populer',
    },
    {
        name: 'Ayam Bakar Padang',
        desc: 'Ayam kampung dibalur bumbu Padang kental lalu dibakar di atas arang hingga sempurna.',
        price: 'Rp 30.000',
        image: 'https://images.unsplash.com/photo-1632778149955-e80f8ceca2e8?auto=format&fit=crop&w=600&q=80',
        tag: 'Spesial',
    },
    {
        name: 'Es Teh Tarik',
        desc: 'Teh tarik manis dengan busa lembut yang menyegarkan, khas warung kopi Minang.',
        price: 'Rp 8.000',
        image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=600&q=80',
        tag: 'Minuman',
    },
    {
        name: 'Kopi Tubruk',
        desc: 'Kopi hitam pekat dari biji kopi pilihan, diseduh tradisional untuk kenikmatan sejati.',
        price: 'Rp 10.000',
        image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80',
        tag: 'Minuman',
    },
];

// ─── Subcomponents ───────────────────────────────────────────────────────────

/** Ornamental divider */
function Divider({ light = false }: { light?: boolean }) {
    return (
        <div className="flex items-center justify-center gap-3 my-2">
            <span className={`block h-px w-12 ${light ? 'bg-yellow-400/40' : 'bg-[#990000]/30'}`} />
            <span className={`text-lg ${light ? 'text-yellow-400' : 'text-[#990000]'}`}>✦</span>
            <span className={`block h-px w-12 ${light ? 'bg-yellow-400/40' : 'bg-[#990000]/30'}`} />
        </div>
    );
}

/** Navbar */
function Navbar({ scrolled }: { scrolled: boolean }) {
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <nav
            id="navbar"
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-in-out ${
                scrolled
                    ? 'bg-gray-950/75 backdrop-blur-2xl shadow-2xl shadow-black/20 border-b border-white/5'
                    : 'bg-transparent'
            }`}
        >
            <div className="max-w-7xl mx-auto px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    {/* Logo — Premium Typographic */}
                    <a href="#beranda" className="flex items-center gap-3 group">
                        <div className="flex flex-col items-start">
                            <span className="font-serif text-xl sm:text-2xl font-bold text-white tracking-wide leading-none">
                                BURJO MINANG
                            </span>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="block h-px w-5 bg-yellow-400/60" />
                                <span className="text-[9px] sm:text-[10px] tracking-[0.3em] uppercase text-yellow-400 font-medium leading-none">
                                    Cita Rasa Autentik
                                </span>
                                <span className="block h-px w-5 bg-yellow-400/60" />
                            </div>
                        </div>
                    </a>

                    {/* Desktop Links */}
                    <div className="hidden md:flex items-center gap-1">
                        {NAV_LINKS.map((link) => (
                            <a
                                key={link.href}
                                href={link.href}
                                className="px-4 py-2 rounded-full text-sm font-medium tracking-wide text-white/70 hover:text-white hover:bg-white/10 transition-all duration-300"
                            >
                                {link.label}
                            </a>
                        ))}
                        <Link
                            href={route('login')}
                            className="ml-4 px-5 py-2.5 text-white/90 hover:text-white text-sm font-semibold transition-all duration-300 hover:scale-105"
                        >
                            Masuk
                        </Link>
                        <Link
                            href={route('register')}
                            className={`ml-2 px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 hover:scale-105 ${
                                scrolled
                                    ? 'bg-[#990000] text-white hover:bg-[#7a0000] shadow-lg shadow-[#990000]/30'
                                    : 'bg-white/10 text-white border border-white/20 hover:bg-white/20 backdrop-blur-sm'
                            }`}
                        >
                            Daftar
                        </Link>
                    </div>

                    {/* Mobile Hamburger */}
                    <button
                        onClick={() => setMobileOpen(!mobileOpen)}
                        className="md:hidden relative w-10 h-10 flex flex-col items-center justify-center gap-1.5"
                        aria-label="Toggle menu"
                    >
                        <span className={`block w-6 h-0.5 rounded bg-white transition-all duration-300 ${
                            mobileOpen ? 'rotate-45 translate-y-2' : ''
                        }`} />
                        <span className={`block w-6 h-0.5 rounded bg-white transition-all duration-300 ${
                            mobileOpen ? 'opacity-0 scale-0' : ''
                        }`} />
                        <span className={`block w-6 h-0.5 rounded bg-white transition-all duration-300 ${
                            mobileOpen ? '-rotate-45 -translate-y-2' : ''
                        }`} />
                    </button>
                </div>
            </div>

            {/* Mobile Menu Dropdown */}
            <div className={`md:hidden overflow-hidden transition-all duration-400 ease-in-out ${
                mobileOpen ? 'max-h-80 opacity-100' : 'max-h-0 opacity-0'
            }`}>
                <div className="bg-gray-950/90 backdrop-blur-2xl border-t border-white/10 px-6 py-4 space-y-1">
                    {NAV_LINKS.map((link) => (
                        <a
                            key={link.href}
                            href={link.href}
                            onClick={() => setMobileOpen(false)}
                            className="block px-4 py-3 rounded-xl text-white/70 hover:text-white hover:bg-white/10 text-sm font-medium transition-colors"
                        >
                            {link.label}
                        </a>
                    ))}
                    <div className="grid grid-cols-2 gap-3 mt-3">
                        <Link
                            href={route('login')}
                            className="block text-center px-4 py-3 rounded-full border border-white/20 text-white text-sm font-semibold hover:bg-white/10 transition-colors"
                        >
                            Masuk
                        </Link>
                        <Link
                            href={route('register')}
                            className="block text-center px-4 py-3 rounded-full bg-[#990000] text-white text-sm font-semibold hover:bg-[#7a0000] transition-colors"
                        >
                            Daftar
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    );
}

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
            <div className="absolute inset-0 opacity-[0.03]"
                 style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")' }} />

            {/* Hero Content */}
            <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-6">
                {/* Overline */}
                <div className={`transition-all duration-700 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
                    <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-white/20 bg-white/5 backdrop-blur-sm text-white/70 text-xs tracking-[0.3em] uppercase font-medium">
                        <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse" />
                        Restoran & Warung Kopi
                    </span>
                </div>

                {/* Main Headline */}
                <h1 className={`mt-8 font-serif font-bold text-white leading-[0.95] transition-all duration-1000 delay-200 ${
                    loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                }`}>
                    <span className="block text-5xl sm:text-6xl md:text-7xl lg:text-8xl">
                        Burjo
                    </span>
                    <span className="block text-6xl sm:text-7xl md:text-8xl lg:text-9xl text-yellow-400 mt-1">
                        Minang
                    </span>
                </h1>

                {/* Dynamic Subtitle */}
                <div className={`mt-6 h-8 overflow-hidden transition-all duration-1000 delay-500 ${
                    loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
                }`}>
                    <p className="text-white/60 text-base sm:text-lg tracking-widest uppercase font-light transition-all duration-700" key={current}>
                        {HERO_SLIDES[current].title} — {HERO_SLIDES[current].subtitle}
                    </p>
                </div>

                {/* Divider */}
                <div className={`mt-6 transition-all duration-1000 delay-700 ${
                    loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
                }`}>
                    <Divider light />
                </div>

                {/* Tagline */}
                <p className={`mt-4 text-white/50 text-sm sm:text-base max-w-lg font-light leading-relaxed transition-all duration-1000 delay-[900ms] ${
                    loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
                }`}>
                    Nikmati cita rasa masakan Minang yang autentik, disajikan dengan penuh kehangatan dan tradisi.
                </p>

                {/* CTA Buttons */}
                <div className={`mt-10 flex flex-col sm:flex-row gap-4 transition-all duration-1000 delay-[1100ms] ${
                    loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
                }`}>
                    <a
                        href="#menu"
                        className="group px-8 py-4 bg-[#990000] hover:bg-[#7a0000] text-white rounded-full font-semibold text-sm tracking-wide transition-all duration-300 hover:scale-105 shadow-xl shadow-[#990000]/30 flex items-center gap-2"
                    >
                        Lihat Menu
                        <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                    </a>
                    <Link
                        href={route('register')}
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
            <div className="absolute inset-0 opacity-[0.02]"
                 style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #990000 1px, transparent 0)', backgroundSize: '40px 40px' }} />

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
                            <div ref={ref3} className="reveal-scale absolute -top-4 -right-4 lg:-right-6 bg-[#990000] text-white rounded-2xl p-5 shadow-xl shadow-[#990000]/30">
                                <div className="text-3xl font-serif font-bold text-yellow-400">5+</div>
                                <div className="text-xs text-white/80 font-medium mt-0.5">Tahun<br />Pengalaman</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

/** Featured Menu Section */
function MenuSection() {
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
                        Setiap hidangan disiapkan dengan bahan segar dan rempah pilihan,
                        mengikuti resep tradisional Minangkabau.
                    </p>
                </div>

                {/* Menu Grid */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {FEATURED_MENUS.map((item, idx) => (
                        <MenuCard key={item.name} item={item} delay={idx * 100} />
                    ))}
                </div>

                {/* CTA */}
                <div className="text-center mt-16">
                    <Link
                        href={route('login')}
                        className="group inline-flex items-center gap-2 px-8 py-4 bg-[#990000] hover:bg-[#7a0000] text-white rounded-full font-semibold text-sm tracking-wide transition-all duration-300 hover:scale-105 shadow-xl shadow-[#990000]/20"
                    >
                        Lihat Semua Menu
                        <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                    </Link>
                </div>
            </div>
        </section>
    );
}

/** Individual Menu Card */
function MenuCard({ item, delay }: { item: typeof FEATURED_MENUS[0]; delay: number }) {
    const ref = useScrollReveal();

    return (
        <div
            ref={ref}
            className="reveal group"
            style={{ transitionDelay: `${delay}ms` }}
        >
            <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-2xl hover:shadow-[#990000]/10 transition-all duration-500 hover:-translate-y-2">
                {/* Image */}
                <div className="relative aspect-[4/3] overflow-hidden">
                    <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                    />
                    {/* Gradient overlay on hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    {/* Tag Badge */}
                    <span className="absolute top-4 left-4 px-3 py-1.5 bg-[#990000]/90 backdrop-blur-sm text-white text-[10px] font-bold tracking-widest uppercase rounded-full">
                        {item.tag}
                    </span>

                    {/* Price on hover */}
                    <div className="absolute bottom-4 right-4 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-400">
                        <span className="px-4 py-2 bg-white/90 backdrop-blur-sm rounded-full text-[#990000] font-bold text-sm shadow-lg">
                            {item.price}
                        </span>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    <h3 className="font-serif font-bold text-lg text-gray-900 group-hover:text-[#990000] transition-colors duration-300">
                        {item.name}
                    </h3>
                    <p className="mt-2 text-gray-500 text-sm leading-relaxed line-clamp-2">
                        {item.desc}
                    </p>
                    <div className="mt-4 flex items-center justify-between">
                        <span className="text-[#990000] font-bold text-lg">{item.price}</span>
                        <button className="w-9 h-9 rounded-full bg-[#fff0f0] hover:bg-[#990000] text-[#990000] hover:text-white flex items-center justify-center transition-all duration-300 group-hover:scale-110">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

/** Footer */
function Footer() {
    return (
        <footer id="kontak" className="bg-gray-950 text-white relative overflow-hidden">
            {/* Decorative top border */}
            <div className="h-1 bg-gradient-to-r from-[#7a0000] via-[#990000] to-yellow-400" />

            <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16 lg:py-20">
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
                    {/* Brand */}
                    <div className="lg:col-span-1">
                        <div className="mb-6">
                            <span className="font-serif text-2xl font-bold text-white tracking-wide leading-none block">
                                BURJO MINANG
                            </span>
                            <div className="flex items-center gap-2 mt-1.5">
                                <span className="block h-px w-5 bg-yellow-400/60" />
                                <span className="text-[10px] tracking-[0.3em] uppercase text-yellow-400 font-medium leading-none">
                                    Cita Rasa Autentik
                                </span>
                                <span className="block h-px w-5 bg-yellow-400/60" />
                            </div>
                        </div>
                        <p className="text-gray-400 text-sm leading-relaxed">
                            Menyajikan masakan Padang autentik dengan cinta dan tradisi sejak 2020.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="font-semibold text-sm tracking-wider uppercase text-white/90 mb-6">
                            Navigasi
                        </h4>
                        <ul className="space-y-3">
                            {NAV_LINKS.map((link) => (
                                <li key={link.href}>
                                    <a href={link.href} className="text-gray-400 hover:text-yellow-400 text-sm transition-colors duration-300 flex items-center gap-2 group">
                                        <span className="w-1 h-1 bg-[#990000] rounded-full group-hover:bg-yellow-400 transition-colors duration-300" />
                                        {link.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h4 className="font-semibold text-sm tracking-wider uppercase text-white/90 mb-6">
                            Kontak
                        </h4>
                        <ul className="space-y-4 text-sm text-gray-400">
                            <li className="flex items-start gap-3">
                                <svg className="w-5 h-5 text-[#990000] mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                Jl. Raya Padang No. 123,<br />Kota Padang, Sumatera Barat
                            </li>
                            <li className="flex items-center gap-3">
                                <svg className="w-5 h-5 text-[#990000] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                +62 812-3456-7890
                            </li>
                            <li className="flex items-center gap-3">
                                <svg className="w-5 h-5 text-[#990000] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                info@burjominang.com
                            </li>
                        </ul>
                    </div>

                    {/* Hours & Social */}
                    <div>
                        <h4 className="font-semibold text-sm tracking-wider uppercase text-white/90 mb-6">
                            Jam Buka
                        </h4>
                        <ul className="space-y-2 text-sm text-gray-400 mb-8">
                            <li className="flex justify-between">
                                <span>Senin - Jumat</span>
                                <span className="text-white/70 font-medium">08:00 - 22:00</span>
                            </li>
                            <li className="flex justify-between">
                                <span>Sabtu - Minggu</span>
                                <span className="text-white/70 font-medium">07:00 - 23:00</span>
                            </li>
                        </ul>

                        <h4 className="font-semibold text-sm tracking-wider uppercase text-white/90 mb-4">
                            Ikuti Kami
                        </h4>
                        <div className="flex gap-3">
                            {/* Instagram */}
                            <a href="#" className="w-10 h-10 rounded-full bg-white/5 hover:bg-[#990000] border border-white/10 hover:border-[#990000] flex items-center justify-center transition-all duration-300 hover:scale-110 group" aria-label="Instagram">
                                <svg className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" /></svg>
                            </a>
                            {/* Facebook */}
                            <a href="#" className="w-10 h-10 rounded-full bg-white/5 hover:bg-[#990000] border border-white/10 hover:border-[#990000] flex items-center justify-center transition-all duration-300 hover:scale-110 group" aria-label="Facebook">
                                <svg className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                            </a>
                            {/* WhatsApp */}
                            <a href="#" className="w-10 h-10 rounded-full bg-white/5 hover:bg-[#990000] border border-white/10 hover:border-[#990000] flex items-center justify-center transition-all duration-300 hover:scale-110 group" aria-label="WhatsApp">
                                <svg className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                            </a>
                            {/* TikTok */}
                            <a href="#" className="w-10 h-10 rounded-full bg-white/5 hover:bg-[#990000] border border-white/10 hover:border-[#990000] flex items-center justify-center transition-all duration-300 hover:scale-110 group" aria-label="TikTok">
                                <svg className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" /></svg>
                            </a>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="mt-16 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-gray-500 text-sm">
                        © {new Date().getFullYear()} Burjo Minang. All Rights Reserved.
                    </p>
                    <div className="flex gap-6 text-sm text-gray-500">
                        <a href="#" className="hover:text-yellow-400 transition-colors">Kebijakan Privasi</a>
                        <a href="#" className="hover:text-yellow-400 transition-colors">Syarat & Ketentuan</a>
                    </div>
                </div>
            </div>
        </footer>
    );
}

// ─── Main Landing Page Component ─────────────────────────────────────────────
export default function LandingPage() {
    const scrolled = useScrolled(60);

    return (
        <>
            <Head title="Beranda — Burjo Minang | Cita Rasa Autentik Minang" />
            <meta name="description" content="Burjo Minang — Restoran masakan Padang autentik dengan cita rasa terbaik. Nikmati Rendang, Nasi Padang, dan sajian khas Minangkabau." />

            <div className="min-h-screen bg-white font-sans antialiased custom-scrollbar">
                <Navbar scrolled={scrolled} />
                <HeroSection />
                <AboutSection />
                <MenuSection />
                <Footer />
            </div>
        </>
    );
}