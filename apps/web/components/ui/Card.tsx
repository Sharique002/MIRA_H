import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'surface' | 'accent' | 'bordered';
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  className = '',
  ...props
}) => {
  const variantStyles = {
    default: 'bg-white border border-ink/10 shadow-sm',
    surface: 'bg-cream/50 border border-ink/10',
    accent: 'bg-white border-2 border-cyan/40 shadow-md',
    bordered: 'bg-transparent border border-ink/15',
  }[variant];

  return (
    <div className={`rounded-2xl p-6 transition-all ${variantStyles} ${className}`} {...props}>
      {children}
    </div>
  );
};
