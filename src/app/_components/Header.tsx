import { SignedIn, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import Image from "next/image";

export function Header() {
  return (
    <nav className="fixed top-0 right-0 left-0 z-50 w-full">
      {/* Background with depth */}
      <div className="relative">
        {/* Main header background with lighter gradient */}
        <div className="border-b border-gray-600/50 bg-gradient-to-b from-gray-600/80 via-gray-600/60 to-gray-600/65 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-between px-6 py-4">
            {/* Logo only, no Home word */}
            <Link href="/" className="relative flex items-center space-x-3">
              <Image 
                src="/zinda.svg" 
                alt="Zinda Law Group Logo" 
                width={32} 
                height={32}
                className="h-8 w-8"
              />
            </Link>

            {/* Navigation and auth section */}
            <div className="flex items-center gap-4">
              {/* Auth buttons with enhanced styling */}
              <div className="flex items-center gap-3">
                <SignedIn>
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-400/20 to-blue-400/20 opacity-0 blur-md transition-opacity duration-300 hover:opacity-100"></div>
                    <UserButton
                      appearance={{
                        elements: {
                          avatarBox:
                            "w-8 h-8 rounded-full border-2 border-gray-500/50 shadow-lg",
                        },
                      }}
                    />
                  </div>
                </SignedIn>
              </div>
            </div>
          </div>
        </div>

        {/* Subtle bottom shadow for depth */}
        <div className="absolute right-0 bottom-0 left-0 h-px bg-gradient-to-r from-transparent via-gray-500/30 to-transparent"></div>
      </div>
    </nav>
  );
}
