import React from "react";

const GoogleButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ ...props }) => (
  <button
    type="button"
    className="w-full flex items-center justify-center gap-2 bg-white text-readowl-purple font-semibold py-2 px-4 border border-gray-300 rounded-md hover:bg-gray-100 transition mb-3"
    {...props}
  >
    {/* Google SVG icon */}
    <svg width="20" height="20" viewBox="0 0 48 48">
      <g>
        <path fill="#4285F4" d="M43.6 20.5h-1.9V20H24v8h11.3c-1.6 4.3-5.7 7-11.3 7-6.6 0-12-5.4-12-12s5.4-12 12-12c2.4 0 4.7.7 6.6 2l6.2-6.2C34.1 5.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.7-8 19.7-20 0-1.3-.1-2.2-.1-3.5z" />
        <path fill="#34A853" d="M6.3 14.7l6.6 4.8C14.5 16.1 18.8 13 24 13c2.4 0 4.7.7 6.6 2l6.2-6.2C34.1 5.5 29.3 4 24 4c-7.1 0-13.2 3.7-16.7 9.3z" />
        <path fill="#FBBC05" d="M24 44c5.3 0 10.1-1.7 13.8-4.7l-6.4-5.2c-2 1.4-4.6 2.2-7.4 2.2-5.6 0-10.3-3.7-12-8.7l-6.6 5.1C7.9 40.3 15.4 44 24 44z" />
        <path fill="#EA4335" d="M43.6 20.5h-1.9V20H24v8h11.3c-1.1 3-3.6 5.2-6.6 6.2l6.4 5.2C39.7 37.3 44 32.2 44 24c0-1.3-.1-2.2-.4-3.5z" />
      </g>
    </svg>
    Entrar com Google
  </button>
);

export default GoogleButton;