import React from "react";
import Image from "next/image";

interface LogoProps {
  size?: number;
  className?: string;
  rounded?: string;
  priority?: boolean;
}

export function Logo({
  size = 32,
  className = "",
  rounded = "rounded-lg",
  priority = false,
}: LogoProps) {
  return (
    <div
      className={`relative overflow-hidden bg-black shrink-0 shadow-2xs ${rounded} ${className}`}
      style={{ width: size, height: size }}
    >
      <Image
        src="/logo.png"
        alt="Cookmywork"
        width={size}
        height={size}
        priority={priority}
        className="object-cover w-full h-full"
      />
    </div>
  );
}
