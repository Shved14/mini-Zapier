import React, { useState } from "react";
import { motion } from "framer-motion";

type LandingPageProps = {
  onGetStarted?: () => void;
  onViewDocs?: () => void;
};

export const LandingPage: React.FC<LandingPageProps> = ({
  onGetStarted,
  onViewDocs,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-dark text-white relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse-glow"></div>
      </div>

      <div className="relative z-10">
        <div className="mx-auto max-w-6xl px-4 pb-16 pt-10">
          {/* Header */}
          <motion.header
            className="flex flex-col items-center text-center gap-6 py-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="inline-flex items-center rounded-full border border-white/20 glass px-4 py-2 text-sm font-medium text-white/90 backdrop-blur-md"
            >
              <span className="w-2 h-2 rounded-full bg-gradient-to-r from-green-400 to-emerald-400 mr-2"></span>
              Mini Zapier • Developer Preview
            </motion.div>

            <motion.h1
              className="text-5xl md:text-6xl font-bold tracking-tight mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              Automate
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 animate-gradient">
                Everything
              </span>
            </motion.h1>

            <motion.p
              className="max-w-2xl text-lg text-gray-300 mb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              Build powerful workflows visually. Connect webhooks, APIs, cron jobs, email,
              Telegram and databases into reliable automation pipelines.
            </motion.p>

            <motion.div
              className="flex flex-wrap items-center justify-center gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onGetStarted}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className={`px-8 py-3 text-base font-medium rounded-full bg-gradient-to-r ${isHovered
                    ? 'from-purple-600 to-pink-600'
                    : 'from-purple-500 to-pink-500'
                  } text-white shadow-xl hover:shadow-2xl transition-all duration-300 neon-border`}
              >
                Start building workflows
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onViewDocs}
                className="px-8 py-3 text-base font-medium rounded-full glass border border-white/20 hover:bg-white/10 text-white/90 backdrop-blur-md transition-all duration-300"
              >
                View documentation
              </motion.button>
            </motion.div>
          </motion.header>

          {/* Features Section */}
          <motion.section
            className="mt-16"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <h2 className="text-2xl font-bold mb-8 text-center text-white">
              Everything you need to automate
            </h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <motion.div
                whileHover={{ y: -5 }}
                className="p-6 rounded-2xl glass border border-white/10 hover:border-white/20 transition-all duration-300 hover-glow"
              >
                <div className="text-emerald-400 text-2xl mb-3">🎯</div>
                <h3 className="text-lg font-semibold mb-2 text-white">Webhook triggers</h3>
                <p className="text-gray-300 text-sm">
                  Receive events from any service with HTTP webhooks and start workflows instantly.
                </p>
              </motion.div>

              <motion.div
                whileHover={{ y: -5 }}
                className="p-6 rounded-2xl glass border border-white/10 hover:border-white/20 transition-all duration-300 hover-glow"
              >
                <div className="text-blue-400 text-2xl mb-3">⏰</div>
                <h3 className="text-lg font-semibold mb-2 text-white">Cron automation</h3>
                <p className="text-gray-300 text-sm">
                  Schedule workflows with flexible cron expressions for recurring jobs.
                </p>
              </motion.div>

              <motion.div
                whileHover={{ y: -5 }}
                className="p-6 rounded-2xl glass border border-white/10 hover:border-white/20 transition-all duration-300 hover-glow"
              >
                <div className="text-purple-400 text-2xl mb-3">🔗</div>
                <h3 className="text-lg font-semibold mb-2 text-white">HTTP integrations</h3>
                <p className="text-gray-300 text-sm">
                  Call REST APIs, transform JSON and chain responses across multiple steps.
                </p>
              </motion.div>

              <motion.div
                whileHover={{ y: -5 }}
                className="p-6 rounded-2xl glass border border-white/10 hover:border-white/20 transition-all duration-300 hover-glow"
              >
                <div className="text-pink-400 text-2xl mb-3">🎨</div>
                <h3 className="text-lg font-semibold mb-2 text-white">Visual editor</h3>
                <p className="text-gray-300 text-sm">
                  Design workflows with a drag-and-drop canvas powered by React Flow.
                </p>
              </motion.div>
            </div>
          </motion.section>

          {/* Workflow Editor Preview */}
          <motion.section
            className="mt-20"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            <h2 className="text-2xl font-bold mb-6 text-center text-white">
              Design workflows like a pipeline
            </h2>
            <motion.div
              className="rounded-3xl border border-white/10 glass p-8 shadow-2xl"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
            >
              <p className="text-gray-300 mb-6 text-center">
                Orchestrate complex automations visually. Each node is a reliable,
                logged step with retries, backoff and pause/resume support.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-4">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="px-4 py-2 rounded-full bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 border border-emerald-400/30 flex items-center gap-2"
                >
                  <div className="w-2 h-2 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500"></div>
                  <span className="text-sm text-white font-medium">Trigger</span>
                </motion.div>

                <div className="text-2xl text-gray-400">→</div>

                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
                  className="px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/20 to-purple-600/20 border border-purple-400/30 flex items-center gap-2"
                >
                  <div className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-400 to-purple-500"></div>
                  <span className="text-sm text-white font-medium">HTTP</span>
                </motion.div>

                <div className="text-2xl text-gray-400">→</div>

                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
                  className="px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/20 to-blue-600/20 border border-blue-400/30 flex items-center gap-2"
                >
                  <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-400 to-blue-500"></div>
                  <span className="text-sm text-white font-medium">Transform</span>
                </motion.div>

                <div className="text-2xl text-gray-400">→</div>

                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.9 }}
                  className="px-4 py-2 rounded-full bg-gradient-to-r from-indigo-500/20 to-indigo-600/20 border border-indigo-400/30 flex items-center gap-2"
                >
                  <div className="w-2 h-2 rounded-full bg-gradient-to-r from-indigo-400 to-indigo-500"></div>
                  <span className="text-sm text-white font-medium">Telegram</span>
                </motion.div>
              </div>
            </motion.div>
          </motion.section>

          {/* Integrations */}
          <motion.section
            className="mt-20"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1 }}
          >
            <h2 className="text-2xl font-bold mb-8 text-center text-white">
              Built-in integrations
            </h2>
            <div className="flex flex-wrap justify-center gap-4">
              {[
                { label: "Telegram Bot API", color: "from-blue-400 to-cyan-300", icon: "🤖" },
                { label: "Email (SMTP)", color: "from-emerald-400 to-green-300", icon: "📧" },
                { label: "HTTP / REST APIs", color: "from-purple-400 to-pink-300", icon: "🔗" },
                { label: "PostgreSQL", color: "from-blue-400 to-indigo-300", icon: "🗄️" },
              ].map((integration, index) => (
                <motion.div
                  key={integration.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 1.2 + index * 0.1 }}
                  whileHover={{ scale: 1.05, y: -2 }}
                  className="px-4 py-2 rounded-full glass border border-white/10 hover:border-white/20 transition-all duration-300"
                >
                  <span className="text-lg mr-2">{integration.icon}</span>
                  <span className="text-sm text-white">{integration.label}</span>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* CTA Section */}
          <motion.section
            className="mt-24"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.2 }}
          >
            <div className="rounded-3xl border border-white/20 bg-gradient-to-r from-purple-600/20 via-blue-600/20 to-emerald-600/20 px-8 py-12 text-center glass backdrop-blur-lg">
              <h2 className="text-3xl font-bold mb-4 text-white">
                Create your first workflow in minutes
              </h2>
              <p className="text-gray-200 mb-8 text-lg">
                Start with a webhook trigger, connect an HTTP step and send yourself a Telegram notification.
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onGetStarted}
                className="px-8 py-3 text-lg font-semibold rounded-full glass border border-white/20 hover:bg-white/10 text-white transition-all duration-300"
              >
                Open dashboard
              </motion.button>
            </div>
          </motion.section>
        </div>
      </div>
    </div>
  );
};

type FeatureCardProps = {
  title: string;
  description: string;
};

const FeatureCard: React.FC<FeatureCardProps> = ({ title, description }) => (
  <div className="rounded-xl glass border border-white/10 p-6 hover:border-white/20 transition-all duration-300 hover:shadow-xl">
    <h3 className="text-lg font-semibold mb-2 text-white">{title}</h3>
    <p className="text-gray-300">{description}</p>
  </div>
);

