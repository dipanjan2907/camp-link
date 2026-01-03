import React from "react";
import Image from "next/image";

const HeaderWithLogo = () => {
  // Replace this with your actual logo URL
  const logoUrl = "https://www.jisuniversity.ac.in/images/logo.png";

  return (
    <header className="fixed top-0 left-10 right-0 z-50 flex w-full items-center justify-center p-4 md:justify-start md:p-6">
      <div className="group relative block">
        {/* Logo Container */}
        <div className="relative flex h-36 w-30 items-center justify-center rounded-2xl backdrop-blur-mdshadow-xl transition-transform duration-300 group-hover:scale-[1.02]">
          <Image
            src={logoUrl}
            alt="Brand Logo"
            width={40}
            height={40}
            quality={100}
            className="h-28 w-30 object-fit contrast-120 brightness-130"
            priority
            unoptimized
          />
        </div>
      </div>
    </header>
  );
};

export default HeaderWithLogo;
