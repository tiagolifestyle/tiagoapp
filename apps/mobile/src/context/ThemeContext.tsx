import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { View } from "react-native";
import { StatusBar } from "expo-status-bar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { vars } from "nativewind";

export type ThemeMode = "dark" | "light";

export const THEME_STORAGE_KEY = "tiagolifestyle.theme";

// A cor de destaque (dourado) e as cores semânticas mantêm-se iguais nos
// dois temas — só o fundo, as superfícies, a borda e o texto invertem.
const THEME_VARS = {
  dark: vars({
    "--color-background": "#0B0B0F",
    "--color-surface": "#16161D",
    "--color-surface-elevated": "#1E1E27",
    "--color-border": "#2A2A35",
    "--color-foreground": "#F5F5F2",
    "--color-muted": "#9A9AA5",
  }),
  light: vars({
    "--color-background": "#F7F7F4",
    "--color-surface": "#EFEFEA",
    "--color-surface-elevated": "#FFFFFF",
    "--color-border": "#DCDCD6",
    "--color-foreground": "#14141A",
    "--color-muted": "#6B6B76",
  }),
};

interface ThemeContextValue {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>("dark");

  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY).then((saved) => {
      if (saved === "light" || saved === "dark") setThemeState(saved);
    });
  }, []);

  function setTheme(next: ThemeMode) {
    setThemeState(next);
    AsyncStorage.setItem(THEME_STORAGE_KEY, next);
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <View style={THEME_VARS[theme]} className="flex-1 bg-background">
        <StatusBar style={theme === "dark" ? "light" : "dark"} />
        {children}
      </View>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme deve ser usado dentro de <ThemeProvider>");
  return context;
}
