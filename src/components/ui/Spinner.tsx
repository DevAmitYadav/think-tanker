// by Amit Yadav: Advanced animated loader for async UI states
import React from 'react';

const Spinner: React.FC = () => (
  <div className="flex flex-col items-center justify-center">
    <div className="relative flex items-center justify-center h-16 w-16 mb-2">
      {/* Animated mind map nodes */}
      <svg className="absolute inset-0 h-16 w-16" viewBox="0 0 64 64" fill="none">
        <circle cx="32" cy="32" r="28" stroke="#3B82F6" strokeWidth="4" className="opacity-20" />
        <circle cx="32" cy="32" r="20" stroke="#60A5FA" strokeWidth="2" className="opacity-30 animate-pulse" />
        {/* Central node */}
        {/* <circle cx="32" cy="32" r="6" fill="#2563EB" className="animate-bounce" /> */}
        {/* Orbiting nodes */}
        <circle cx="32" cy="10" r="3" fill="#60A5FA" className="animate-orbit" />
        <circle cx="54" cy="32" r="3" fill="#60A5FA" className="animate-orbit2" />
        <circle cx="32" cy="54" r="3" fill="#60A5FA" className="animate-orbit3" />
        <circle cx="10" cy="32" r="3" fill="#60A5FA" className="animate-orbit4" />
      </svg>
      {/* Sync icon overlay */}
      <svg className="h-8 w-8 text-blue-500 animate-spin-slow" viewBox="0 0 24 24" fill="none">
        <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.13-.31 2.19-.85 3.08l1.46 1.46A7.963 7.963 0 0020 12c0-4.42-3.58-8-8-8zm-6.85 2.92A7.963 7.963 0 004 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3c-3.31 0-6-2.69-6-6 0-1.13.31-2.19.85-3.08l-1.46-1.46z" fill="currentColor" />
      </svg>
    </div>
    <span className="text-blue-700 font-semibold tracking-wide text-lg animate-pulse">Loading Mind Map...</span>
    <style>{`
      @keyframes orbit {
        0% { transform: rotate(0deg) translate(0, -22px) rotate(0deg); }
        100% { transform: rotate(360deg) translate(0, -22px) rotate(-360deg); }
      }
      .animate-orbit { transform-origin: 32px 32px; animation: orbit 1.2s linear infinite; }
      .animate-orbit2 { transform-origin: 32px 32px; animation: orbit 1.2s linear infinite 0.3s; }
      .animate-orbit3 { transform-origin: 32px 32px; animation: orbit 1.2s linear infinite 0.6s; }
      .animate-orbit4 { transform-origin: 32px 32px; animation: orbit 1.2s linear infinite 0.9s; }
      .animate-spin-slow { animation: spin 2s linear infinite; }
    `}</style>
  </div>
);

export default Spinner;
