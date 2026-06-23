// resources/js/Components/Frontend/Divider.tsx
// ─── Ornamental Divider — Shared Component ───────────────────────────────────

/** Ornamental divider with diamond symbol (✦) and horizontal lines */
export default function Divider({ light = false }: { light?: boolean }) {
    return (
        <div className="flex items-center justify-center gap-3 my-2">
            <span className={`block h-px w-12 ${light ? 'bg-yellow-400/40' : 'bg-[#990000]/30'}`} />
            <span className={`text-lg ${light ? 'text-yellow-400' : 'text-[#990000]'}`}>✦</span>
            <span className={`block h-px w-12 ${light ? 'bg-yellow-400/40' : 'bg-[#990000]/30'}`} />
        </div>
    );
}
