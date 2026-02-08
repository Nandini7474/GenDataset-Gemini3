import React from 'react';
import { Database } from 'lucide-react';

const Navbar = () => {
    return (
        <nav className="sticky top-0 z-50 px-6 py-4 mx-4 mt-4 rounded-2xl glass-panel flex items-center justify-between backdrop-blur-md">
            <div className="flex items-center gap-3">
                {/* Logo Icon */}
                <div className="bg-gradient-to-tr from-indigo-500 to-purple-500 p-2 rounded-lg shadow-lg shadow-indigo-500/20">
                    <Database className="text-white w-6 h-6" />
                </div>
                {/* Logo Text */}
                <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 tracking-tight">
                    NSdataLab
                </span>
            </div>

            {/* Context/Status (Optional) */}
            <div className="hidden md:flex items-center gap-4 text-sm text-slate-500 font-medium">
                <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full border border-indigo-100">
                    Gemini 3 Pro Powered
                </span>
            </div>
        </nav>
    );
};

export default Navbar;
