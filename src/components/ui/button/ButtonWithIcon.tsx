import React from 'react';
import Image from 'next/image';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
    variant?: 'primary' | 'secondary';
    iconUrl?: string;
    iconAlt?: string;
}

const ButtonWithIcon: React.FC<ButtonProps> = ({
    children,
    className,
    variant = 'primary',
    iconUrl,
    iconAlt = 'Ícone',
    ...props
}) => {
    const baseStyle = "font-yusei text-lg font-semibold py-2 px-6 border-2 border-readowl-purple rounded-md shadow-md transition-colors duration-300 flex items-center justify-between gap-2";

    const styles = {
        primary: "bg-readowl-purple-light text-white hover:bg-readowl-purple-hover",
        secondary: "bg-readowl-purple-extralight text-readowl-purple hover:bg-white"
    } as const;

    return (
        <button className={`${baseStyle} ${styles[variant]} ${className || ''}`} {...props}>
            {iconUrl && (
                <Image src={iconUrl} alt={iconAlt} width={20} height={20} className="w-5 h-5" />
            )}
            <span className="flex-1 text-left">{children}</span>
        </button>
    );
};

export default ButtonWithIcon;