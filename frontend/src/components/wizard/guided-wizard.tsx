"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import WizardStep from "@/components/wizard/wizard-step";
import GoalCards, { type GoalType } from "@/components/wizard/goal-cards";
import TickerInput from "@/components/ui/ticker-input";

interface WizardContext {
  tickers: string[];
  initial: string;
  years: string;
  monthly: string;
  target: string;
  minYield: string;
  scanType: "dividends" | "tech";
}

const DEFAULT_CONTEXT: WizardContext = {
  tickers: [],
  initial: "10000",
  years: "10",
  monthly: "500",
  target: "",
  minYield: "3",
  scanType: "dividends",
};

const GOAL_LABELS: Record<GoalType, string> = {
  risk: "Risk Analysis",
  grow: "Growth Projection",
  income: "Dividend Income",
  find: "Investment Scanner",
  health: "Portfolio Health Check",
};

const TOTAL_STEPS = 3;

export default function GuidedWizard() {
  const router = useRouter();
  const [expanded, setExpanded] = useState(true);
  const [step, setStep] = useState(1);
  const [goal, setGoal] = useState<GoalType | null>(null);
  const [ctx, setCtx] = useState<WizardContext>(DEFAULT_CONTEXT);

  function handleGoalSelect(selected: GoalType) {
    setGoal(selected);
    if (selected === "health") {
      setStep(3);
    } else {
      setStep(2);
    }
  }

  function handleBack() {
    if (step === 3 && goal !== "health") {
      setStep(2);
    } else {
      setStep(1);
      setGoal(null);
    }
  }

  function handleStartOver() {
    setStep(1);
    setGoal(null);
    setCtx(DEFAULT_CONTEXT);
  }

  function handleRunAnalysis() {
    if (!goal) return;

    switch (goal) {
      case "risk":
        router.push(
          `/tools/risk-metrics?tickers=${ctx.tickers.join(",")}`
        );
        break;
      case "grow": {
        const params = new URLSearchParams({
          initial: ctx.initial,
          years: ctx.years,
          monthly: ctx.monthly,
        });
        if (ctx.target) params.set("target", ctx.target);
        router.push(`/tools/monte-carlo?${params.toString()}`);
        break;
      }
      case "income":
        router.push(
          `/tools/dividends?ticker=${ctx.tickers[0] || "SCHD"}`
        );
        break;
      case "find":
        router.push(`/tools/screener?type=${ctx.scanType}`);
        break;
      case "health":
        router.push("/portfolio?health=true");
        break;
    }
  }

  function updateCtx(partial: Partial<WizardContext>) {
    setCtx((prev) => ({ ...prev, ...partial }));
  }

  function isStep2Valid(): boolean {
    if (!goal) return false;
    switch (goal) {
      case "risk":
        return ctx.tickers.length > 0;
      case "grow":
        return Number(ctx.initial) > 0 && Number(ctx.years) > 0;
      case "income":
        return ctx.tickers.length > 0;
      case "find":
        return true;
      default:
        return true;
    }
  }

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="w-full rounded-xl border border-gray-800 bg-gray-900/50 p-4 text-left transition-all hover:border-emerald-500/30 hover:bg-gray-800/50"
      >
        <span className="text-sm text-gray-400">
          Need help getting started?
        </span>
        <span className="ml-2 text-sm font-medium text-emerald-400">
          Open Guided Wizard
        </span>
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">
          What brings you here today?
        </h2>
        <button
          onClick={() => setExpanded(false)}
          className="text-sm text-gray-500 transition-colors hover:text-gray-300"
        >
          Close
        </button>
      </div>

      {/* Step 1: Goal selection */}
      {step === 1 && (
        <WizardStep step={1} totalSteps={TOTAL_STEPS} title="Choose your goal">
          <GoalCards onSelect={handleGoalSelect} />
        </WizardStep>
      )}

      {/* Step 2: Context form */}
      {step === 2 && goal && (
        <WizardStep
          step={2}
          totalSteps={TOTAL_STEPS}
          title={`Set up: ${GOAL_LABELS[goal]}`}
        >
          <div className="space-y-4">
            <ContextForm goal={goal} ctx={ctx} updateCtx={updateCtx} />

            <div className="flex items-center gap-3">
              <button
                onClick={handleBack}
                className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-400 transition-colors hover:border-gray-600 hover:text-white"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!isStep2Valid()}
                className="rounded-lg bg-emerald-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-500 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </WizardStep>
      )}

      {/* Step 3: Summary */}
      {step === 3 && goal && (
        <WizardStep step={3} totalSteps={TOTAL_STEPS} title="Review your plan">
          <SummaryCard goal={goal} ctx={ctx} />

          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={handleBack}
              className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-400 transition-colors hover:border-gray-600 hover:text-white"
            >
              Back
            </button>
            <button
              onClick={handleStartOver}
              className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-400 transition-colors hover:border-gray-600 hover:text-white"
            >
              Start Over
            </button>
            <button
              onClick={handleRunAnalysis}
              className="rounded-lg bg-emerald-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-500"
            >
              Run Analysis
            </button>
          </div>
        </WizardStep>
      )}
    </div>
  );
}

/* ---- Context Form per goal ---- */

function ContextForm({
  goal,
  ctx,
  updateCtx,
}: {
  goal: GoalType;
  ctx: WizardContext;
  updateCtx: (partial: Partial<WizardContext>) => void;
}) {
  const inputClass =
    "w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:border-emerald-500 focus:outline-none";
  const labelClass = "block text-sm font-medium text-gray-400 mb-1";

  switch (goal) {
    case "risk":
      return (
        <div>
          <label className={labelClass}>Enter tickers to analyze</label>
          <TickerInput
            tickers={ctx.tickers}
            onChange={(tickers) => updateCtx({ tickers })}
          />
        </div>
      );

    case "grow":
      return (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Initial investment ($)</label>
            <input
              type="number"
              value={ctx.initial}
              onChange={(e) => updateCtx({ initial: e.target.value })}
              className={inputClass}
              min="0"
              step="1000"
            />
          </div>
          <div>
            <label className={labelClass}>Time horizon (years)</label>
            <input
              type="number"
              value={ctx.years}
              onChange={(e) => updateCtx({ years: e.target.value })}
              className={inputClass}
              min="1"
              max="50"
            />
          </div>
          <div>
            <label className={labelClass}>Monthly contribution ($)</label>
            <input
              type="number"
              value={ctx.monthly}
              onChange={(e) => updateCtx({ monthly: e.target.value })}
              className={inputClass}
              min="0"
              step="100"
            />
          </div>
          <div>
            <label className={labelClass}>
              Target value ($){" "}
              <span className="text-gray-600">optional</span>
            </label>
            <input
              type="number"
              value={ctx.target}
              onChange={(e) => updateCtx({ target: e.target.value })}
              className={inputClass}
              placeholder="e.g. 100000"
              min="0"
            />
          </div>
        </div>
      );

    case "income":
      return (
        <div className="space-y-4">
          <div>
            <label className={labelClass}>Ticker(s) to analyze</label>
            <TickerInput
              tickers={ctx.tickers}
              onChange={(tickers) => updateCtx({ tickers })}
              placeholder="Add ticker (e.g. SCHD)"
            />
          </div>
          <div className="max-w-xs">
            <label className={labelClass}>
              Minimum yield threshold (%)
            </label>
            <input
              type="number"
              value={ctx.minYield}
              onChange={(e) => updateCtx({ minYield: e.target.value })}
              className={inputClass}
              min="0"
              max="20"
              step="0.5"
            />
          </div>
        </div>
      );

    case "find":
      return (
        <div className="max-w-xs">
          <label className={labelClass}>Scan type</label>
          <select
            value={ctx.scanType}
            onChange={(e) =>
              updateCtx({
                scanType: e.target.value as "dividends" | "tech",
              })
            }
            className={inputClass}
          >
            <option value="dividends">Dividend Stalwarts</option>
            <option value="tech">Emerging Tech</option>
          </select>
        </div>
      );

    default:
      return null;
  }
}

/* ---- Summary Card ---- */

function SummaryCard({
  goal,
  ctx,
}: {
  goal: GoalType;
  ctx: WizardContext;
}) {
  return (
    <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-4">
      <p className="mb-2 text-sm font-medium text-emerald-400">
        {GOAL_LABELS[goal]}
      </p>

      <div className="space-y-1 text-sm text-gray-300">
        {goal === "risk" && (
          <p>
            Analyze risk metrics for:{" "}
            <span className="font-medium text-white">
              {ctx.tickers.join(", ") || "No tickers selected"}
            </span>
          </p>
        )}

        {goal === "grow" && (
          <>
            <p>
              Starting with{" "}
              <span className="font-medium text-white">
                ${Number(ctx.initial).toLocaleString()}
              </span>
            </p>
            <p>
              Over{" "}
              <span className="font-medium text-white">{ctx.years} years</span>
            </p>
            <p>
              Contributing{" "}
              <span className="font-medium text-white">
                ${Number(ctx.monthly).toLocaleString()}/month
              </span>
            </p>
            {ctx.target && (
              <p>
                Target:{" "}
                <span className="font-medium text-white">
                  ${Number(ctx.target).toLocaleString()}
                </span>
              </p>
            )}
          </>
        )}

        {goal === "income" && (
          <>
            <p>
              Dividend analysis for:{" "}
              <span className="font-medium text-white">
                {ctx.tickers.join(", ") || "No tickers selected"}
              </span>
            </p>
            <p>
              Minimum yield:{" "}
              <span className="font-medium text-white">{ctx.minYield}%</span>
            </p>
          </>
        )}

        {goal === "find" && (
          <p>
            Scan type:{" "}
            <span className="font-medium text-white">
              {ctx.scanType === "dividends"
                ? "Dividend Stalwarts"
                : "Emerging Tech"}
            </span>
          </p>
        )}

        {goal === "health" && (
          <p>
            Run a full portfolio health check with diagnostics and
            recommendations.
          </p>
        )}
      </div>
    </div>
  );
}
