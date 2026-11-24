import React, { createContext, useContext } from 'react';
import { TemplateSectionCategory } from '../types/reports';

export interface OpenTemplatePickerParams {
  fieldLabel: string;
  suggestedCategory: TemplateSectionCategory;
  onApply: (text: string, mode: 'append' | 'replace') => void;
}

export interface OpenSaveTemplateParams {
  fieldLabel: string;
  suggestedCategory: TemplateSectionCategory;
  initialContent: string;
  fromSelection: boolean;
}

interface TemplatesContextValue {
  templatesCount: number;
  openTemplatePicker: (params: OpenTemplatePickerParams) => void;
  openSaveTemplate: (params: OpenSaveTemplateParams) => void;
}

const TemplatesContext = createContext<TemplatesContextValue | null>(null);

export const TemplatesProvider: React.FC<{
  value: TemplatesContextValue;
  children: React.ReactNode;
}> = ({ value, children }) => (
  <TemplatesContext.Provider value={value}>{children}</TemplatesContext.Provider>
);

export function useTemplates(): TemplatesContextValue | null {
  return useContext(TemplatesContext);
}
