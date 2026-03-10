import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Section = 'SHOP' | 'BUILDER';

interface SectionContextType {
  currentSection: Section;
  setCurrentSection: (section: Section) => void;
}

const SectionContext = createContext<SectionContextType | undefined>(undefined);

export const SectionProvider = ({ children }: { children: ReactNode }) => {
  const [currentSection, setCurrentSection] = useState<Section>(() => {
    if (typeof window === 'undefined') return 'SHOP';
    const savedSection = window.localStorage.getItem('current_section');
    return savedSection === 'BUILDER' ? 'BUILDER' : 'SHOP';
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('current_section', currentSection);
  }, [currentSection]);

  return (
    <SectionContext.Provider
      value={{
        currentSection,
        setCurrentSection,
      }}
    >
      {children}
    </SectionContext.Provider>
  );
};

export const useSection = () => {
  const context = useContext(SectionContext);
  if (context === undefined) {
    throw new Error('useSection must be used within a SectionProvider');
  }
  return context;
};
