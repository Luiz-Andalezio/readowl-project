import React from "react";

interface InputWithIconProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon: React.ReactNode;
}

const InputWithIcon: React.FC<InputWithIconProps> = ({ icon, className = "", ...props }) => (
  <div className="relative mb-4">
    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">{icon}</span>
    <input
      className={`w-full pl-10 pr-4 py-2 rounded-full bg-white border-none focus:ring-2 focus:ring-readowl-purple-light text-readowl-purple placeholder-gray-400 ${className}`}
      {...props}
    />
  </div>
);

export default InputWithIcon;