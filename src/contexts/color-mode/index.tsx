"use client";

import CssBaseline from "@mui/material/CssBaseline";
import GlobalStyles from "@mui/material/GlobalStyles";
import { ThemeProvider } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
// Import our custom themes instead of RefineThemes
import { customLightTheme, customDarkTheme } from "./customTheme";
import Cookies from "js-cookie";
import React, {
  type PropsWithChildren,
  createContext,
  useEffect,
  useState,
} from "react";

type ColorModeContextType = {
  mode: string;
  setMode: () => void;
};

export const ColorModeContext = createContext<ColorModeContextType>(
  {} as ColorModeContextType
);

type ColorModeContextProviderProps = {
  defaultMode?: string;
};

export const ColorModeContextProvider: React.FC<
  PropsWithChildren<ColorModeContextProviderProps>
> = ({ children, defaultMode }) => {
  const [isMounted, setIsMounted] = useState(false);
  const [mode, setMode] = useState(defaultMode || "light");

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const systemTheme = useMediaQuery(`(prefers-color-scheme: dark)`);

  useEffect(() => {
    if (isMounted) {
      const theme = Cookies.get("theme") || (systemTheme ? "dark" : "light");
      setMode(theme);
    }
  }, [isMounted, systemTheme]);

  const toggleTheme = () => {
    const nextTheme = mode === "light" ? "dark" : "light";

    setMode(nextTheme);
    Cookies.set("theme", nextTheme);
  };

  return (
    <ColorModeContext.Provider
      value={{
        setMode: toggleTheme,
        mode,
      }}
    >
      <ThemeProvider
        // Using custom themes with Poppins font (size 14, weight 600)
        theme={mode === "light" ? customLightTheme : customDarkTheme}
      >
        <CssBaseline />
        <GlobalStyles 
          styles={{ 
            html: { 
              WebkitFontSmoothing: "auto" 
            },
            "body, html": {
              fontFamily: "'Poppins', sans-serif",
              fontSize: "14px",
              fontWeight: 600
            },
            "*": {
              fontFamily: "'Poppins', sans-serif"
            }
          }} 
        />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
};
