'use client';

import React, { useState } from 'react';
import { StoryTemplate } from '@/types/story';
import { TemplateService } from '@/services/templateService';

interface TemplateSelectorProps {
  onTemplateSelect: (template: StoryTemplate | null) => void;
  selectedTemplate: StoryTemplate | null;
}

const TemplateSelector: React.FC<TemplateSelectorProps> = ({ 
  onTemplateSelect, 
  selectedTemplate 
}) => {
  const [showPreview, setShowPreview] = useState<string | null>(null);
  const templates = TemplateService.getAllTemplates();

  const handleTemplateClick = (template: StoryTemplate) => {
    if (selectedTemplate?.id === template.id) {
      onTemplateSelect(null); // Deselect if clicking the same template
    } else {
      onTemplateSelect(template);
    }
  };

  const handleBlankCanvasClick = () => {
    onTemplateSelect(null);
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-3">
          Choose a Story Structure
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Start with a proven template or begin with a blank canvas. You can always customize later.
        </p>
      </div>

      {/* Blank Canvas Option */}
      <div
        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
          selectedTemplate === null
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-200 hover:border-gray-300'
        }`}
        onClick={handleBlankCanvasClick}
      >
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-gray-900">Blank Canvas</h4>
            <p className="text-sm text-gray-600">
              Start with no structure - complete creative freedom
            </p>
          </div>
          <div className="text-2xl">🎨</div>
        </div>
      </div>

      {/* Template Options */}
      <div className="grid gap-3">
        {templates.map((template) => (
          <div key={template.id} className="relative">
            <div
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                selectedTemplate?.id === template.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => handleTemplateClick(template)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-gray-900">{template.name}</h4>
                    <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                      {template.genre}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {template.description}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <span>{template.plotPoints.length} plot points</span>
                    <span>{template.actStructure} acts</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowPreview(showPreview === template.id ? null : template.id);
                    }}
                    className="px-3 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  >
                    {showPreview === template.id ? 'Hide' : 'Preview'}
                  </button>
                  <div className="text-xl">
                    {template.genre === 'Mystery' ? '🔍' : 
                     template.genre === 'Romance' ? '❤️' : '📚'}
                  </div>
                </div>
              </div>
            </div>

            {/* Template Preview */}
            {showPreview === template.id && (
              <div className="mt-2 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <h5 className="font-medium text-gray-900 mb-3">
                  Plot Points Preview
                </h5>
                <div className="space-y-2">
                  {template.plotPoints.map((point, index) => {
                    const categoryConfig = TemplateService.getCategoryConfig(point.category);
                    return (
                      <div
                        key={point.id}
                        className="flex items-start gap-3 p-2 bg-white rounded border"
                      >
                        <div className="flex-shrink-0">
                          <span className="text-lg">{categoryConfig.icon}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h6 className="font-medium text-sm text-gray-900">
                              {point.defaultTitle}
                            </h6>
                            <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                              Act {point.actId.split('-')[1]}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 mt-1">
                            {point.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Selection Summary */}
      {selectedTemplate && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm font-medium text-blue-900">
              Selected: {selectedTemplate.name}
            </span>
          </div>
          <p className="text-xs text-blue-700 mt-1">
            Your project will start with {selectedTemplate.plotPoints.length} pre-defined plot points 
            across {selectedTemplate.actStructure} acts. You can customize everything after creation.
          </p>
        </div>
      )}
    </div>
  );
};

export default TemplateSelector;
