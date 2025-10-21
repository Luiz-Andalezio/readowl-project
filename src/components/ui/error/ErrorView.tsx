"use client";
import React from "react";

type Props = {
  message: string;
  imgSrc?: string;
  className?: string;
  offsetUnderNavbar?: boolean; // add top spacing for fixed navbar
};

export default function ErrorView({message, imgSrc, className = "", offsetUnderNavbar = false }: Props) {
  return (
    <section className={`${offsetUnderNavbar ? "mt-14 sm:mt-16" : ""} flex items-center justify-center px-4 py-10`}> 
      <div className={`text-center max-w-2xl ${className}`}>
        {imgSrc ? (
          <div className="mb-6 flex justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imgSrc}
              alt=""
              className="block max-w-[320px] md:max-w-[420px] h-auto object-contain"
            />
          </div>
        ) : null}
        <p className="text-readowl-purple-extralight text-base md:text-lg">{message}</p>
      </div>
    </section>
  );
}
