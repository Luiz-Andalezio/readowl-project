import React from "react";

interface InputWithIconProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon: React.ReactNode;
  error?: string;
  rightIcon?: React.ReactNode;
  hideErrorText?: boolean;
}

const InputWithIcon: React.FC<InputWithIconProps> = ({ icon, className = "", error, rightIcon, hideErrorText, ...props }) => (
  <div className="relative mb-4">
    <span className="absolute left-3 top-1/2 -translate-y-1/2">{icon}</span>
    <input
      className={`w-full pl-10 pr-4 py-2 bg-white border-2 ${error ? "border-red-400 animate-shake" : "border-none"} focus:ring-2 focus:ring-readowl-purple-light text-readowl-purple placeholder-readowl-purple placeholder-opacity-50  ${className}`}
      {...props}
    />
    {error && !hideErrorText && <span className="text-red-400 text-xs absolute left-0 -bottom-5">{error}</span>}
    {rightIcon && (
      <span className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer select-none">{rightIcon}</span>
    )}
  </div>
);

export default InputWithIcon;