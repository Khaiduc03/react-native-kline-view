import { processColor } from 'react-native';

export const COLOR = (r: number, g: number, b: number, a: number = 1): string =>
  a === 1
    ? `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(
        b * 255,
      )})`
    : `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(
        b * 255,
      )}, ${a})`;

export interface Theme {
  backgroundColor: string;
  titleColor: string;
  detailColor: string;
  textColor7724: string;
  headerColor: string;
  tabBarBackgroundColor: string;
  backgroundColor9103: string;
  backgroundColor9703: string;
  backgroundColor9113: string;
  backgroundColor9709: string;
  backgroundColor9603: string;
  backgroundColor9411: string;
  backgroundColor9607: string;
  backgroundColor9609: string;
  backgroundColor9509: string;
  backgroundColorBlue: string;
  buttonColor: string;
  borderColor: string;
  backgroundOpacity: string;
  increaseColor: string;
  decreaseColor: string;
  minuteLineColor: string;
  gridColor: string;
  separatorColor: string;
  textColor: string;
}

const lightTheme: Theme = {
  backgroundColor: 'white',
  titleColor: COLOR(0.08, 0.09, 0.12),
  detailColor: COLOR(0.55, 0.62, 0.68),
  textColor7724: COLOR(0.77, 0.81, 0.84),
  headerColor: COLOR(0.97, 0.97, 0.98),
  tabBarBackgroundColor: 'white',
  backgroundColor9103: COLOR(0.91, 0.92, 0.93),
  backgroundColor9703: COLOR(0.97, 0.97, 0.98),
  backgroundColor9113: COLOR(0.91, 0.92, 0.93),
  backgroundColor9709: COLOR(0.97, 0.97, 0.98),
  backgroundColor9603: COLOR(0.96, 0.97, 0.98),
  backgroundColor9411: COLOR(0.94, 0.95, 0.96),
  backgroundColor9607: COLOR(0.96, 0.97, 0.99),
  backgroundColor9609: 'white',
  backgroundColor9509: COLOR(0.95, 0.97, 0.99),
  backgroundColorBlue: COLOR(0, 0.4, 0.93),
  buttonColor: COLOR(0, 0.4, 0.93),
  borderColor: COLOR(0.91, 0.92, 0.93),
  backgroundOpacity: COLOR(0, 0, 0, 0.5),
  increaseColor: COLOR(0.0, 0.78, 0.32),
  decreaseColor: COLOR(1.0, 0.27, 0.27),
  minuteLineColor: COLOR(0, 0.4, 0.93),
  gridColor: COLOR(0.91, 0.92, 0.93),
  separatorColor: COLOR(0.91, 0.92, 0.93),
  textColor: COLOR(0.08, 0.09, 0.12),
};

const darkTheme: Theme = {
  backgroundColor: COLOR(0.07, 0.12, 0.19),
  titleColor: COLOR(0.81, 0.83, 0.91),
  detailColor: COLOR(0.43, 0.53, 0.66),
  textColor7724: COLOR(0.24, 0.33, 0.42),
  headerColor: COLOR(0.09, 0.16, 0.25),
  tabBarBackgroundColor: COLOR(0.09, 0.16, 0.25),
  backgroundColor9103: COLOR(0.03, 0.09, 0.14),
  backgroundColor9703: COLOR(0.03, 0.09, 0.14),
  backgroundColor9113: COLOR(0.13, 0.2, 0.29),
  backgroundColor9709: COLOR(0.09, 0.16, 0.25),
  backgroundColor9603: COLOR(0.03, 0.09, 0.14),
  backgroundColor9411: COLOR(0.11, 0.17, 0.25),
  backgroundColor9607: COLOR(0.07, 0.15, 0.23),
  backgroundColor9609: COLOR(0.09, 0.15, 0.23),
  backgroundColor9509: COLOR(0.09, 0.16, 0.25),
  backgroundColorBlue: COLOR(0.14, 0.51, 1),
  buttonColor: COLOR(0.14, 0.51, 1),
  borderColor: COLOR(0.13, 0.2, 0.29),
  backgroundOpacity: COLOR(0, 0, 0, 0.8),
  increaseColor: COLOR(0.0, 1.0, 0.53),
  decreaseColor: COLOR(1.0, 0.4, 0.4),
  minuteLineColor: COLOR(0.14, 0.51, 1),
  gridColor: COLOR(0.13, 0.2, 0.29),
  separatorColor: COLOR(0.13, 0.2, 0.29),
  textColor: COLOR(0.81, 0.83, 0.91),
};

export class ThemeManager {
  private static readonly themes = {
    light: lightTheme,
    dark: darkTheme,
  };

  static getCurrentTheme(isDark: boolean): Theme {
    return ThemeManager.themes[isDark ? 'dark' : 'light'];
  }

  static processIncreaseColor(isDark: boolean): number {
    const theme = ThemeManager.getCurrentTheme(isDark);
    return processColor(theme.increaseColor) as number;
  }

  static processDecreaseColor(isDark: boolean): number {
    const theme = ThemeManager.getCurrentTheme(isDark);
    return processColor(theme.decreaseColor) as number;
  }
}
