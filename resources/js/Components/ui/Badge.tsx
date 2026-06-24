// src/components/ui/Badge.tsx

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'gold';

const variantClasses: Record<BadgeVariant, string> = {
  success : 'bg-green-50  text-green-700  ring-1 ring-green-600/15',
  warning : 'bg-amber-50  text-amber-700  ring-1 ring-amber-600/15',
  danger  : 'bg-bm-red-50 text-bm-red-700 ring-1 ring-bm-red-600/15',
  info    : 'bg-sky-50    text-sky-700    ring-1 ring-sky-600/15',
  neutral : 'bg-gray-100  text-gray-600   ring-1 ring-gray-500/10',
  gold    : 'bg-bm-gold-100 text-bm-charcoal-900 ring-1 ring-bm-gold-500/25',
};

const dotClasses: Record<BadgeVariant, string> = {
  success : 'bg-green-500',
  warning : 'bg-amber-500',
  danger  : 'bg-bm-red-500',
  info    : 'bg-sky-500',
  neutral : 'bg-gray-400',
  gold    : 'bg-bm-gold-500',
};

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  /** show a leading status dot; set `pulse` for a blinking dot (e.g. "Diproses") */
  dot?: boolean;
  pulse?: boolean;
}

const Badge = ({ label, variant = 'neutral', dot = false, pulse = false }: BadgeProps) => (
  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${variantClasses[variant]}`}>
    {dot && (
      <span className="relative flex h-1.5 w-1.5">
        {pulse && <span className={`absolute inline-flex h-full w-full rounded-full opacity-60 animate-ping ${dotClasses[variant]}`} />}
        <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${dotClasses[variant]}`} />
      </span>
    )}
    {label}
  </span>
);

export default Badge;
