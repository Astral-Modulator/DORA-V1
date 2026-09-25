import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { HistoryItem } from "../types.js";
import { GraduationCap, X, ExternalLink, Search, BookOpen } from "lucide-react";
import { useTheme } from "../context/ThemeContext.js";

interface PapersModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryItem[];
}

export const PapersModal: React.FC<PapersModalProps> = ({
  isOpen,
  onClose,
  history,
}) => {
  const { isDark } = useTheme();
  const [searchTerm, setSearchTerm] = useState("");

  // Aggregate all sources/papers across history sessions
  const allPapers = history.flatMap((h) =>
    (h.result.sources || []).map((s, idx) => ({
      id: `${h.id}-src-${idx}`,
      title: s.title || s.domain || "Academic Reference",
      url: s.url,
      domain: s.domain,
      snippet: s.snippet,
      query: h.query,
      timestamp: h.timestamp,
    }))
  );

  // Deduplicate by URL
  const uniquePapers = Array.from(
    new Map(allPapers.filter((p) => p.url).map((p) => [p.url, p])).values()
  );

  const filtered = uniquePapers.filter(
    (p) =>
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.domain.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.snippet && p.snippet.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          id="papers-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            id="papers-modal"
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
                <GraduationCap className="w-4 h-4 text-emerald-500" />
                <h3 className={`text-sm font-medium ${isDark ? "text-neutral-100" : "text-neutral-900"}`}>
                  Academic Papers &amp; Citations ({uniquePapers.length})
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

            {/* Search filter */}
            {uniquePapers.length > 0 && (
              <div className="relative mb-3">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search extracted papers & references..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full rounded-md pl-9 pr-3 py-1.5 text-xs outline-none transition-colors ${
                    isDark
                      ? "bg-[#1c1c1f] border border-neutral-800 text-neutral-200 placeholder:text-neutral-500 focus:border-neutral-600"
                      : "bg-neutral-50 border border-neutral-300 text-neutral-900 placeholder:text-neutral-500 focus:border-neutral-500"
                  }`}
                />
              </div>
            )}

            {/* Content List */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 my-1">
              {uniquePapers.length === 0 ? (
                <div className="text-center py-12 text-neutral-500">
                  <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-30 text-emerald-500" />
                  <p className="text-xs">No academic papers discovered yet.</p>
                  <p className="text-[11px] font-mono text-neutral-600 mt-1">
                    Execute an Academic or Deep research session to extract verified papers and DOI citations.
                  </p>
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-8 text-neutral-500 text-xs">
                  No papers matching &quot;{searchTerm}&quot;
                </div>
              ) : (
                filtered.map((paper) => (
                  <div
                    key={paper.id}
                    className={`p-3 rounded-lg border flex flex-col gap-1.5 transition-all ${
                      isDark
                        ? "bg-[#18181b] border-neutral-800/80 text-neutral-200"
                        : "bg-neutral-50 border-neutral-200 text-neutral-800"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h4 className="text-xs font-semibold leading-snug line-clamp-2">
                        {paper.title}
                      </h4>
                      {paper.url && (
                        <a
                          href={paper.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-500 hover:text-emerald-400 p-1 shrink-0"
                          title="Open external publication"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                    {paper.snippet && (
                      <p
                        className={`text-[11px] leading-relaxed line-clamp-2 ${
                          isDark ? "text-neutral-400" : "text-neutral-600"
                        }`}
                      >
                        {paper.snippet}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-[10px] font-mono text-neutral-500 mt-1 pt-1 border-t border-neutral-800/40">
                      <span className="text-emerald-400">{paper.domain}</span>
                      <span>&bull;</span>
                      <span>From query: &quot;{paper.query}&quot;</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
