/** Shimmer skeleton block — use instead of plain spinners in data areas. */
export default function Skeleton({ className = "" }: { className?: string }) {
    return <div className={`bm-skeleton ${className}`} />;
}

/** A few stacked skeleton lines, handy for card/table loading states. */
export function SkeletonLines({ rows = 3, className = "" }: { rows?: number; className?: string }) {
    return (
        <div className={`space-y-2.5 ${className}`}>
            {Array.from({ length: rows }).map((_, i) => (
                <Skeleton
                    key={i}
                    className="h-4"
                    // last line shorter for a natural look
                />
            ))}
        </div>
    );
}
