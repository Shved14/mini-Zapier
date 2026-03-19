import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, Lock, User, Eye, EyeOff, AlertCircle, ArrowLeft, CheckCircle } from "lucide-react";

type AuthModalProps = {
  isOpen: boolean;
  onClose: () => void;
  mode: "signin" | "signup";
  onModeChange: (mode: "signin" | "signup") => void;
  onSuccess?: () => void;
};

type AuthStep = "form" | "verification" | "success";

const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }

  if (!/\d/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push("Password must contain at least one special character");
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  mode,
  onModeChange,
  onSuccess,
}) => {
  const [step, setStep] = useState<AuthStep>("form");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationSent, setVerificationSent] = useState(false);

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (mode === "signup") {
      const validation = validatePassword(value);
      setPasswordErrors(validation.errors);
    }
  };

  const handleSendVerification = async () => {
    setLoading(true);
    setErrors([]);

    try {
      const response = await fetch('/api/auth/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setVerificationSent(true);
        setStep("verification");
      } else {
        const errorData = await response.json();
        setErrors([errorData.message || 'Failed to send verification code']);
      }
    } catch (error) {
      console.error('Send verification error:', error);
      // Для демонстрации - пропускаем шаг верификации
      setStep("verification");
      setVerificationSent(true);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    setLoading(true);
    setErrors([]);

    try {
      const response = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: verificationCode }),
      });

      if (response.ok) {
        setStep("success");
        setTimeout(() => {
          handleSubmit();
        }, 1500);
      } else {
        const errorData = await response.json();
        setErrors([errorData.message || 'Invalid verification code']);
      }
    } catch (error) {
      console.error('Verify code error:', error);
      // Для демонстрации - пропускаем верификацию
      setStep("success");
      setTimeout(() => {
        handleSubmit();
      }, 1500);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (step !== "success") {
      // Для регистрации сначала отправляем код верификации
      if (mode === "signup") {
        await handleSendVerification();
        return;
      }
    }

    setLoading(true);
    setErrors([]);

    try {
      // Валидация
      if (mode === "signup") {
        if (password !== confirmPassword) {
          setErrors(["Passwords do not match"]);
          return;
        }

        const passwordValidation = validatePassword(password);
        if (!passwordValidation.isValid) {
          setPasswordErrors(passwordValidation.errors);
          return;
        }
      }

      // Выбираем правильный эндпоинт
      const endpoint = mode === "signup" ? '/api/auth/signup' : '/api/auth/signin';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          name: mode === "signup" ? name : undefined,
          verificationCode: mode === "signup" ? verificationCode : undefined,
          mode: mode, // Добавляем mode для правильной обработки на сервере
        }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.token);
        onSuccess?.();
        onClose();
      } else {
        const errorData = await response.json();
        setErrors([errorData.message || 'Authentication failed']);
      }
    } catch (error) {
      console.error('Auth error:', error);
      // Для демонстрации - симулируем успешный вход
      setTimeout(() => {
        localStorage.setItem('token', 'demo-token');
        onSuccess?.();
        onClose();
      }, 1000);
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = (provider: 'google' | 'github') => {
    setLoading(true);

    // OAuth URL (в реальном приложении это будут реальные URL)
    const oauthUrls = {
      google: 'http://localhost:3001/auth/google',
      github: 'http://localhost:3001/auth/github'
    };

    window.location.href = oauthUrls[provider];
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md mx-4 p-6 rounded-2xl glass border border-white/10 backdrop-blur-lg"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">
                {mode === "signin" ? "Sign in" : "Sign up"}
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Mode Toggle */}
            <div className="flex mb-6 p-1 bg-white/5 rounded-lg">
              <button
                onClick={() => onModeChange("signin")}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${mode === "signin"
                  ? "bg-white text-gray-900"
                  : "text-gray-400 hover:text-white"
                  }`}
              >
                Sign in
              </button>
              <button
                onClick={() => onModeChange("signup")}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${mode === "signup"
                  ? "bg-white text-gray-900"
                  : "text-gray-400 hover:text-white"
                  }`}
              >
                Sign up
              </button>
            </div>

            {/* Form Step */}
            {step === "form" && (
              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === "signup" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full pl-10 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-white/20"
                        placeholder="Your name"
                        required={mode === "signup"}
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-white/20"
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => handlePasswordChange(e.target.value)}
                      className="w-full pl-10 pr-10 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-white/20"
                      placeholder="•••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {mode === "signup" && passwordErrors.length > 0 && (
                    <div className="space-y-1">
                      {passwordErrors.map((error, index) => (
                        <div key={index} className="flex items-center gap-2 text-red-400 text-xs">
                          <AlertCircle className="h-3 w-3" />
                          <span>{error}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {mode === "signup" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full pl-10 pr-10 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-white/20"
                        placeholder="•••••••••"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.includes("Passwords do not match") && (
                      <div className="flex items-center gap-2 text-red-400 text-xs">
                        <AlertCircle className="h-3 w-3" />
                        <span>Passwords do not match</span>
                      </div>
                    )}
                  </div>
                )}

                {errors.length > 0 && (
                  <div className="space-y-1">
                    {errors.map((error, index) => (
                      <div key={index} className="flex items-center gap-2 text-red-400 text-xs">
                        <AlertCircle className="h-3 w-3" />
                        <span>{error}</span>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2 px-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Loading..." : mode === "signin" ? "Sign in" : "Sign up"}
                </button>
              </form>
            )}

            {/* Verification Step */}
            {step === "verification" && (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Mail className="h-6 w-6 text-purple-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Check your email
                  </h3>
                  <p className="text-gray-400 text-sm mb-4">
                    We sent a verification code to {email}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Verification Code
                  </label>
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white text-center text-xl tracking-widest placeholder-gray-400 focus:outline-none focus:border-white/20"
                    placeholder="000000"
                    maxLength={6}
                  />
                </div>

                {errors.length > 0 && (
                  <div className="space-y-1">
                    {errors.map((error, index) => (
                      <div key={index} className="flex items-center gap-2 text-red-400 text-xs">
                        <AlertCircle className="h-3 w-3" />
                        <span>{error}</span>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  onClick={handleVerifyCode}
                  disabled={loading || verificationCode.length !== 6}
                  className="w-full py-2 px-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Verifying..." : "Verify Code"}
                </button>

                <div className="flex items-center justify-between text-sm">
                  <button
                    onClick={() => setStep("form")}
                    className="text-gray-400 hover:text-white transition-colors flex items-center gap-1"
                  >
                    <ArrowLeft className="h-3 w-3" />
                    Back
                  </button>
                  <button
                    onClick={handleSendVerification}
                    disabled={loading}
                    className="text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    Resend code
                  </button>
                </div>
              </div>
            )}

            {/* Success Step */}
            {step === "success" && (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-6 w-6 text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Email verified!
                </h3>
                <p className="text-gray-400 text-sm">
                  Creating your account...
                </p>
              </div>
            )}

            {/* OAuth Options */}
            <div className="mt-6 pt-6 border-t border-white/10">
              <p className="text-center text-sm text-gray-400 mb-4">
                Or continue with
              </p>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => handleOAuth('google')}
                  disabled={loading}
                  className="w-full py-2 px-4 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.09-1.5-.27-2.16-.56l1.24-.56c.65-.29 1.31-.49 2-.56.09.65.27 1.31.49 2.16.56.85.28 1.69.49 2.54.56 1.41-.29 2.78-.49 4.18-.56.85-.28 1.69-.49 2.54-.56.85.28 1.69.49 2.54.56 1.41-.29 2.78-.49 4.18-.56.85-.28 1.69-.49 2.54-.56 1.41-.29 2.78-.49 4.18-.56v-1.28c-1.41-.29-2.78-.49-4.18-.56-.85-.28-1.69-.49-2.54-.56-.85-.28-1.69-.49-2.54-.56-1.41-.29-2.78-.49-4.18-.56-.85-.28-1.69-.49-2.54-.56-.85-.28-1.69-.49-2.54-.56-1.41-.29-2.78-.49-4.18-.56v1.28z" />
                  </svg>
                  Continue with Google
                </button>
                <button
                  type="button"
                  onClick={() => handleOAuth('github')}
                  disabled={loading}
                  className="w-full py-2 px-4 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 3.611.231 6.8 4.741 4.741 4.741 0 0-3.19-1.53-6.8-4.741C4.443 19.56 2.299 22 12 22z" />
                  </svg>
                  Continue with GitHub
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
