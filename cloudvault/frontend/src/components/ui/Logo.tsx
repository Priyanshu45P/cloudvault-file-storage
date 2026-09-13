interface LogoProps {
  size?: number;
  showWordmark?: boolean;
}

/** Original CloudVault mark: a cloud silhouette wrapped around a shield/keyhole. */
export function Logo({ size = 32, showWordmark = true }: LogoProps) {
  return (
    <div className="flex items-center gap-2">
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M14 34C8.477 34 4 29.523 4 24c0-5.086 3.79-9.29 8.706-9.917C14.01 9.62 18.61 6 24 6c6.213 0 11.313 4.686 11.95 10.708C40.523 17.29 44 21.107 44 25.5 44 30.75 39.75 35 34.5 35H14v-1z"
          fill="url(#cv-cloud-grad)"
        />
        <path
          d="M24 18l7 3v5.5c0 4.5-3 7.5-7 8.5-4-1-7-4-7-8.5V21l7-3z"
          fill="#ffffff"
          fillOpacity="0.95"
        />
        <path d="M21 25.5l2 2 4-4.5" stroke="#0B2C6B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <defs>
          <linearGradient id="cv-cloud-grad" x1="4" y1="6" x2="44" y2="35" gradientUnits="userSpaceOnUse">
            <stop stopColor="#0B2C6B" />
            <stop offset="0.55" stopColor="#1E5FCC" />
            <stop offset="1" stopColor="#7C4DFF" />
          </linearGradient>
        </defs>
      </svg>
      {showWordmark && (
        <span className="text-xl font-bold tracking-tight text-vault-deep dark:text-white">
          Cloud<span className="text-vault-purple">Vault</span>
        </span>
      )}
    </div>
  );
}
