"use client";
import React from 'react';
import Image from 'next/image';

type Size = 'sm' | 'md' | 'lg';

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: React.ReactNode;
  iconUrl?: string;
  iconAlt?: string;
  iconSize?: number;
  selected?: boolean;                 // controlled
  defaultSelected?: boolean;          // uncontrolled
  onSelectedChange?: (v: boolean) => void;
  selectedChildren?: React.ReactNode; // label when selected (fallback to children)
  fullWidth?: boolean;
  size?: Size;
  toggleOnClick?: boolean;            // if false, does not auto-toggle; consumer handles state
};

export default function SelectableIconButton({
  icon,
  iconUrl,
  iconAlt = 'Ícone',
  iconSize = 20,
  selected,
  defaultSelected,
  onSelectedChange,
  selectedChildren,
  className,
  children,
  fullWidth = true,
  size = 'md',
  toggleOnClick = true,
  type = 'button',
  onClick,
  ...rest
}: Props) {
  const isControlled = typeof selected === 'boolean';
  const [internal, setInternal] = React.useState<boolean>(defaultSelected ?? false);
  const isSelected = isControlled ? (selected as boolean) : internal;

  const handleToggle = () => {
    const next = !isSelected;
    if (!isControlled) setInternal(next);
    onSelectedChange?.(next);
  };

  const sizeClasses: Record<Size, string> = {
    sm: 'text-sm md:text-base px-4 py-2',
    md: 'text-lg px-6 py-2',
    lg: 'text-xl px-7 py-3',
  };

  const baseStyle = `font-ptserif font-semibold border-2 border-readowl-purple rounded-md transition-colors duration-300 flex items-center justify-start gap-2 ${fullWidth ? 'w-full' : ''} ${sizeClasses[size]}`;

  const style = isSelected
    ? 'bg-readowl-purple-dark text-readowl-purple-light'
    : 'bg-readowl-purple-light text-white hover:bg-readowl-purple-hover';

  return (
    <button
      type={type}
      onClick={(e) => {
        onClick?.(e);
        if (!e.defaultPrevented && toggleOnClick) handleToggle();
      }}
      aria-pressed={isSelected}
      className={`${baseStyle} ${style} ${className || ''}`}
      {...rest}
    >
      {icon ? (
        <span className="inline-flex items-center justify-center" style={{ width: iconSize, height: iconSize }}>{icon}</span>
      ) : iconUrl ? (
        <Image src={iconUrl} alt={iconAlt} width={iconSize} height={iconSize}
               className={isSelected ? 'invert-0' : 'invert-[100%] brightness-0'} />
      ) : null}
      <span className="select-none">{isSelected ? (selectedChildren ?? children) : children}</span>
    </button>
  );
}
