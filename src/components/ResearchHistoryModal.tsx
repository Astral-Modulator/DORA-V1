import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { HistoryItem } from "../types.js";
import {
  History,
  X,
  Trash2,
  FileText,
  Clock,
  ArrowRight,
  Search,
  AlertTriangle,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext.js";

interface ResearchHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
}

export const ResearchHistoryModal: React.FC<ResearchHistoryModalProps> = ({
  isOpen,
  onClose,
  history,
  onSelect,
  onDelete,
  onClearAll,
}) => {
  const { isDark } = useTheme();
  const [searchTerm, setSearchTerm] = useState("");
  const [confirmClear, setConfirmClear] = useState(false);

  const filteredHistory = history.filter((item) =>
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

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          id="research-history-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            id="research-history-modal"
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
                <History className={`w-4 h-4 ${isDark ? "text-neutral-300" : "text-neutral-700"}`} />
                <h3 className={`text-sm font-medium ${isDark ? "text-neutral-100" : "text-neutral-900"}`}>
                  Research History ({history.length})
                </h3>
              </div>
              <button
                id="close-history-modal-btn"
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

            {/* Search Bar */}
            {history.length > 0 && (
              <div className="relative mb-3">
                <Search
                  className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
                />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search previous research inquiries..."
                  className={`w-full outline-none text-xs pl-8 pr-3 py-2 rounded-md transition-colors bg-[#1c1c20] border border-neutral-700/80 focus:border-neutral-500 ${
                    isDark
                      ? "text-neutral-200 placeholder:text-neutral-400"
                      : "text-neutral-300 placeholder:text-neutral-500"
                  }`}
                />
              </div>
            )}

            {/* History List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 my-1">
              {history.length === 0 ? (
                <div
                  className={`text-center py-12 text-xs space-y-1 ${
                    isDark ? "text-neutral-500" : "text-neutral-500"
                  }`}
                >
                  <History className="w-6 h-6 mx-auto mb-2 stroke-[1.5]" />
                  <p>No previous research recorded yet.</p>
                  <p className="text-[11px]">
                    Inquiries are automatically saved locally with full reports, sources, and diagrams.
                  </p>
                </div>
              ) : filteredHistory.length === 0 ? (
                <div
                  className={`text-center py-8 text-xs ${
                    isDark ? "text-neutral-500" : "text-neutral-500"
                  }`}
                >
                  No matching research found for &ldquo;{searchTerm}&rdquo;.
                </div>
              ) : (
                filteredHistory.map((item) => (
                  <div
                    key={item.id}
                    className={`group rounded-md p-3 text-xs transition-all flex items-start justify-between gap-3 cursor-pointer shadow-sm ${
                      isDark
                        ? "bg-[#18181b] hover:bg-[#222226] border border-neutral-700/60 hover:border-neutral-600"
                        : "bg-white hover:bg-neutral-50 border border-neutral-200 hover:border-neutral-300"
                    }`}
                    onClick={() => {
                      onSelect(item);
                      onClose();
                    }}
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div
                        className={`font-medium truncate flex items-center gap-1.5 ${
                          isDark
                            ? "text-neutral-200 group-hover:text-white"
                            : "text-neutral-800 group-hover:text-black"
                        }`}
                      >
                        <span>{item.query}</span>
                      </div>

                      <div
                        className={`flex items-center gap-3 text-[11px] font-mono flex-wrap ${
                          isDark ? "text-neutral-500" : "text-neutral-500"
                        }`}
                      >
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{formatDate(item.timestamp)}</span>
                        </span>

                        {item.result.hasPdf && (
                          <span
                            className={`flex items-center gap-1 ${
                              isDark ? "text-neutral-400" : "text-neutral-600"
                            }`}
                          >
                            <FileText className="w-3 h-3" />
                            <span className="truncate max-w-[120px]">{item.result.pdfFileName}</span>
                          </span>
                        )}

                        <span>{item.result.sections.length} sections</span>
                        <span>{item.result.sources.length} sources</span>

                        {item.qaMessages && item.qaMessages.length > 0 && (
                          <span>{item.qaMessages.length} Q&amp;A</span>
                        )}

                        {item.diagram && (
                          <span className={isDark ? "text-neutral-400" : "text-neutral-600"}>
                            Diagram included
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        title="Load research session"
                        onClick={() => {
                          onSelect(item);
                          onClose();
                        }}
                        className={`p-1 transition-colors cursor-pointer ${
                          isDark
                            ? "text-neutral-500 hover:text-neutral-200"
                            : "text-neutral-400 hover:text-black"
                        }`}
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        title="Delete entry"
                        onClick={() => onDelete(item.id)}
                        className={`p-1 transition-colors cursor-pointer ${
                          isDark
                            ? "text-neutral-600 hover:text-red-400"
                            : "text-neutral-400 hover:text-red-600"
                        }`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer with Clear History */}
            {history.length > 0 && (
              <div
                className={`border-t pt-3 mt-3 flex items-center justify-between ${
                  isDark ? "border-neutral-800" : "border-neutral-200"
                }`}
              >
                {confirmClear ? (
                  <div className="flex items-center gap-2 text-xs">
                    <span className={`flex items-center gap-1 ${isDark ? "text-amber-400" : "text-amber-600"}`}>
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Clear all research history?</span>
                    </span>
                    <button
                      id="confirm-clear-history-btn"
                      type="button"
                      onClick={() => {
                        onClearAll();
                        setConfirmClear(false);
                      }}
                      className="bg-red-700 text-white hover:bg-red-800 px-2 py-0.5 rounded text-[11px] transition-colors cursor-pointer"
                    >
                      Yes, Clear All
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmClear(false)}
                      className={`px-2 py-0.5 rounded text-[11px] cursor-pointer ${
                        isDark ? "text-neutral-400 hover:text-neutral-200" : "text-neutral-600 hover:text-black"
                      }`}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    id="clear-history-button"
                    type="button"
                    onClick={() => setConfirmClear(true)}
                    className={`inline-flex items-center gap-1.5 text-xs transition-colors cursor-pointer ${
                      isDark
                        ? "text-neutral-500 hover:text-red-400"
                        : "text-neutral-500 hover:text-red-600"
                    }`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear All History</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={onClose}
                  className={`text-xs px-3.5 py-1.5 rounded-md transition-colors shadow-sm cursor-pointer ${
                    isDark
                      ? "bg-[#222226] hover:bg-[#2a2a2f] border border-neutral-700/80 text-neutral-200 hover:text-white"
                      : "bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 text-neutral-800 hover:text-black"
                  }`}
                >
                  Close
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ResearchHistoryModal;
