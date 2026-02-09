import React from "react";

const Navbar = () => {
  return (
    <nav className="sticky top-0 z-50 mx-6 mt-4 px-8 py-4 rounded-2xl backdrop-blur-md bg-white/70 shadow-sm flex items-center justify-between">
      
      {/* Logo */}
      <div className="flex items-center gap-3">
        {/* Custom Logo Icon */}
        <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center shadow-md">
          <div className="absolute w-2 h-2 bg-white rounded-full top-2 left-2 opacity-90" />
          <div className="absolute w-2 h-2 bg-white rounded-full bottom-2 right-2 opacity-90" />
          <div className="w-3 h-3 bg-white rounded-sm rotate-45 opacity-90" />
        </div>

        {/* Logo Text */}
        <span className="text-2xl font-extrabold tracking-tight">
          <span className="text-gray-900">NS</span>
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-purple-600">
            DATALAB
          </span>
        </span>
      </div>

      {/* Right side badge */}
      <div className="hidden md:flex items-center">
        <span className="text-sm font-medium px-4 py-1.5 rounded-full bg-purple-50 text-purple-600 border border-purple-100">
          Gemini 3 Pro Powered
        </span>
      </div>

    </nav>
  );
};

export default Navbar;
