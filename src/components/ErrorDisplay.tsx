import React from "react";
import { AlertCircle, RotateCcw } from "lucide-react";
import { useTheme } from "../context/ThemeContext.js";

interface ErrorDisplayProps {
  message: string;
  onRetry: () => void;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ message, onRetry }) => {
  const { isDark } = useTheme();
  const isApiKeyIssue =
    message.toLowerCase().includes("api_key") ||
    message.toLowerCase().includes("gemini_api_key") ||
    message.toLowerCase().includes("permission_denied");

  return (
    <div
      id="research-error-box"
      className={`w-full max-w-2xl mx-auto my-6 rounded p-4 text-xs border ${
        isDark
          ? "bg-neutral-950 border-neutral-800"
          : "bg-red-50/50 border-red-200"
      }`}
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
        <div className="space-y-2 flex-1">
          <div className={`font-medium ${isDark ? "text-neutral-200" : "text-red-950"}`}>
            Research Process Failed
          </div>
          <div
            className={`leading-relaxed font-mono text-[11px] p-2 rounded border ${
              isDark
                ? "text-neutral-400 bg-neutral-900/50 border-neutral-900"
                : "text-red-800 bg-white border-red-200"
            }`}
          >
            {message}
          </div>

          {isApiKeyIssue && (
            <p className={isDark ? "text-neutral-500" : "text-neutral-600"}>
              Please ensure your Gemini API key is configured in the AI Studio
              <strong> Settings &gt; Secrets</strong> panel.
            </p>
          )}

          <div className="pt-2">
            <button
              id="retry-research-button"
              type="button"
              onClick={onRetry}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded transition-colors cursor-pointer border ${
                isDark
                  ? "bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border-neutral-700"
                  : "bg-white hover:bg-neutral-50 text-neutral-800 border-neutral-300 shadow-sm"
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorDisplay;
