/**
 * Simple Stepper Component
 *
 * Shows the progress through a multi-step flow
 */

import { Check } from 'lucide-react';

interface Step {
  title: string;
  description?: string;
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
}

export function Stepper({ steps, currentStep }: StepperProps) {
  return (
    <div className="w-full py-4">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isComplete = index < currentStep;
          const isCurrent = index === currentStep;
          const isUpcoming = index > currentStep;

          return (
            <div key={index} className="flex items-center flex-1">
              {/* Step circle */}
              <div className="flex flex-col items-center">
                <div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors
                    ${isComplete ? 'bg-primary border-primary text-white' : ''}
                    ${isCurrent ? 'bg-white border-primary text-primary' : ''}
                    ${isUpcoming ? 'bg-white border-gray-300 text-gray-400' : ''}
                  `}
                >
                  {isComplete ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <span className="text-sm font-semibold">{index + 1}</span>
                  )}
                </div>
                <div className="mt-2 text-center hidden sm:block">
                  <p className={`text-sm font-medium ${isCurrent ? 'text-gray-900' : 'text-gray-500'}`}>
                    {step.title}
                  </p>
                  {step.description && (
                    <p className="text-xs text-gray-400 hidden md:block">
                      {step.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Connector line */}
              {index < steps.length - 1 && (
                <div
                  className={`
                    flex-1 h-0.5 mx-2 transition-colors
                    ${index < currentStep ? 'bg-primary' : 'bg-gray-300'}
                  `}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile step title */}
      <div className="sm:hidden text-center mt-4">
        <p className="text-sm font-medium text-gray-900">
          {steps[currentStep].title}
        </p>
        {steps[currentStep].description && (
          <p className="text-xs text-gray-500">
            {steps[currentStep].description}
          </p>
        )}
      </div>
    </div>
  );
}
