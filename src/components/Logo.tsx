export default function Logo({ className = "w-9 h-9" }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
    >
      {/* Smooth rounded background matching our UI */}
      <rect width="100" height="100" rx="24" fill="url(#logo_gradient)" />

      {/* Base Node to Multiple Recipients Arrow */}
      <path 
        d="M32 68L68 32M68 32H44M68 32V56" 
        stroke="white" 
        strokeWidth="8" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className="drop-shadow-md"
      />

      {/* Foundation Node */}
      <circle cx="32" cy="68" r="6" fill="white" />

      {/* Recipient Nodes */}
      <circle cx="78" cy="22" r="5" fill="white" className="opacity-90" />
      <circle cx="40" cy="28" r="3" fill="white" className="opacity-70" />
      <circle cx="72" cy="60" r="4" fill="white" className="opacity-50" />

      {/* The identical Tailwind Blue-600 to Indigo-500 gradient */}
      <defs>
        <linearGradient id="logo_gradient" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2563EB" />
          <stop offset="1" stopColor="#6366F1" />
        </linearGradient>
      </defs>
    </svg>
  );
}
