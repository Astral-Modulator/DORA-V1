import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MovingBorder } from "./MovingBorder.js";
import { useTheme } from "../context/ThemeContext.js";
import { useAuth } from "../context/AuthContext.js";
import { ThemeToggle } from "./ThemeToggle.js";
import BlurText from "./BlurText.js";
import {
  ArrowRight,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from "lucide-react";

type AuthMode = "signin" | "register" | "forgot";

export const LoginPage: React.FC = () => {
  const { isDark } = useTheme();
  const { loginWithGoogle, loginWithGithub, loginWithEmail, isLoading } = useAuth();

  const [mode, setMode] = useState<AuthMode>("signin");

  // Form Fields (Persistent in state across collapse/expand)
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Interaction / Expansion States
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isTouchExpanded, setIsTouchExpanded] = useState(false);

  // States & Feedback
  const [authError, setAuthError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingProvider, setPendingProvider] = useState<"google" | "github" | "email" | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Determine if form should be open
  const isExpanded = isHovered || isFocused || isTouchExpanded;

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    // 120ms buffer to prevent hover jitter across borders
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 120);
  };

  const handleFocusCapture = () => {
    setIsFocused(true);
  };

  const handleBlurCapture = (e: React.FocusEvent<HTMLDivElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsFocused(false);
    }
  };

  const handleCardClick = () => {
    if (!isExpanded) {
      setIsTouchExpanded(true);
    }
  };

  const handleToggleCollapse = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsTouchExpanded((prev) => !prev);
    setIsHovered(false);
    setIsFocused(false);
  };

  const handleModeSwitch = (newMode: AuthMode) => {
    setAuthError(null);
    setSuccessMessage(null);
    setMode(newMode);
  };

  const handleGoogleAuth = async () => {
    try {
      setAuthError(null);
      setPendingProvider("google");
      await loginWithGoogle();
    } catch (err: any) {
      setAuthError(err?.message || "Failed to sign in with Google. Please try again.");
    } finally {
      setPendingProvider(null);
    }
  };

  const handleGithubAuth = async () => {
    try {
      setAuthError(null);
      setPendingProvider("github");
      await loginWithGithub();
    } catch (err: any) {
      setAuthError(err?.message || "Failed to sign in with GitHub. Please try again.");
    } finally {
      setPendingProvider(null);
    }
  };

  const validateEmail = (emailStr: string) => {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(emailStr.trim());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setSuccessMessage(null);

    // Common email validation
    if (!email.trim()) {
      setAuthError("Please enter your email address.");
      return;
    }
    if (!validateEmail(email)) {
      setAuthError("Please enter a valid email address.");
      return;
    }

    // Forgot Password Flow
    if (mode === "forgot") {
      setIsSubmitting(true);
      try {
        await new Promise((res) => setTimeout(res, 600));
        setSuccessMessage("Password reset instructions have been sent to your email.");
      } catch (err: any) {
        setAuthError("Unable to send reset link right now. Please try again later.");
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // Password validation for Sign In & Register
    if (!password) {
      setAuthError("Please enter your password.");
      return;
    }
    if (password.length < 6) {
      setAuthError("Password must be at least 6 characters long.");
      return;
    }

    // Register-specific validation
    if (mode === "register") {
      if (!name.trim()) {
        setAuthError("Please enter your name.");
        return;
      }
      if (password !== confirmPassword) {
        setAuthError("Passwords do not match. Please verify and try again.");
        return;
      }
    }

    // Submit Auth
    try {
      setIsSubmitting(true);
      setPendingProvider("email");
      await loginWithEmail(email, mode === "register" ? name : undefined);
    } catch (err: any) {
      setAuthError(err?.message || "Authentication failed. Please check your credentials and try again.");
    } finally {
      setIsSubmitting(false);
      setPendingProvider(null);
    }
  };

  const hasEnteredData = Boolean(email.trim() || password || name.trim());

  return (
    <div className="w-full min-h-[85vh] flex flex-col justify-between items-center py-6 px-4 relative z-10">
      {/* Top Header Bar */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md flex items-center justify-between mb-6"
      >
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span
            className={`text-[11px] font-mono tracking-wider uppercase ${
              isDark ? "text-neutral-400" : "text-neutral-500"
            }`}
          >
            {isExpanded
              ? mode === "signin"
                ? "Access Verification"
                : mode === "register"
                ? "Account Registration"
                : "Account Recovery"
              : "Authentication Gateway"}
          </span>
        </div>
        <ThemeToggle />
      </motion.div>

      {/* Main Authentication Container */}
      <div className="w-full max-w-md my-auto flex flex-col items-center">
        {/* DORA Brand Display Header */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.45 }}
          className="text-center mb-6 flex flex-col items-center"
        >
          <BlurText
            text="D O R A"
            delay={120}
            animateBy="words"
            direction="top"
            stepDuration={0.35}
            className={`text-4xl sm:text-5xl font-bold tracking-[0.3em] justify-center text-center select-none ${
              isDark ? "text-neutral-100" : "text-neutral-900"
            }`}
          />
          <p
            className={`text-xs font-mono tracking-widest mt-2.5 uppercase ${
              isDark ? "text-neutral-400" : "text-neutral-600"
            }`}
          >
            DEEP ORCHESTRATION RESEARCH ASSISTANT
          </p>
          <div
            className={`flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full text-[11px] font-mono transition-colors ${
              isDark
                ? "text-neutral-400 bg-neutral-900/40 border border-neutral-800/60"
                : "text-neutral-600 bg-neutral-100 border border-neutral-300"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>Encrypted research workspace authentication</span>
          </div>
        </motion.div>

        {/* Stable Outer Hover Boundary Box */}
        <div
          ref={containerRef}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onFocusCapture={handleFocusCapture}
          onBlurCapture={handleBlurCapture}
          onClick={handleCardClick}
          className="w-full relative cursor-pointer"
        >
          {/* Animated Glowing Perimeter Wrapper */}
          <motion.div
            id="login-card-wrapper"
            layout
            transition={{
              layout: { duration: 0.38, ease: [0.16, 1, 0.3, 1] },
            }}
            className={`w-full relative rounded-2xl p-[1.5px] overflow-hidden transition-all duration-300 ${
              isDark
                ? "bg-neutral-800/90 shadow-2xl shadow-black/90 ring-1 ring-neutral-700/60"
                : "bg-neutral-200/90 shadow-xl shadow-neutral-300/60 ring-1 ring-neutral-300/80"
            }`}
          >
            {/* Continuous Glowing Edge Movement */}
            <MovingBorder duration={8000} rx={16} ry={16}>
              <div
                className={`opacity-100 ${
                  isDark
                    ? "w-36 h-36 bg-[radial-gradient(circle_at_center,#ffffff_0%,rgba(255,255,255,0.9)_25%,rgba(255,255,255,0.3)_50%,transparent_70%)] filter drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]"
                    : "w-36 h-36 bg-[radial-gradient(circle_at_center,#18181b_0%,rgba(24,24,27,0.85)_25%,rgba(24,24,27,0.3)_50%,transparent_70%)] filter drop-shadow-[0_0_8px_rgba(0,0,0,0.25)]"
                }`}
                aria-hidden="true"
              />
            </MovingBorder>

            {/* Form Surface Card */}
            <div
              className={`relative z-10 rounded-[14.5px] shadow-inner transition-colors duration-200 ${
                isDark
                  ? "bg-[#18181b] border border-neutral-800/90"
                  : "bg-white border border-neutral-200/90"
              }`}
            >
              {/* Compact Header Bar (Always visible, serves as closed state preview and open state header) */}
              <div
                className={`flex items-center justify-between p-4 sm:p-5 transition-colors ${
                  isExpanded
                    ? isDark
                      ? "border-b border-neutral-800/80"
                      : "border-b border-neutral-100"
                    : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all ${
                      isExpanded
                        ? isDark
                          ? "bg-neutral-800 text-neutral-100 border-neutral-700"
                          : "bg-neutral-100 text-neutral-900 border-neutral-300"
                        : isDark
                        ? "bg-neutral-900 text-neutral-400 border-neutral-800"
                        : "bg-neutral-50 text-neutral-600 border-neutral-200"
                    }`}
                  >
                    <KeyRound className="w-4 h-4 text-emerald-400 shrink-0" />
                  </div>

                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-semibold tracking-wide transition-colors ${
                          isDark ? "text-neutral-100" : "text-neutral-900"
                        }`}
                      >
                        {isExpanded
                          ? mode === "signin"
                            ? "Sign In"
                            : mode === "register"
                            ? "Register"
                            : "Account Recovery"
                          : "DORA Authentication"}
                      </span>

                      {hasEnteredData && !isExpanded && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-950/60 text-emerald-300 border border-emerald-800/60">
                          Draft Saved
                        </span>
                      )}
                    </div>

                    <p
                      className={`text-[11px] font-mono transition-colors ${
                        isDark ? "text-neutral-400" : "text-neutral-500"
                      }`}
                    >
                      {isExpanded
                        ? mode === "signin"
                          ? "Enter your credentials to unlock workspace"
                          : mode === "register"
                          ? "Create your autonomous research profile"
                          : "Password recovery flow"
                        : hasEnteredData
                        ? `${email ? email : "In progress"} • Hover or tap to expand`
                        : "Hover or tap to authenticate"}
                    </p>
                  </div>
                </div>

                {/* Right Action Indicator / Toggle */}
                <div className="flex items-center gap-2">
                  {!isExpanded ? (
                    <motion.div
                      animate={{ y: [0, 2, 0] }}
                      transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono border ${
                        isDark
                          ? "bg-neutral-900/80 border-neutral-700/80 text-neutral-300"
                          : "bg-neutral-100 border-neutral-300 text-neutral-700"
                      }`}
                    >
                      <Sparkles className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span className="hidden sm:inline">Hover to open</span>
                      <ChevronDown className="w-3.5 h-3.5" />
                    </motion.div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleToggleCollapse}
                      title="Collapse form"
                      className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer border ${
                        isDark
                          ? "text-neutral-400 hover:text-neutral-200 bg-neutral-900 border-neutral-800 hover:border-neutral-700"
                          : "text-neutral-600 hover:text-neutral-900 bg-neutral-100 border-neutral-200 hover:border-neutral-300"
                      }`}
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Collapsible Form Body (Kept permanently in DOM to retain state across expand/collapse) */}
              <motion.div
                initial={false}
                animate={{
                  height: isExpanded ? "auto" : 0,
                  opacity: isExpanded ? 1 : 0,
                }}
                transition={{
                  height: { duration: 0.38, ease: [0.16, 1, 0.3, 1] },
                  opacity: { duration: isExpanded ? 0.28 : 0.15, delay: isExpanded ? 0.08 : 0 },
                }}
                style={{
                  overflow: "hidden",
                  pointerEvents: isExpanded ? "auto" : "none",
                }}
                className="flex flex-col"
              >
                <div className="p-6 sm:p-7 pt-5 flex flex-col gap-5">
                  {/* Mode Switcher Tabs (Sign In / Register) */}
                  {mode !== "forgot" ? (
                    <div
                      className={`grid grid-cols-2 p-1 rounded-xl border text-xs font-medium ${
                        isDark
                          ? "bg-[#121214] border-neutral-800/80"
                          : "bg-neutral-100 border-neutral-200"
                      }`}
                    >
                      <button
                        id="tab-signin-btn"
                        type="button"
                        onClick={() => handleModeSwitch("signin")}
                        className={`py-1.5 px-3 rounded-lg transition-all duration-200 cursor-pointer ${
                          mode === "signin"
                            ? isDark
                              ? "bg-[#27272a] text-white shadow-sm font-semibold"
                              : "bg-white text-neutral-900 shadow-sm font-semibold"
                            : isDark
                            ? "text-neutral-400 hover:text-neutral-200"
                            : "text-neutral-500 hover:text-neutral-800"
                        }`}
                      >
                        Sign In
                      </button>
                      <button
                        id="tab-register-btn"
                        type="button"
                        onClick={() => handleModeSwitch("register")}
                        className={`py-1.5 px-3 rounded-lg transition-all duration-200 cursor-pointer ${
                          mode === "register"
                            ? isDark
                              ? "bg-[#27272a] text-white shadow-sm font-semibold"
                              : "bg-white text-neutral-900 shadow-sm font-semibold"
                            : isDark
                            ? "text-neutral-400 hover:text-neutral-200"
                            : "text-neutral-500 hover:text-neutral-800"
                        }`}
                      >
                        Register
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => handleModeSwitch("signin")}
                        className={`inline-flex items-center gap-1.5 text-xs font-mono transition-colors cursor-pointer ${
                          isDark
                            ? "text-neutral-400 hover:text-neutral-100"
                            : "text-neutral-600 hover:text-neutral-900"
                        }`}
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Back to Sign In</span>
                      </button>
                      <span className="text-[11px] font-mono text-neutral-500">Recovery</span>
                    </div>
                  )}

                  {/* Header Subtitle */}
                  <div className="flex flex-col gap-1">
                    <h2
                      className={`text-base font-semibold transition-colors ${
                        isDark ? "text-neutral-100" : "text-neutral-900"
                      }`}
                    >
                      {mode === "signin"
                        ? "Welcome Back"
                        : mode === "register"
                        ? "Create Your Account"
                        : "Reset Password"}
                    </h2>
                    <p
                      className={`text-xs transition-colors ${
                        isDark ? "text-neutral-400" : "text-neutral-600"
                      }`}
                    >
                      {mode === "signin"
                        ? "Continue with your developer account or enter credentials."
                        : mode === "register"
                        ? "Set up your credentials to initiate deep autonomous research."
                        : "Enter your registered email to receive a password recovery link."}
                    </p>
                  </div>

                  {/* Error Notification Banner */}
                  <AnimatePresence mode="wait">
                    {authError && (
                      <motion.div
                        key="auth-error"
                        initial={{ opacity: 0, y: -6, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: "auto" }}
                        exit={{ opacity: 0, y: -6, height: 0 }}
                        className={`p-3 rounded-lg text-xs flex items-start gap-2 border ${
                          isDark
                            ? "bg-red-950/40 border-red-800/60 text-red-300"
                            : "bg-red-50 border-red-200 text-red-700"
                        }`}
                      >
                        <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                        <span className="leading-relaxed">{authError}</span>
                      </motion.div>
                    )}

                    {/* Success Notification Banner */}
                    {successMessage && (
                      <motion.div
                        key="auth-success"
                        initial={{ opacity: 0, y: -6, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: "auto" }}
                        exit={{ opacity: 0, y: -6, height: 0 }}
                        className={`p-3 rounded-lg text-xs flex items-start gap-2 border ${
                          isDark
                            ? "bg-emerald-950/40 border-emerald-800/60 text-emerald-300"
                            : "bg-emerald-50 border-emerald-200 text-emerald-800"
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                        <span className="leading-relaxed">{successMessage}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* OAuth Actions (Sign In & Register) */}
                  {mode !== "forgot" && (
                    <>
                      <div className="flex flex-col gap-2.5">
                        {/* Google OAuth Button */}
                        <motion.button
                          id="btn-login-google"
                          type="button"
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleGoogleAuth}
                          disabled={isLoading || isSubmitting}
                          className={`w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-lg text-xs font-medium transition-all cursor-pointer shadow-sm disabled:opacity-50 ${
                            isDark
                              ? "bg-[#222226] hover:bg-[#2a2a30] text-neutral-100 border border-neutral-700/80 hover:border-neutral-600"
                              : "bg-neutral-50 hover:bg-neutral-100 text-neutral-800 border border-neutral-300 hover:border-neutral-400"
                          }`}
                        >
                          {pendingProvider === "google" ? (
                            <div
                              className={`w-4 h-4 border-2 rounded-full animate-spin ${
                                isDark
                                  ? "border-neutral-500 border-t-white"
                                  : "border-neutral-400 border-t-neutral-900"
                              }`}
                            />
                          ) : (
                            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                              <path
                                fill="#4285F4"
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                              />
                              <path
                                fill="#34A853"
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                              />
                              <path
                                fill="#FBBC05"
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                              />
                              <path
                                fill="#EA4335"
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                              />
                            </svg>
                          )}
                          <span>Continue with Google</span>
                        </motion.button>

                        {/* GitHub OAuth Button */}
                        <motion.button
                          id="btn-login-github"
                          type="button"
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleGithubAuth}
                          disabled={isLoading || isSubmitting}
                          className={`w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-lg text-xs font-medium transition-all cursor-pointer shadow-sm disabled:opacity-50 ${
                            isDark
                              ? "bg-[#222226] hover:bg-[#2a2a30] text-neutral-100 border border-neutral-700/80 hover:border-neutral-600"
                              : "bg-neutral-50 hover:bg-neutral-100 text-neutral-800 border border-neutral-300 hover:border-neutral-400"
                          }`}
                        >
                          {pendingProvider === "github" ? (
                            <div
                              className={`w-4 h-4 border-2 rounded-full animate-spin ${
                                isDark
                                  ? "border-neutral-500 border-t-white"
                                  : "border-neutral-400 border-t-neutral-900"
                              }`}
                            />
                          ) : (
                            <svg
                              className={`w-4 h-4 fill-current shrink-0 ${
                                isDark ? "text-white" : "text-neutral-900"
                              }`}
                              viewBox="0 0 24 24"
                            >
                              <path
                                fillRule="evenodd"
                                clipRule="evenodd"
                                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                              />
                            </svg>
                          )}
                          <span>Continue with GitHub</span>
                        </motion.button>
                      </div>

                      {/* Aesthetic Divider */}
                      <div className="relative flex items-center justify-center my-0.5">
                        <div
                          className={`border-t w-full ${
                            isDark ? "border-neutral-800" : "border-neutral-200"
                          }`}
                        />
                        <span
                          className={`px-3 text-[11px] font-mono uppercase tracking-wider shrink-0 transition-colors ${
                            isDark
                              ? "bg-[#18181b] text-neutral-400"
                              : "bg-white text-neutral-500"
                          }`}
                        >
                          or with credentials
                        </span>
                        <div
                          className={`border-t w-full ${
                            isDark ? "border-neutral-800" : "border-neutral-200"
                          }`}
                        />
                      </div>
                    </>
                  )}

                  {/* Email & Password Form */}
                  <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
                    {/* Register: Full Name Field */}
                    {mode === "register" && (
                      <div className="flex flex-col gap-1.5">
                        <label
                          htmlFor="auth-name-input"
                          className={`text-[11px] font-mono transition-colors ${
                            isDark ? "text-neutral-300" : "text-neutral-700"
                          }`}
                        >
                          Full Name
                        </label>
                        <div className="relative">
                          <User className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                          <input
                            id="auth-name-input"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Dr. Alex Rivera"
                            autoComplete="name"
                            disabled={isLoading || isSubmitting}
                            className={`w-full rounded-lg pl-9 pr-3 py-2 text-xs outline-none transition-all duration-200 ${
                              isDark
                                ? "bg-[#121214] border border-neutral-700/80 focus:border-neutral-400 text-neutral-100 placeholder:text-neutral-400"
                                : "bg-neutral-50 border border-neutral-300 focus:border-neutral-600 text-neutral-900 placeholder:text-neutral-500"
                            }`}
                          />
                        </div>
                      </div>
                    )}

                    {/* Email Address Field */}
                    <div className="flex flex-col gap-1.5">
                      <label
                        htmlFor="auth-email-input"
                        className={`text-[11px] font-mono transition-colors ${
                          isDark ? "text-neutral-300" : "text-neutral-700"
                        }`}
                      >
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                        <input
                          id="auth-email-input"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="researcher@lab.org"
                          autoComplete="email"
                          disabled={isLoading || isSubmitting}
                          className={`w-full rounded-lg pl-9 pr-3 py-2 text-xs outline-none transition-all duration-200 ${
                            isDark
                              ? "bg-[#121214] border border-neutral-700/80 focus:border-neutral-400 text-neutral-100 placeholder:text-neutral-400"
                              : "bg-neutral-50 border border-neutral-300 focus:border-neutral-600 text-neutral-900 placeholder:text-neutral-500"
                          }`}
                        />
                      </div>
                    </div>

                    {/* Password Fields for Sign In and Register */}
                    {mode !== "forgot" && (
                      <>
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center justify-between">
                            <label
                              htmlFor="auth-password-input"
                              className={`text-[11px] font-mono transition-colors ${
                                isDark ? "text-neutral-300" : "text-neutral-700"
                              }`}
                            >
                              Password
                            </label>
                            {mode === "signin" && (
                              <button
                                type="button"
                                onClick={() => handleModeSwitch("forgot")}
                                className={`text-[11px] font-mono transition-colors hover:underline cursor-pointer ${
                                  isDark
                                    ? "text-neutral-400 hover:text-neutral-200"
                                    : "text-neutral-500 hover:text-neutral-900"
                                }`}
                              >
                                Forgot Password?
                              </button>
                            )}
                          </div>
                          <div className="relative">
                            <Lock className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                            <input
                              id="auth-password-input"
                              type={showPassword ? "text" : "password"}
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              placeholder="••••••••••••"
                              autoComplete={mode === "signin" ? "current-password" : "new-password"}
                              disabled={isLoading || isSubmitting}
                              className={`w-full rounded-lg pl-9 pr-10 py-2 text-xs outline-none transition-all duration-200 ${
                                isDark
                                  ? "bg-[#121214] border border-neutral-700/80 focus:border-neutral-400 text-neutral-100 placeholder:text-neutral-400"
                                  : "bg-neutral-50 border border-neutral-300 focus:border-neutral-600 text-neutral-900 placeholder:text-neutral-500"
                              }`}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              aria-label={showPassword ? "Hide password" : "Show password"}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-200 cursor-pointer"
                            >
                              {showPassword ? (
                                <EyeOff className="w-3.5 h-3.5" />
                              ) : (
                                <Eye className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Register: Confirm Password */}
                        {mode === "register" && (
                          <div className="flex flex-col gap-1.5">
                            <label
                              htmlFor="auth-confirm-password-input"
                              className={`text-[11px] font-mono transition-colors ${
                                isDark ? "text-neutral-300" : "text-neutral-700"
                              }`}
                            >
                              Confirm Password
                            </label>
                            <div className="relative">
                              <Lock className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                              <input
                                id="auth-confirm-password-input"
                                type={showConfirmPassword ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="••••••••••••"
                                autoComplete="new-password"
                                disabled={isLoading || isSubmitting}
                                className={`w-full rounded-lg pl-9 pr-10 py-2 text-xs outline-none transition-all duration-200 ${
                                  isDark
                                    ? "bg-[#121214] border border-neutral-700/80 focus:border-neutral-400 text-neutral-100 placeholder:text-neutral-400"
                                    : "bg-neutral-50 border border-neutral-300 focus:border-neutral-600 text-neutral-900 placeholder:text-neutral-500"
                                }`}
                              />
                              <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                aria-label={
                                  showConfirmPassword
                                    ? "Hide confirmed password"
                                    : "Show confirmed password"
                                }
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-200 cursor-pointer"
                              >
                                {showConfirmPassword ? (
                                  <EyeOff className="w-3.5 h-3.5" />
                                ) : (
                                  <Eye className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    {/* Submit CTA Button */}
                    <motion.button
                      id="btn-auth-submit"
                      type="submit"
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={isLoading || isSubmitting}
                      className={`w-full mt-1.5 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs font-semibold transition-all cursor-pointer disabled:cursor-not-allowed shadow-md ${
                        isDark
                          ? "bg-neutral-100 hover:bg-white text-black ring-1 ring-white/60 shadow-black/40"
                          : "bg-neutral-900 hover:bg-black text-white ring-1 ring-black/40 shadow-neutral-900/20"
                      }`}
                    >
                      {isSubmitting ? (
                        <>
                          <div
                            className={`w-3.5 h-3.5 border-2 rounded-full animate-spin ${
                              isDark
                                ? "border-neutral-800 border-t-black"
                                : "border-neutral-400 border-t-white"
                            }`}
                          />
                          <span>
                            {mode === "signin"
                              ? "Signing in..."
                              : mode === "register"
                              ? "Creating account..."
                              : "Sending recovery link..."}
                          </span>
                        </>
                      ) : (
                        <>
                          <span>
                            {mode === "signin"
                              ? "Sign In to Workspace"
                              : mode === "register"
                              ? "Create DORA Account"
                              : "Send Recovery Link"}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </motion.button>
                  </form>

                  {/* Bottom Footer Switches */}
                  <div className="pt-1 text-center">
                    {mode === "signin" ? (
                      <p
                        className={`text-xs font-mono transition-colors ${
                          isDark ? "text-neutral-400" : "text-neutral-600"
                        }`}
                      >
                        Don&apos;t have an account?{" "}
                        <button
                          type="button"
                          onClick={() => handleModeSwitch("register")}
                          className={`font-semibold underline underline-offset-4 cursor-pointer transition-colors ${
                            isDark
                              ? "text-neutral-200 hover:text-white"
                              : "text-neutral-900 hover:text-black"
                          }`}
                        >
                          Create Account
                        </button>
                      </p>
                    ) : mode === "register" ? (
                      <p
                        className={`text-xs font-mono transition-colors ${
                          isDark ? "text-neutral-400" : "text-neutral-600"
                        }`}
                      >
                        Already have an account?{" "}
                        <button
                          type="button"
                          onClick={() => handleModeSwitch("signin")}
                          className={`font-semibold underline underline-offset-4 cursor-pointer transition-colors ${
                            isDark
                              ? "text-neutral-200 hover:text-white"
                              : "text-neutral-900 hover:text-black"
                          }`}
                        >
                          Sign In
                        </button>
                      </p>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleModeSwitch("signin")}
                        className={`text-xs font-mono underline underline-offset-4 cursor-pointer transition-colors ${
                          isDark
                            ? "text-neutral-400 hover:text-neutral-200"
                            : "text-neutral-600 hover:text-neutral-900"
                        }`}
                      >
                        Return to Sign In
                      </button>
                    )}
                  </div>

                  {/* Feature Highlights / Badges */}
                  <div
                    className={`pt-3 border-t grid grid-cols-2 gap-2 text-[11px] font-mono transition-colors ${
                      isDark
                        ? "border-neutral-800/80 text-neutral-400"
                        : "border-neutral-200 text-neutral-600"
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                      <span>Multi-source queries</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                      <span>PDF Citation Extraction</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Accessible Minimal Footer */}
      <footer
        className={`py-4 text-center text-[11px] font-mono transition-colors ${
          isDark ? "text-neutral-600" : "text-neutral-500"
        }`}
      >
        DORA Autonomous Research &bull; Encrypted &amp; Verified Sessions
      </footer>
    </div>
  );
};
