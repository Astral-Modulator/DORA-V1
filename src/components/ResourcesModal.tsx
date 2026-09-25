import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Layers, X, ExternalLink, Cpu, Sparkles, FileSearch, ShieldCheck, Database } from "lucide-react";
import { useTheme } from "../context/ThemeContext.js";

interface ResourcesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ResourcesModal: React.FC<ResourcesModalProps> = ({ isOpen, onClose }) => {
  const { isDark } = useTheme();

  const resources = [
    {
      title: "Gemini 2.5 Pro & Flash Inference Architecture",
      description: "Autonomous reasoning engine powering multi-agent research planning, document synthesis, and contradiction detection.",
      category: "AI Core",
      icon: Cpu,
      badge: "Gemini SDK",
    },
    {
      title: "ArXiv, PubMed & Semantic Scholar Indexing",
      description: "Verified academic source retrieval with real-time DOI citation attribution and deduplication filtering.",
      category: "Academic Sources",
      icon: FileSearch,
      badge: "Peer-Reviewed",
    },
    {
      title: "Mermaid.js Dynamic Architecture Diagrams",
      description: "Visual relationship mapping, sequence workflows, and hierarchical knowledge trees generated directly from research syntheses.",
      category: "Visualization",
      icon: Sparkles,
      badge: "Vector Diagrams",
    },
    {
      title: "Local Encrypted Session Storage",
      description: "Browser-level zero-leakage persistence for research queries, follow-up interrogations, and PDF vector embeddings.",
      category: "Security",
      icon: ShieldCheck,
      badge: "Local-First",
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          id="resources-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            id="resources-modal"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={`w-full max-w-2xl rounded-xl p-5 flex flex-col max-h-[85vh] shadow-2xl transition-colors ${
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
                <Layers className="w-4 h-4 text-emerald-500" />
                <h3 className={`text-sm font-medium ${isDark ? "text-neutral-100" : "text-neutral-900"}`}>
                  DORA Research Resources &amp; Modules
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

            {/* Resources Grid */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 my-1">
              {resources.map((item, idx) => {
                const IconComponent = item.icon;
                return (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-lg border flex flex-col gap-2 transition-all ${
                      isDark
                        ? "bg-[#18181b] border-neutral-800/80 text-neutral-200"
                        : "bg-neutral-50 border-neutral-200 text-neutral-800"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-7 h-7 rounded-md flex items-center justify-center border ${
                            isDark
                              ? "bg-neutral-900 border-neutral-800 text-emerald-400"
                              : "bg-white border-neutral-300 text-emerald-600"
                          }`}
                        >
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <h4 className="text-xs font-semibold">{item.title}</h4>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950/60 text-emerald-300 border border-emerald-800/60 shrink-0">
                        {item.badge}
                      </span>
                    </div>
                    <p
                      className={`text-xs leading-relaxed ${
                        isDark ? "text-neutral-400" : "text-neutral-600"
                      }`}
                    >
                      {item.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
