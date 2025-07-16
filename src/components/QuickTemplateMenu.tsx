'use client';

import React from 'react';
import { QuickTemplate, PlotPointCategory } from '@/types/story';
import { TemplateService } from '@/services/templateService';

interface QuickTemplateMenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
  onTemplateSelect: (template: QuickTemplate | null) => void;
  onClose: () => void;
}

const QuickTemplateMenu: React.FC<QuickTemplateMenuProps> = ({
  isOpen,
  position,
  onTemplateSelect,
  onClose
}) => {
  const quickTemplates = TemplateService.getQuickTemplates();

  if (!isOpen) return null;

  const handleTemplateClick = (template: QuickTemplate) => {
    onTemplateSelect(template);
    onClose();
  };

  const handleBlankClick = () => {
    onTemplateSelect(null);
    onClose();
  };

  return (
    <>
      {/* Backdrop to close menu */}
      <div 
        className="fixed inset-0 z-40" 
        onClick={onClose}
      />
      
      {/* Menu */}
      <div
        className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-2 min-w-64"
        style={{
          left: position.x,
          top: position.y,
          transform: 'translate(-50%, 0)' // Only center horizontally, no vertical offset
        }}
      >
        <div className="px-3 py-1 text-xs font-medium text-gray-500 border-b border-gray-200 mb-1">
          Add Plot Point
        </div>
        
        {/* Blank option */}
        <button
          onClick={handleBlankClick}
          className="w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors flex items-center gap-3"
        >
          <div className="w-6 h-6 rounded border border-gray-300 flex items-center justify-center text-gray-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900">Blank Plot Point</div>
            <div className="text-xs text-gray-500">Start with an empty plot point</div>
          </div>
        </button>
        
        <div className="border-t border-gray-200 my-1"></div>
        
        {/* Template options */}
        {quickTemplates.map((template) => {
          const categoryConfig = TemplateService.getCategoryConfig(template.category);
          
          return (
            <button
              key={template.id}
              onClick={() => handleTemplateClick(template)}
              className="w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors flex items-center gap-3"
            >
              <div 
                className="w-6 h-6 rounded flex items-center justify-center text-sm"
                style={{ 
                  backgroundColor: categoryConfig.bgColor,
                  color: categoryConfig.textColor,
                  border: `1px solid ${categoryConfig.borderColor}`
                }}
              >
                {categoryConfig.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900">{template.name}</div>
                <div className="text-xs text-gray-500 truncate">
                  {template.descriptionTemplate.replace(/\[.*?\]/g, '...')}
                </div>
              </div>
            </button>
          );
        })}
        
        <div className="border-t border-gray-200 mt-1 pt-1">
          <div className="px-3 py-1 text-xs text-gray-500">
            💡 Templates provide structure and guidance
          </div>
        </div>
      </div>
    </>
  );
};

export default QuickTemplateMenu;
