// src/components/ui/Button.tsx
import { type ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'danger' | 'ghost' | 'outline' | 'gold' | 'secondary';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  isLoading?: boolean;
  /** rounded-full pill (default) vs rounded-lg compact (e.g. destructive table actions) */
  pill?: boolean;
}

const variants: Record<Variant, string> = {
  primary  : 'text-white bg-gradient-to-b from-bm-red-500 to-bm-red-600 hover:from-bm-red-600 hover:to-bm-red-700 shadow-soft hover:shadow-elevated hover:-translate-y-0.5',
  gold     : 'text-bm-charcoal-900 bg-bm-gold-400 hover:bg-bm-gold-500 shadow-soft hover:shadow-elevated hover:-translate-y-0.5 font-semibold',
  danger   : 'text-white bg-bm-red-600 hover:bg-bm-red-700 shadow-soft hover:shadow-elevated',
  secondary: 'text-bm-charcoal-800 bg-white border border-gray-200 hover:bg-bm-cream hover:-translate-y-0.5 shadow-soft',
  outline  : 'border border-gray-300 text-bm-charcoal-800 hover:bg-bm-cream hover:border-gray-400',
  ghost    : 'bg-transparent hover:bg-gray-100 text-gray-700',
};

const Button = ({ variant = 'primary', isLoading = false, pill = true, className = '', children, disabled, ...props }: ButtonProps) => (
  <button
    className={`
      inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium
      ${pill ? 'rounded-full' : 'rounded-lg'}
      transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-bm-gold-400/60 focus:ring-offset-1
      disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-soft
      ${variants[variant]} ${className}
    `}
    disabled={disabled || isLoading}
    {...props}
  >
    {isLoading && (
      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
      </svg>
    )}
    {children}
  </button>
);

export default Button;
