// filepath: src/components/ui/Button.tsx
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
}

const Button: React.FC<ButtonProps> = ({ children, className, variant = 'primary', ...props }) => {
  const baseStyle = "font-semibold py-2 px-6 rounded-full border-2 transition-colors duration-300";

  const styles = {
    primary: "bg-readowl-purple-light text-white font-semibold py-2 px-6 rounded-full border-3 border-readowl-purple hover:bg-readowl-purple transition-colors duration-300",
    secondary: "bg-readowl-purple-extralight text-readowl-purple font-semibold py-2 px-6 rounded-full border-3 border-readowl-purple hover:bg-readowl-purple hover:text-white transition-colors duration-300",
  };

  return (
    <button className={`${baseStyle} ${styles[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

export default Button;