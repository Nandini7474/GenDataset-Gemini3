import { Link } from "wouter";
import logo from "@assets/a-modern-tech-logo-design-featuring-the-_yYz8-pCfRYuaT9S2V6rP_1770293196050.jpeg";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col font-body text-foreground">
      {/* Navbar */}
      <header className="fixed top-0 w-full z-50 glass-panel border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-10 h-10 rounded-xl overflow-hidden shadow-lg group-hover:shadow-primary/20 transition-all duration-300">
              <img 
                src={logo} 
                alt="GenData Logo" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 ring-1 ring-inset ring-black/10 rounded-xl"></div>
            </div>
            <span className="font-display font-bold text-xl tracking-tight text-gradient">
              GenData
            </span>
          </Link>

          <nav className="flex items-center gap-6">
            <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              Generator
            </Link>
            <Link href="/history" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              History
            </Link>
            <button className="text-sm font-medium bg-primary/10 text-primary px-4 py-2 rounded-lg hover:bg-primary/20 transition-colors">
              Sign In
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {children}
      </main>

      {/* Simple Footer */}
      <footer className="border-t border-border py-8 mt-auto bg-white/30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} GenData AI. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
