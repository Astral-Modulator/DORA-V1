import React from "react";
import { motion } from "motion/react";
import { useTheme } from "../context/ThemeContext.js";

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  className = "",
  showLabel = false,
}) => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <motion.button
      id="theme-toggle-button"
      type="button"
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.94 }}
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      className={`inline-flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-md transition-all duration-300 cursor-pointer shadow-sm ${
        isDark
          ? "bg-[#18181b] hover:bg-[#222226] text-neutral-200 hover:text-white border border-neutral-700/80 hover:border-neutral-600"
          : "bg-white hover:bg-neutral-100 text-neutral-800 hover:text-black border border-neutral-300 hover:border-neutral-400"
      } ${className}`}
    >
      <div className="relative w-4 h-4 flex items-center justify-center shrink-0">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
          fill="currentColor"
          strokeLinecap="round"
          viewBox="0 0 32 32"
          className="w-4 h-4"
        >
          <clipPath id="skiper-theme-clip">
            <motion.path
              animate={{ y: isDark ? 10 : 0, x: isDark ? -12 : 0 }}
              transition={{ ease: "easeInOut", duration: 0.35 }}
              d="M0-5h30a1 1 0 0 0 9 13v24H0Z"
            />
          </clipPath>
          <g clipPath="url(#skiper-theme-clip)">
            <motion.circle
              animate={{ r: isDark ? 10 : 8 }}
              transition={{ ease: "easeInOut", duration: 0.35 }}
              cx="16"
              cy="16"
            />
            <motion.g
              animate={{
                rotate: isDark ? -100 : 0,
                scale: isDark ? 0.5 : 1,
                opacity: isDark ? 0 : 1,
              }}
              transition={{ ease: "easeInOut", duration: 0.35 }}
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M16 5.5v-4" />
              <path d="M16 30.5v-4" />
              <path d="M1.5 16h4" />
              <path d="M26.5 16h4" />
              <path d="m23.4 8.6 2.8-2.8" />
              <path d="m5.7 26.3 2.9-2.9" />
              <path d="m5.8 5.8 2.8 2.8" />
              <path d="m23.4 23.4 2.9 2.9" />
            </motion.g>
          </g>
        </svg>
      </div>

      <span className="text-[11px] select-none font-medium">
        {showLabel ? (isDark ? "Light Mode" : "Dark Mode") : isDark ? "Light" : "Dark"}
      </span>
    </motion.button>
  );
};

export default ThemeToggle;
