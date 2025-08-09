import React from 'react';
import Header from './Header';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* CSS Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-100 via-red-50 to-orange-200">
        {/* Animated floating elements */}
        <div className="absolute top-20 left-10 w-40 h-40 bg-orange-300/60 rounded-full blur-lg animate-float"></div>
        <div className="absolute top-40 right-20 w-32 h-32 bg-red-400/50 rounded-full blur-lg animate-float-delay-1"></div>
        <div className="absolute bottom-20 left-1/4 w-48 h-48 bg-orange-400/40 rounded-full blur-lg animate-float-delay-2"></div>
        <div className="absolute top-1/2 right-1/3 w-28 h-28 bg-red-300/70 rounded-full blur-lg animate-float-delay-3"></div>
        <div className="absolute top-1/3 left-1/2 w-36 h-36 bg-orange-500/30 rounded-full blur-lg animate-float-delay-1"></div>
        <div className="absolute bottom-1/3 right-1/4 w-24 h-24 bg-red-500/50 rounded-full blur-lg animate-float-delay-3"></div>
        
        {/* Pattern overlay */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, rgba(251, 146, 60, 0.3) 0%, transparent 50%),
                            radial-gradient(circle at 75% 75%, rgba(239, 68, 68, 0.3) 0%, transparent 50%)`
          }}></div>
        </div>
      </div>
      <div className="relative z-10 min-h-screen bg-black/10">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout; 