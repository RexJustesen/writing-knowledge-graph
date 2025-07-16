'use client';

import React, { useState, useEffect } from 'react';
import { Project, StructureValidation } from '@/types/story';
import { StoryAnalysisService } from '@/services/storyAnalysisService';

interface StoryValidationPanelProps {
  project: Project;
  onValidationUpdate?: (validation: StructureValidation) => void;
}

const StoryValidationPanel: React.FC<StoryValidationPanelProps> = ({
  project,
  onValidationUpdate
}) => {
  const [validation, setValidation] = useState<StructureValidation | null>(null);
  const [showDetails, setShowDetails] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const newValidation = StoryAnalysisService.validateStructure(project);
    setValidation(newValidation);
    onValidationUpdate?.(newValidation);
  }, [project.plotPoints, project.acts, onValidationUpdate]);

  if (!validation || dismissed) {
    return null;
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Needs Work';
    return 'Poor';
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  };

  const hasIssues = validation.warnings.length > 0;
  const hasStrengths = validation.strengths.length > 0;

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="flex items-center justify-between p-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
          <h3 className="font-medium text-gray-900">Story Structure</h3>
          <div className={`px-2 py-1 text-xs rounded-full border ${getScoreColor(validation.score)}`}>
            {validation.score}/100 • {getScoreLabel(validation.score)}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            title={showDetails ? 'Hide details' : 'Show details'}
          >
            <svg 
              className={`w-4 h-4 transition-transform ${showDetails ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            title="Dismiss validation panel"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {!showDetails && (
        <div className="p-3">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {hasIssues ? (
                <span className="flex items-center gap-1">
                  <span>⚠️</span>
                  {validation.warnings.length} area{validation.warnings.length !== 1 ? 's' : ''} for improvement
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <span>✅</span>
                  Structure looks good!
                </span>
              )}
            </div>
            <button
              onClick={() => setShowDetails(true)}
              className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
            >
              View Details
            </button>
          </div>
        </div>
      )}

      {showDetails && (
        <div className="p-3 space-y-4">
          {/* Strengths */}
          {hasStrengths && (
            <div>
              <h4 className="flex items-center gap-2 text-sm font-medium text-green-700 mb-2">
                <span>✅</span>
                Story Strengths
              </h4>
              <ul className="space-y-1">
                {validation.strengths.map((strength, index) => (
                  <li key={index} className="text-sm text-green-600 pl-4">
                    • {strength}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Warnings */}
          {hasIssues && (
            <div>
              <h4 className="flex items-center gap-2 text-sm font-medium text-amber-700 mb-2">
                <span>⚠️</span>
                Areas for Improvement
              </h4>
              <div className="space-y-2">
                {validation.warnings.map((warning, index) => (
                  <div
                    key={index}
                    className="p-2 bg-amber-50 border border-amber-200 rounded text-sm"
                  >
                    <div className="flex items-start gap-2">
                      <span className="flex-shrink-0">
                        {getSeverityIcon(warning.severity)}
                      </span>
                      <div className="flex-1">
                        <p className="font-medium text-amber-800">
                          {warning.message}
                        </p>
                        <p className="text-amber-700 mt-1">
                          💡 {warning.suggestion}
                        </p>
                        {warning.actId && (
                          <p className="text-amber-600 text-xs mt-1">
                            Affects: {warning.actId.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suggestions */}
          {validation.suggestions.length > 0 && (
            <div>
              <h4 className="flex items-center gap-2 text-sm font-medium text-blue-700 mb-2">
                <span>💡</span>
                Quick Actions
              </h4>
              <div className="space-y-2">
                {validation.suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-blue-50 border border-blue-200 rounded text-sm"
                  >
                    <span className="text-blue-800">{suggestion.message}</span>
                    <button className="px-2 py-1 text-xs text-blue-600 hover:bg-blue-100 rounded transition-colors">
                      {suggestion.action}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Score Breakdown */}
          <div className="pt-3 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Structure Score:</span>
              <div className="flex items-center gap-2">
                <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      validation.score >= 80 ? 'bg-green-500' :
                      validation.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${validation.score}%` }}
                  />
                </div>
                <span className="font-medium text-gray-900">
                  {validation.score}/100
                </span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              📝 This analysis is meant to help, not restrict your creativity. 
              Feel free to ignore suggestions that don't fit your vision.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoryValidationPanel;
