// src/components/ui/Input.tsx
import { type InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>
      <input
        ref={ref}
        className={`
          w-full px-3 py-2 rounded-lg border text-sm bg-white dark:bg-gray-900
          text-gray-900 dark:text-gray-100 placeholder-gray-400
          focus:outline-none focus:ring-2 focus:ring-bm-gold-400
          transition-colors
          ${error
            ? 'border-red-400 focus:ring-red-400'
            : 'border-gray-300 dark:border-gray-600'}
          ${className}
        `}
        {...props}
      />
      {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
    </div>
  )
);

Input.displayName = 'Input';
export default Input;