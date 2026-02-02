import React, { useState, useId } from 'react';
import { HiEye, HiEyeOff } from 'react-icons/hi';
import { classNames } from '@/lib/utils/helpers';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  showPasswordToggle?: boolean;
  size?: 'sm' | 'md';
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  className,
  id,
  type,
  showPasswordToggle,
  size = 'md',
  ...props
}) => {
  const generatedId = useId();
  const inputId = id || generatedId;
  const isPasswordField = type === 'password' && showPasswordToggle;
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const inputType = isPasswordField ? (isPasswordVisible ? 'text' : 'password') : type;
  const sizeClasses = size === 'sm' ? 'px-3 py-1.5 text-sm' : 'px-4 py-2';

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className={classNames('block font-medium text-[var(--foreground)]', size === 'sm' ? 'mb-0.5 text-xs' : 'mb-1 text-sm')}>
          {label}
        </label>
      )}

      <div className="relative">
        <input
          id={inputId}
          type={inputType}
          className={classNames(
            'w-full border rounded-none focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)] focus:border-transparent transition-colors',
            sizeClasses,
            error ? 'border-[var(--error)] focus:ring-red-500' : 'border-[var(--border)]',
            'bg-[var(--input)] text-[var(--foreground)]',
            isPasswordField ? 'pr-10' : '',
            className
          )}
          {...props}
        />

        {isPasswordField && (
          <button
            type="button"
            onClick={() => setIsPasswordVisible((prev) => !prev)}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
            aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
          >
            {isPasswordVisible ? <HiEyeOff className="h-4 w-4" /> : <HiEye className="h-4 w-4" />}
          </button>
        )}
      </div>

      {error && <p className={classNames('text-[var(--error)]', size === 'sm' ? 'mt-0.5 text-xs' : 'mt-1 text-sm')}>{error}</p>}
      {helperText && !error && (
        <p className={classNames('text-[var(--muted-foreground)]', size === 'sm' ? 'mt-0.5 text-xs' : 'mt-1 text-sm')}>{helperText}</p>
      )}
    </div>
  );
};

