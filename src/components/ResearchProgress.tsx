import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { ProgressStep } from "../types.js";
import { Check, Loader2, Minus, AlertCircle } from "lucide-react";
import { useTheme } from "../context/ThemeContext.js";

interface ResearchProgressProps {
  steps: ProgressStep[];
  query: string;
}

export const ResearchProgress: React.FC<ResearchProgressProps> = ({ steps, query }) => {
  const { isDark } = useTheme();
  const activeSteps = steps.filter((s) => s.status !== "skipped");
  const completedCount = activeSteps.filter((s) => s.status === "completed").length;
  const inProgressIndex = activeSteps.findIndex((s) => s.status === "in_progress");
  const progressPercent =
    activeSteps.length > 0
      ? Math.round(((completedCount + (inProgressIndex >= 0 ? 0.5 : 0)) / activeSteps.length) * 100)
      : 0;

  return (
    <motion.div
      id="research-progress-panel"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`w-full max-w-3xl mx-auto my-6 rounded-xl p-5 shadow-xl transition-colors ${
        isDark
          ? "bg-[#141416] border border-neutral-700/80"
          : "bg-white border border-neutral-200 shadow-neutral-200/60"
      }`}
    >
      <div className={`border-b pb-3 mb-4 ${isDark ? "border-neutral-800" : "border-neutral-200"}`}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  isDark ? "bg-neutral-400" : "bg-neutral-600"
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  isDark ? "bg-neutral-200" : "bg-neutral-900"
                }`}
              />
            </span>
            <span
              className={`text-xs font-mono uppercase tracking-wider ${
                isDark ? "text-neutral-400" : "text-neutral-600"
              }`}
            >
              Orchestration Pipeline Active
            </span>
          </div>
          <span
            className={`text-xs font-mono font-medium ${
              isDark ? "text-neutral-400" : "text-neutral-600"
            }`}
          >
            {progressPercent}%
          </span>
        </div>

        {/* Animated Progress Bar */}
        <div
          className={`w-full h-1 rounded-full mt-3 overflow-hidden ${
            isDark ? "bg-neutral-900" : "bg-neutral-200"
          }`}
        >
          <motion.div
            className={`h-full rounded-full ${isDark ? "bg-neutral-100" : "bg-neutral-900"}`}
            initial={{ width: "0%" }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>

        <div
          className={`text-sm font-medium mt-3 truncate ${
            isDark ? "text-neutral-200" : "text-neutral-900"
          }`}
        >
          &ldquo;{query}&rdquo;
        </div>
      </div>

      <div className="space-y-3">
        {steps.map((step, idx) => {
          let statusIcon = (
            <span
              className={`w-4 h-4 rounded-full border flex items-center justify-center text-[10px] ${
                isDark
                  ? "border-neutral-700 text-neutral-600"
                  : "border-neutral-300 text-neutral-400"
              }`}
            >
              <Minus className="w-2.5 h-2.5" />
            </span>
          );
          let textColor = isDark ? "text-neutral-500" : "text-neutral-400";

          if (step.status === "in_progress") {
            statusIcon = (
              <Loader2
                className={`w-4 h-4 animate-spin shrink-0 ${
                  isDark ? "text-neutral-200" : "text-neutral-900"
                }`}
              />
            );
            textColor = isDark ? "text-neutral-100 font-medium" : "text-neutral-900 font-medium";
          } else if (step.status === "completed") {
            statusIcon = (
              <motion.div
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
              >
                <Check
                  className={`w-4 h-4 shrink-0 ${
                    isDark ? "text-neutral-300" : "text-neutral-800"
                  }`}
                />
              </motion.div>
            );
            textColor = isDark ? "text-neutral-300" : "text-neutral-700";
          } else if (step.status === "skipped") {
            statusIcon = (
              <span className={`text-xs shrink-0 ${isDark ? "text-neutral-600" : "text-neutral-400"}`}>
                —
              </span>
            );
            textColor = `${isDark ? "text-neutral-600" : "text-neutral-400"} line-through`;
          } else if (step.status === "error") {
            statusIcon = <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />;
            textColor = "text-red-500";
          }

          return (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05, duration: 0.2 }}
              className="flex items-start gap-3 text-xs"
            >
              <div className="mt-0.5">{statusIcon}</div>
              <div className="flex-1">
                <div className={textColor}>{step.label}</div>
                <AnimatePresence>
                  {step.detail && (
                    <motion.div
                      key={step.detail}
                      initial={{ opacity: 0, y: -2 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className={`text-[11px] mt-0.5 font-mono ${
                        isDark ? "text-neutral-500" : "text-neutral-500"
                      }`}
                    >
                      {step.detail}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default ResearchProgress;
