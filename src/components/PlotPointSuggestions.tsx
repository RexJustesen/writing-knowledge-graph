'use client';

import React, { useState } from 'react';
import { Project, PlotPointSuggestion, PlotPoint } from '@/types/story';
import { StoryAnalysisService } from '@/services/storyAnalysisService';
import { TemplateService } from '@/services/templateService';

interface PlotPointSuggestionsProps {
  project: Project;
  currentActId: string;
  onSuggestionAccept: (suggestion: PlotPointSuggestion) => void;
  onRefreshSuggestions?: () => void;
}

const PlotPointSuggestions: React.FC<PlotPointSuggestionsProps> = ({
  project,
  currentActId,
  onSuggestionAccept,
  onRefreshSuggestions
}) => {
  const [suggestions, setSuggestions] = useState<PlotPointSuggestion[]>(() => 
    StoryAnalysisService.generateSuggestions(project)
  );
  const [showSuggestions, setShowSuggestions] = useState(true);

  const refreshSuggestions = () => {
    const newSuggestions = StoryAnalysisService.generateSuggestions(project);
    setSuggestions(newSuggestions);
    onRefreshSuggestions?.();
  };

  const handleAcceptSuggestion = (suggestion: PlotPointSuggestion) => {
    onSuggestionAccept(suggestion);
    // Remove the accepted suggestion from the list
    setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-50';
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-50';
    return 'text-orange-600 bg-orange-50';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.6) return 'Medium';
    return 'Low';
  };

  // Filter suggestions for current act or show all if none for current act
  const actSuggestions = suggestions.filter(s => s.suggestedActId === currentActId);
  const displaySuggestions = actSuggestions.length > 0 ? actSuggestions : suggestions.slice(0, 3);

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="flex items-center justify-between p-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          <h3 className="font-medium text-gray-900">Story Suggestions</h3>
          <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
            {suggestions.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={refreshSuggestions}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            title="Refresh suggestions"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          <button
            onClick={() => setShowSuggestions(!showSuggestions)}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg 
              className={`w-4 h-4 transition-transform ${showSuggestions ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {showSuggestions && (
        <div className="p-3">
          <div className="space-y-3">
            {displaySuggestions.map((suggestion) => {
              const categoryConfig = TemplateService.getCategoryConfig(suggestion.category);
              
              return (
                <div
                  key={suggestion.id}
                  className="p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                >
                  <div className="space-y-3">
                    {/* Title and badges row */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-lg">{categoryConfig.icon}</span>
                      <h4 className="font-medium text-gray-900 flex-1 min-w-0">{suggestion.title}</h4>
                      {suggestion.needsActCreation && (
                        <span className="px-2 py-0.5 text-xs bg-orange-100 text-orange-700 rounded flex-shrink-0 font-medium">
                          + Act
                        </span>
                      )}
                      <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded flex-shrink-0">
                        {suggestion.suggestedActId.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                      <span className={`px-2 py-0.5 text-xs rounded-full flex-shrink-0 ${getConfidenceColor(suggestion.confidence)}`}>
                        {getConfidenceLabel(suggestion.confidence)}
                      </span>
                    </div>
                    
                    {/* Description */}
                    <p className="text-sm text-gray-600">
                      {suggestion.description}
                    </p>
                    
                    {/* Reasoning */}
                    <p className="text-xs text-gray-500 italic">
                      💡 {suggestion.reasoning}
                    </p>
                    
                    {/* Template source and action row */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1">
                        {suggestion.templateSource && (
                          <p className="text-xs text-blue-600">
                            From: {suggestion.templateSource}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleAcceptSuggestion(suggestion)}
                        className={`px-4 py-2 text-sm text-white rounded transition-colors flex-shrink-0 ${
                          suggestion.needsActCreation 
                            ? 'bg-orange-600 hover:bg-orange-700' 
                            : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                        title={suggestion.needsActCreation ? 'This will create a new act and add the plot point' : 'Add this plot point'}
                      >
                        {suggestion.needsActCreation ? 'Add + Act' : 'Add'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {suggestions.length > displaySuggestions.length && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                {suggestions.length - displaySuggestions.length} more suggestions available for other acts
              </p>
            </div>
          )}

          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              💡 Suggestions are based on your story's structure and detected genre. 
              They're meant to inspire, not restrict your creativity.
            </p>
          </div>
        </div>
      )}

      {!showSuggestions && (
        <div className="px-3 pb-3">
          <button
            onClick={() => setShowSuggestions(true)}
            className="w-full text-sm text-blue-600 hover:text-blue-800 transition-colors"
          >
            Show {displaySuggestions.length} suggestion{displaySuggestions.length !== 1 ? 's' : ''} for your story
          </button>
        </div>
      )}
    </div>
  );
};

export default PlotPointSuggestions;
