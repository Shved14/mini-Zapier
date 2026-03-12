import React from "react";

type LandingPageProps = {
  onGetStarted?: () => void;
  onViewDocs?: () => void;
};

export const LandingPage: React.FC<LandingPageProps> = ({
  onGetStarted,
  onViewDocs,
}) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-6xl px-4 pb-16 pt-10">
        <header className="flex flex-col items-center text-center gap-6 py-10">
          <span className="inline-flex items-center rounded-full border border-primary-500/40 bg-primary-500/10 px-3 py-1 text-xs font-medium text-primary-200">
            Mini Zapier • Developer preview
          </span>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Automate{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-emerald-300">
              Everything
            </span>
          </h1>
          <p className="max-w-2xl text-sm md:text-base text-slate-300">
            Build powerful workflows visually. Connect webhooks, APIs, cron
            jobs, email, Telegram and databases into reliable automation
            pipelines.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
            <button
              onClick={onGetStarted}
              className="px-5 py-2.5 text-sm font-medium rounded-lg bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-400 hover:to-primary-500 shadow-lg shadow-primary-900/40"
            >
              Start building workflows
            </button>
            <button
              onClick={onViewDocs}
              className="px-5 py-2.5 text-sm font-medium rounded-lg border border-slate-700 bg-slate-900/60 hover:bg-slate-800"
            >
              View documentation
            </button>
          </div>
        </header>

        <section className="mt-12">
          <h2 className="text-lg font-semibold mb-4 text-slate-100">
            Everything you need to automate
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <FeatureCard
              title="Webhook triggers"
              description="Receive events from any service with HTTP webhooks and start workflows instantly."
            />
            <FeatureCard
              title="Cron automation"
              description="Schedule workflows with flexible cron expressions for recurring jobs."
            />
            <FeatureCard
              title="HTTP integrations"
              description="Call REST APIs, transform JSON and chain responses across multiple steps."
            />
            <FeatureCard
              title="Visual editor"
              description="Design workflows with a drag-and-drop canvas powered by React Flow."
            />
          </div>
        </section>

        <section className="mt-14">
          <h2 className="text-lg font-semibold mb-4 text-slate-100">
            Design workflows like a pipeline
          </h2>
          <div className="rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/80 to-slate-950/90 p-6">
            <p className="text-sm text-slate-300 mb-4">
              Orchestrate complex automations visually. Each node is a
              reliable, logged step with retries, backoff and pause/resume
              support.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 text-xs">
              <PipelineNode
                label="Trigger"
                accent="from-emerald-400 to-emerald-300"
              />
              <PipelineArrow />
              <PipelineNode
                label="HTTP"
                accent="from-primary-400 to-primary-300"
              />
              <PipelineArrow />
              <PipelineNode
                label="Transform"
                accent="from-sky-400 to-cyan-300"
              />
              <PipelineArrow />
              <PipelineNode
                label="Telegram"
                accent="from-indigo-400 to-violet-300"
              />
              <PipelineArrow />
              <PipelineNode
                label="Database"
                accent="from-amber-400 to-orange-300"
              />
            </div>
          </div>
        </section>

        <section className="mt-14">
          <h2 className="text-lg font-semibold mb-4 text-slate-100">
            Built-in integrations
          </h2>
          <div className="flex flex-wrap gap-4">
            <IntegrationPill
              label="Telegram Bot API"
              color="from-sky-400 to-sky-300"
            />
            <IntegrationPill
              label="Email (SMTP)"
              color="from-emerald-400 to-emerald-300"
            />
            <IntegrationPill
              label="HTTP / REST APIs"
              color="from-primary-400 to-primary-300"
            />
            <IntegrationPill
              label="PostgreSQL Database"
              color="from-amber-400 to-amber-300"
            />
          </div>
        </section>

        <section className="mt-14">
          <h2 className="text-lg font-semibold mb-4 text-slate-100">
            Simple pricing for teams
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <PricingCard
              name="Free"
              price="$0"
              period="forever"
              highlight={false}
              features={[
                "Up to 3 workflows",
                "Basic HTTP & webhook steps",
                "Local PostgreSQL & Redis",
                "Developer tooling (Swagger, React Flow)",
              ]}
            />
            <PricingCard
              name="Pro (concept)"
              price="$29"
              period="/month"
              highlight
              features={[
                "Unlimited workflows & runs",
                "Advanced monitoring & alerts",
                "Team access & permissions",
                "Priority support",
              ]}
            />
          </div>
        </section>

        <section className="mt-16">
          <div className="rounded-2xl border border-primary-500/30 bg-gradient-to-r from-primary-500/20 via-slate-950 to-emerald-500/10 px-6 py-8 text-center">
            <h2 className="text-xl font-semibold mb-2">
              Create your first workflow in minutes
            </h2>
            <p className="text-sm text-slate-200 mb-4">
              Start with a webhook trigger, connect an HTTP step and send
              yourself a Telegram notification.
            </p>
            <button
              onClick={onGetStarted}
              className="px-5 py-2.5 text-sm font-medium rounded-lg bg-slate-950/90 text-primary-200 border border-primary-400/60 hover:bg-slate-900"
            >
              Open dashboard
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

type FeatureCardProps = {
  title: string;
  description: string;
};

const FeatureCard: React.FC<FeatureCardProps> = ({ title, description }) => (
  <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 shadow-sm hover:border-primary-500/50 transition">
    <div className="text-sm font-semibold mb-1 text-slate-100">{title}</div>
    <p className="text-xs text-slate-400">{description}</p>
  </div>
);

type PipelineNodeProps = {
  label: string;
  accent: string;
};

const PipelineNode: React.FC<PipelineNodeProps> = ({ label, accent }) => (
  <div className="px-3 py-1.5 rounded-full bg-slate-900 border border-slate-700 flex items-center gap-2">
    <span
      className={`w-2 h-2 rounded-full bg-gradient-to-r ${accent} shadow-[0_0_16px_rgba(59,130,246,0.7)]`}
    />
    <span className="text-xs text-slate-100">{label}</span>
  </div>
);

const PipelineArrow: React.FC = () => (
  <span className="text-slate-500 text-lg">➜</span>
);

type IntegrationPillProps = {
  label: string;
  color: string;
};

const IntegrationPill: React.FC<IntegrationPillProps> = ({ label, color }) => (
  <div className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1">
    <span
      className={`w-2 h-2 rounded-full bg-gradient-to-r ${color} shadow-[0_0_8px_rgba(96,165,250,0.7)]`}
    />
    <span className="text-xs text-slate-200">{label}</span>
  </div>
);

type PricingCardProps = {
  name: string;
  price: string;
  period: string;
  highlight?: boolean;
  features: string[];
};

const PricingCard: React.FC<PricingCardProps> = ({
  name,
  price,
  period,
  highlight,
  features,
}) => (
  <div
    className={`rounded-2xl border p-5 bg-slate-900/70 ${
      highlight
        ? "border-primary-500/80 shadow-lg shadow-primary-900/40"
        : "border-slate-800"
    }`}
  >
    <div className="flex items-baseline gap-2 mb-3">
      <div className="text-sm font-semibold text-slate-100">{name}</div>
      {highlight && (
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary-500/20 text-primary-200 border border-primary-500/40">
          Recommended
        </span>
      )}
    </div>
    <div className="flex items-baseline gap-1 mb-4">
      <span className="text-2xl font-bold">{price}</span>
      <span className="text-xs text-slate-400">{period}</span>
    </div>
    <ul className="space-y-1.5 text-xs text-slate-300 mb-2">
      {features.map((f) => (
        <li key={f} className="flex gap-2">
          <span className="mt-[3px] h-1.5 w-1.5 rounded-full bg-primary-400" />
          <span>{f}</span>
        </li>
      ))}
    </ul>
  </div>
);

