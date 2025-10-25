// src/contexts/ThemeContext.jsx
import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext({});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('oryxchat-theme') || 'dark';
  });

  const [accentColor, setAccentColor] = useState(() => {
    return localStorage.getItem('oryxchat-accent') || '#6366f1';
  });

  useEffect(() => {
    localStorage.setItem('oryxchat-theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('oryxchat-accent', accentColor);
    document.documentElement.style.setProperty('--accent-color', accentColor);
  }, [accentColor]);

  const updateThemeSettings = async (newTheme, newAccentColor) => {
    if (newTheme) setTheme(newTheme);
    if (newAccentColor) setAccentColor(newAccentColor);

    // Save to database
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from('profiles')
        .update({
          theme_settings: { theme: newTheme || theme, accentColor: newAccentColor || accentColor }
        })
        .eq('id', user.id);
    }
  };

  const value = {
    theme,
    accentColor,
    updateThemeSettings,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};