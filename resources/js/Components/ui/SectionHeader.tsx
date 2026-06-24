import { ReactNode } from "react";

interface SectionHeaderProps {
    /** small uppercase eyebrow above the title (e.g. "RINGKASAN") */
    eyebrow?: string;
    title: ReactNode;
    subtitle?: ReactNode;
    /** show the decorative diamond (✦) before the title */
    diamond?: boolean;
    /** show short gold underline beneath the title */
    underline?: boolean;
    /** optional content on the right (actions) */
    actions?: ReactNode;
    className?: string;
}

/**
 * Burjo Minang page/section heading — serif title with optional ✦ diamond,
 * gold underline and uppercase eyebrow. Pure presentation.
 */
export default function SectionHeader({
    eyebrow,
    title,
    subtitle,
    diamond = false,
    underline = false,
    actions,
    className = "",
}: SectionHeaderProps) {
    return (
        <div className={`flex flex-wrap items-end justify-between gap-4 ${className}`}>
            <div>
                {eyebrow && <span className="bm-eyebrow block mb-1.5">{eyebrow}</span>}
                <div className="flex items-center gap-2.5">
                    {diamond && <span className="text-bm-gold-500 text-lg leading-none select-none">✦</span>}
                    <h2 className="font-serif font-bold text-bm-charcoal-900 text-2xl lg:text-[28px] leading-tight tracking-tight">
                        {title}
                    </h2>
                </div>
                {underline && <div className="bm-gold-underline mt-3" />}
                {subtitle && <p className="text-sm text-bm-text-muted mt-2">{subtitle}</p>}
            </div>
            {actions && <div className="flex items-center gap-2.5">{actions}</div>}
        </div>
    );
}
