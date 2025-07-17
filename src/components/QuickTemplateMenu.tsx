'use client';

import React, { useEffect, useRef, useState } from 'react';
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
  const menuRef = useRef<HTMLDivElement>(null);
  const [adjustedPosition, setAdjustedPosition] = useState(position);

  // Calculate smart positioning to keep menu within viewport
  useEffect(() => {
    if (!isOpen) return;

    let { x, y } = position;
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };

    // Fixed menu dimensions
    const menuWidth = 320; // w-80 = 320px
    const menuHeight = 400; // Fixed height

    // Adjust horizontal position
    if (x + menuWidth > viewport.width - 20) {
      // If menu would go off right side, position it to the left of cursor
      x = Math.max(20, position.x - menuWidth);
    } else if (x < 20) {
      // If too close to left edge, move it right
      x = 20;
    }

    // Adjust vertical position
    const availableSpaceBelow = viewport.height - position.y - 20;
    const availableSpaceAbove = position.y - 20;

    if (menuHeight > availableSpaceBelow && availableSpaceAbove > availableSpaceBelow) {
      // Show above cursor if more space available
      y = Math.max(20, position.y - menuHeight);
    } else {
      // Default: show below cursor
      y = position.y;
    }

    setAdjustedPosition({ x, y });
  }, [isOpen, position]);

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
        ref={menuRef}
        className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg w-80 h-96"
        style={{
          left: adjustedPosition.x,
          top: adjustedPosition.y
        }}
      >
        <div className="px-3 py-2 text-xs font-medium text-gray-500 border-b border-gray-200">
          Add Plot Point
        </div>
        
        {/* Scrollable content area - takes remaining height */}
        <div className="overflow-y-auto h-80 py-1">
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
                  className="w-6 h-6 rounded flex items-center justify-center text-sm flex-shrink-0"
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
                  <div className="text-xs text-gray-500 overflow-hidden">
                    {template.descriptionTemplate.replace(/\[.*?\]/g, '...').substring(0, 80)}
                    {template.descriptionTemplate.length > 80 ? '...' : ''}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        
        {/* Fixed footer */}
        <div className="border-t border-gray-200 px-3 py-2">
          <div className="text-xs text-gray-500">
            💡 Templates provide structure and guidance
          </div>
        </div>
      </div>
    </>
  );
};

export default QuickTemplateMenu;
