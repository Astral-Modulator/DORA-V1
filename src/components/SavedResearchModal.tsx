import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { HistoryItem } from "../types.js";
import { Bookmark, X, ArrowRight, Search, FileText, Download } from "lucide-react";
import { useTheme } from "../context/ThemeContext.js";

interface SavedResearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
}

export const SavedResearchModal: React.FC<SavedResearchModalProps> = ({
  isOpen,
  onClose,
  history,
  onSelect,
}) => {
  const { isDark } = useTheme();
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = history.filter((item) =>
    item.query.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const exportAll = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(history, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `dora_saved_research_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          id="saved-research-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            id="saved-research-modal"
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
                <Bookmark className="w-4 h-4 text-emerald-500" />
                <h3 className={`text-sm font-medium ${isDark ? "text-neutral-100" : "text-neutral-900"}`}>
                  Saved Research Workspace ({history.length})
                </h3>
              </div>
              <div className="flex items-center gap-2">
                {history.length > 0 && (
                  <button
                    type="button"
                    onClick={exportAll}
                    title="Export all sessions to JSON"
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono border transition-colors cursor-pointer ${
                      isDark
                        ? "bg-neutral-900 border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700"
                        : "bg-neutral-100 border-neutral-300 text-neutral-700 hover:text-black hover:border-neutral-400"
                    }`}
                  >
                    <Download className="w-3 h-3" />
                    <span>Export JSON</span>
                  </button>
                )}
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
            </div>

            {/* Search filter */}
            {history.length > 0 && (
              <div className="relative mb-3">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Filter saved research..."
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
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 my-1">
              {history.length === 0 ? (
                <div className="text-center py-12 text-neutral-500">
                  <Bookmark className="w-8 h-8 mx-auto mb-2 opacity-30 text-emerald-500" />
                  <p className="text-xs">No saved research sessions yet.</p>
                  <p className="text-[11px] font-mono text-neutral-600 mt-1">
                    Completed deep research queries are automatically persisted and saved here.
                  </p>
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-8 text-neutral-500 text-xs">
                  No saved research matches &quot;{searchTerm}&quot;
                </div>
              ) : (
                filtered.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      onSelect(item);
                      onClose();
                    }}
                    className={`p-3 rounded-lg border flex items-center justify-between group cursor-pointer transition-all ${
                      isDark
                        ? "bg-[#18181b] border-neutral-800/80 hover:bg-[#202024] hover:border-neutral-700 text-neutral-200"
                        : "bg-neutral-50 border-neutral-200 hover:bg-neutral-100 hover:border-neutral-300 text-neutral-800"
                    }`}
                  >
                    <div className="flex flex-col gap-1 min-w-0 pr-3">
                      <div className="flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span className="text-xs font-medium truncate">{item.query}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-mono text-neutral-500">
                        <span>{formatDate(item.timestamp)}</span>
                        <span>&bull;</span>
                        <span>{item.result.sources?.length || 0} verified sources</span>
                        {item.qaMessages && item.qaMessages.length > 0 && (
                          <>
                            <span>&bull;</span>
                            <span>{item.qaMessages.length} follow-ups</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                      <span className="text-[11px] font-mono mr-1 hidden sm:inline">Open</span>
                      <ArrowRight className="w-3.5 h-3.5 text-emerald-500" />
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
