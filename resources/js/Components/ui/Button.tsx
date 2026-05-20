// src/components/ui/Button.tsx
import { type ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'danger' | 'ghost' | 'outline';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  isLoading?: boolean;
}

const variants: Record<Variant, string> = {
  primary : 'bg-amber-500 hover:bg-amber-600 text-white',
  danger  : 'bg-red-500 hover:bg-red-600 text-white',
  ghost   : 'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200',
  outline : 'border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200',
};

const Button = ({ variant = 'primary', isLoading = false, className = '', children, disabled, ...props }: ButtonProps) => (
  <button
    className={`
      inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
      transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-amber-400
      disabled:opacity-50 disabled:cursor-not-allowed
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