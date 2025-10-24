import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
}

const Button: React.FC<ButtonProps> = ({ children, className, variant = 'primary', ...props }) => {
  const baseStyle = "font-ptserif text-lg font-semibold py-2 px-6 border-2 border-readowl-purple rounded-md transition-colors duration-300";

  const styles = {
  primary: "bg-readowl-purple-light text-white hover:bg-readowl-purple-hover",
  secondary: "bg-readowl-purple-extralight text-readowl-purple hover:bg-white",
  };

  return (
    <button className={`${baseStyle} ${styles[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

export default Button;