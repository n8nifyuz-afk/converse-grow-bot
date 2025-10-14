import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

type Theme = 'light' | 'dark' | 'system';
type AccentColor = 'blue' | 'indigo' | 'purple' | 'green' | 'orange' | 'red' | 'gray';

interface ThemeContextType {
  theme: Theme;
  accentColor: AccentColor;
  setTheme: (theme: Theme) => void;
  setAccentColor: (color: AccentColor) => void;
  toggleTheme: () => void;
  actualTheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('system'); // Default to system theme
  const [accentColor, setAccentColor] = useState<AccentColor>('gray'); // Default to gray
  const [actualTheme, setActualTheme] = useState<'light' | 'dark'>(
    window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  );
  const { user } = useAuth();

  useEffect(() => {
    // Load saved preferences from user metadata if user is authenticated
    const loadUserPreferences = () => {
      if (user?.user_metadata) {
        const userTheme = user.user_metadata.theme as Theme;
        const userAccent = user.user_metadata.accent_color as AccentColor;
        
        if (userTheme) setTheme(userTheme);
        if (userAccent) setAccentColor(userAccent);
      } else if (!user) {
        // Fallback to localStorage for non-authenticated users
        const savedTheme = localStorage.getItem('chatlearn-theme') as Theme;
        const savedAccent = localStorage.getItem('chatlearn-accent') as AccentColor;
        
        if (savedTheme) setTheme(savedTheme);
        if (savedAccent) setAccentColor(savedAccent);
      }
    };

    loadUserPreferences();
  }, [user]);

  useEffect(() => {
    // Determine actual theme
    let newActualTheme: 'light' | 'dark';
    
    if (theme === 'system') {
      newActualTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } else {
      newActualTheme = theme;
    }

    setActualTheme(newActualTheme);

    // Apply theme classes
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(newActualTheme);
    
    // Apply accent color
    root.classList.remove('accent-blue', 'accent-indigo', 'accent-purple', 'accent-green', 'accent-orange', 'accent-red', 'accent-gray');
    root.classList.add(`accent-${accentColor}`);

    // Save preferences
    const savePreferences = async () => {
      if (user) {
        // Save to user metadata for authenticated users
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            await supabase.auth.updateUser({
              data: { 
                theme, 
                accent_color: accentColor 
              }
            });
          }
        } catch (error) {
          console.error('Failed to save theme preferences:', error);
        }
      } else {
        // Fallback to localStorage for non-authenticated users
        localStorage.setItem('chatlearn-theme', theme);
        localStorage.setItem('chatlearn-accent', accentColor);
      }
    };

    savePreferences();
  }, [theme, accentColor, user]);

  const handleSetTheme = (newTheme: Theme) => {
    setTheme(newTheme);
  };

  const handleSetAccentColor = (color: AccentColor) => {
    setAccentColor(color);
  };

  const toggleTheme = () => {
    if (theme === 'system') {
      // If system, switch to opposite of current actual theme
      setTheme(actualTheme === 'dark' ? 'light' : 'dark');
    } else {
      // Toggle between light and dark
      setTheme(theme === 'light' ? 'dark' : 'light');
    }
  };

  return (
    <ThemeContext.Provider 
      value={{ 
        theme, 
        accentColor, 
        setTheme: handleSetTheme, 
        setAccentColor: handleSetAccentColor,
        toggleTheme,
        actualTheme 
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}