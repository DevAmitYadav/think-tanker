// by Amit Yadav: Reusable Button component for UI consistency
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  icon?: React.ReactNode;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ variant = 'primary', icon, children, ...props }) => {
  let baseClass = 'btn';
  if (variant === 'primary') baseClass += ' btn-primary';
  if (variant === 'secondary') baseClass += ' btn-secondary';
  if (variant === 'danger') baseClass += ' btn-danger';

  return (
    <button className={baseClass} {...props}>
      {icon && <span>{icon}</span>}
      <span>{children}</span>
    </button>
  );
};

export default Button;
