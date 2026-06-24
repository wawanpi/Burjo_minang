import { ReactNode, HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
    children: ReactNode;
    /** dark charcoal variant (reports / score cards) */
    dark?: boolean;
    /** add hover lift + elevated shadow */
    hover?: boolean;
    /** internal padding (default true) */
    padded?: boolean;
}

/** Burjo Minang surface card — soft shadow, 16px radius, optional dark/hover. */
export default function Card({
    children,
    dark = false,
    hover = false,
    padded = true,
    className = "",
    ...props
}: CardProps) {
    const base = dark
        ? "bg-gradient-to-br from-bm-charcoal-800 to-bm-charcoal-900 border border-white/[0.06] text-white"
        : "bg-white border border-black/[0.05]";
    return (
        <div
            className={`
                rounded-2xl shadow-soft transition-all duration-300
                ${base}
                ${padded ? "p-5 lg:p-6" : ""}
                ${hover ? "hover:shadow-elevated hover:-translate-y-1" : ""}
                ${className}
            `}
            {...props}
        >
            {children}
        </div>
    );
}
