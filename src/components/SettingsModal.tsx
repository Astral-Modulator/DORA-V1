import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Settings, X, Moon, Sun, Shield, Trash2, Cpu, Check, AlertCircle } from "lucide-react";
import { useTheme } from "../context/ThemeContext.js";
import { useAuth } from "../context/AuthContext.js";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClearHistory: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onClearHistory,
}) => {
  const { isDark, toggleTheme } = useTheme();
  const { user } = useAuth();
  const [defaultMode, setDefaultMode] = useState<"fast" | "deep" | "academic">("deep");
  const [autoDiagrams, setAutoDiagrams] = useState(true);
  const [clearConfirmed, setClearConfirmed] = useState(false);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          id="settings-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            id="settings-modal"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={`w-full max-w-xl rounded-xl p-5 flex flex-col max-h-[85vh] shadow-2xl transition-colors ${
              isDark
                ? "bg-[#141416] border border-neutral-700/80"
                : "bg-white border border-neutral-200 shadow-neutral-900/20"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              className={`flex items-center justify-between border-b pb-3 mb-4 ${
                isDark ? "border-neutral-800" : "border-neutral-200"
              }`}
            >
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-emerald-500" />
                <h3 className={`text-sm font-medium ${isDark ? "text-neutral-100" : "text-neutral-900"}`}>
                  DORA System Preferences
                </h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                className={`p-1 rounded-md transition-colors cursor-pointer ${
                  isDark
                    ? "text-neutral-400 hover:text-white hover:bg-[#222226]"
                    : "text-neutral-500 hover:text-black hover:bg-neutral-100"
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Settings Sections */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {/* Theme Preference */}
              <div
                className={`p-3.5 rounded-lg border flex items-center justify-between transition-colors ${
                  isDark ? "bg-[#18181b] border-neutral-800/80" : "bg-neutral-50 border-neutral-200"
                }`}
              >
                <div className="flex flex-col">
                  <span className={`text-xs font-semibold ${isDark ? "text-neutral-200" : "text-neutral-800"}`}>
                    Interface Appearance
                  </span>
                  <span className="text-[11px] text-neutral-500 font-mono">
                    Currently set to {isDark ? "Dark / Void Theme" : "Light / Clean Theme"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={toggleTheme}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                    isDark
                      ? "bg-neutral-900 border-neutral-700 text-neutral-200 hover:text-white"
                      : "bg-white border-neutral-300 text-neutral-800 hover:text-black"
                  }`}
                >
                  {isDark ? (
                    <>
                      <Sun className="w-3.5 h-3.5 text-amber-400" />
                      <span>Switch to Light</span>
                    </>
                  ) : (
                    <>
                      <Moon className="w-3.5 h-3.5 text-neutral-700" />
                      <span>Switch to Dark</span>
                    </>
                  )}
                </button>
              </div>

              {/* Research Engine Mode */}
              <div
                className={`p-3.5 rounded-lg border flex flex-col gap-2.5 transition-colors ${
                  isDark ? "bg-[#18181b] border-neutral-800/80" : "bg-neutral-50 border-neutral-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-3.5 h-3.5 text-emerald-500" />
                    <span className={`text-xs font-semibold ${isDark ? "text-neutral-200" : "text-neutral-800"}`}>
                      Default Autonomous Mode
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 uppercase">{defaultMode}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {(["fast", "deep", "academic"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setDefaultMode(m)}
                      className={`py-1.5 px-2 rounded-md text-xs font-mono capitalize border transition-all cursor-pointer ${
                        defaultMode === m
                          ? isDark
                            ? "bg-emerald-950/60 border-emerald-500/80 text-emerald-300 font-semibold"
                            : "bg-emerald-50 border-emerald-500 text-emerald-800 font-semibold"
                          : isDark
                          ? "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200"
                          : "bg-white border-neutral-300 text-neutral-600 hover:text-neutral-900"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Account Session Info */}
              <div
                className={`p-3.5 rounded-lg border flex flex-col gap-1.5 transition-colors ${
                  isDark ? "bg-[#18181b] border-neutral-800/80" : "bg-neutral-50 border-neutral-200"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5 text-emerald-500" />
                  <span className={`text-xs font-semibold ${isDark ? "text-neutral-200" : "text-neutral-800"}`}>
                    Active Identity &amp; Encryption
                  </span>
                </div>
                <p className="text-[11px] font-mono text-neutral-500">
                  Signed in as: <span className="text-emerald-400">{user?.email || "Local Researcher"}</span>
                </p>
                <p className="text-[11px] text-neutral-500">
                  All queries and research extractions are streamed through isolated sandbox channels.
                </p>
              </div>

              {/* Clear History / Cache Data */}
              <div
                className={`p-3.5 rounded-lg border flex items-center justify-between transition-colors ${
                  isDark ? "bg-[#18181b] border-neutral-800/80" : "bg-neutral-50 border-neutral-200"
                }`}
              >
                <div className="flex flex-col">
                  <span className={`text-xs font-semibold ${isDark ? "text-neutral-200" : "text-neutral-800"}`}>
                    Local Storage Cache
                  </span>
                  <span className="text-[11px] text-neutral-500 font-mono">
                    Clear locally persisted research logs &amp; diagrams
                  </span>
                </div>
                {clearConfirmed ? (
                  <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono">
                    <Check className="w-3.5 h-3.5" />
                    <span>Cleared</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      onClearHistory();
                      setClearConfirmed(true);
                      setTimeout(() => setClearConfirmed(false), 2000);
                    }}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-mono border transition-colors cursor-pointer ${
                      isDark
                        ? "bg-red-950/40 border-red-800/60 text-red-300 hover:bg-red-900/60"
                        : "bg-red-50 border-red-300 text-red-700 hover:bg-red-100"
                    }`}
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Clear Data</span>
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
