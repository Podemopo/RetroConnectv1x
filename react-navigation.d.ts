// react-navigation.d.ts
import '@react-navigation/native';
import { lightTheme } from './constants/Colors'; // Adjust path if needed
import { theme } from './styles/theme'; // Adjust path if needed

// 1. Define the structure of your custom theme values
type CustomTheme = typeof theme & {
  colors: typeof lightTheme;
};

// 2. Extend the default Theme type from React Navigation
declare module '@react-navigation/native' {
  export function useTheme(): CustomTheme;
  export interface Theme extends CustomTheme {}
}
