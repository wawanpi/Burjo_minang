import { ReactNode } from "react";

type StatColor = "red" | "gold" | "charcoal" | "teal" | "amber" | "green" | "blue";

const colorMap: Record<StatColor, { icon: string; bar: string }> = {
    red:      { icon: "bg-gradient-to-br from-bm-red-500 to-bm-red-700",       bar: "bg-bm-red-500" },
    gold:     { icon: "bg-gradient-to-br from-bm-gold-400 to-bm-gold-500",     bar: "bg-bm-gold-400" },
    charcoal: { icon: "bg-gradient-to-br from-bm-charcoal-700 to-bm-charcoal-900", bar: "bg-bm-charcoal-700" },
    teal:     { icon: "bg-gradient-to-br from-teal-500 to-teal-700",           bar: "bg-teal-500" },
    // legacy aliases kept so older call-sites don't break
    amber:    { icon: "bg-gradient-to-br from-bm-gold-400 to-bm-gold-500",     bar: "bg-bm-gold-400" },
    green:    { icon: "bg-gradient-to-br from-teal-500 to-teal-700",           bar: "bg-teal-500" },
    blue:     { icon: "bg-gradient-to-br from-bm-charcoal-700 to-bm-charcoal-900", bar: "bg-bm-charcoal-700" },
};

const liveTone: Record<string, string> = {
    success: "text-green-600 bg-green-500",
    gold:    "text-bm-gold-600 bg-bm-gold-400",
    red:     "text-bm-red-600 bg-bm-red-500",
};

export default function StatCard({
    title,
    value,
    icon,
    color = "red",
    subLabel,
    live = false,
    liveColor = "success",
    delay = 0,
}: {
    title: string;
    value: string | number;
    icon: ReactNode;
    color?: StatColor;
    subLabel?: ReactNode;
    /** show pulsing "LIVE" badge top-right */
    live?: boolean;
    liveColor?: "success" | "gold" | "red";
    /** stagger delay in ms for grid entrance */
    delay?: number;
}) {
    const c = colorMap[color] ?? colorMap.red;
    const lt = liveTone[liveColor] ?? liveTone.success;
    const [textTone, dotTone] = lt.split(" ");

    return (
        <div
            className="group relative rounded-2xl bg-white p-5 border border-black/[0.05] shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-elevated opacity-0 animate-page-enter"
            style={{ animationDelay: `${delay}ms` }}
        >
            {live && (
                <span className={`absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-black/[0.03] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${textTone}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${dotTone} animate-pulse`} />
                    Live
                </span>
            )}

            <div className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-soft transition-transform duration-300 group-hover:scale-105 ${c.icon}`}>
                {icon}
            </div>

            <p className="bm-eyebrow">{title}</p>
            <p className="mt-1 font-serif text-[32px] font-bold leading-none text-bm-charcoal-900">{value}</p>
            {subLabel && <p className="mt-2 text-xs text-bm-text-muted">{subLabel}</p>}
        </div>
    );
}
