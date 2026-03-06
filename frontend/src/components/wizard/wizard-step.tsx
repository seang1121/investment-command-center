"use client";

import type { ReactNode } from "react";

interface WizardStepProps {
  step: number;
  totalSteps: number;
  title: string;
  children: ReactNode;
}

export default function WizardStep({
  step,
  totalSteps,
  title,
  children,
}: WizardStepProps) {
  return (
    <div className="space-y-4">
      {/* Step indicator dots */}
      <div className="flex items-center justify-center gap-2">
        {Array.from({ length: totalSteps }, (_, i) => {
          const stepNum = i + 1;
          const isCompleted = stepNum < step;
          const isActive = stepNum === step;

          return (
            <div
              key={stepNum}
              className={`h-2.5 w-2.5 rounded-full transition-colors ${
                isCompleted
                  ? "bg-emerald-500"
                  : isActive
                    ? "bg-emerald-400"
                    : "bg-gray-700"
              }`}
            />
          );
        })}
      </div>

      {/* Title */}
      <h3 className="text-center text-lg font-semibold text-white">
        {title}
      </h3>

      {/* Content */}
      <div>{children}</div>
    </div>
  );
}
