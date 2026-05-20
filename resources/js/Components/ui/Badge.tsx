// src/components/ui/Badge.tsx

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

const variantClasses: Record<BadgeVariant, string> = {
  success : 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  warning : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  danger  : 'bg-red-100   text-red-800   dark:bg-red-900/40   dark:text-red-300',
  info    : 'bg-blue-100  text-blue-800  dark:bg-blue-900/40  dark:text-blue-300',
  neutral : 'bg-gray-100  text-gray-700  dark:bg-gray-800     dark:text-gray-300',
};

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
}

const Badge = ({ label, variant = 'neutral' }: BadgeProps) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variantClasses[variant]}`}>
    {label}
  </span>
);

export default Badge;