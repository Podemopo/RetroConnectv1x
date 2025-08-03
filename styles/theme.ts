import { DarkTheme, DefaultTheme } from '@react-navigation/native';

// 1. Design System Tokens
// =================================
export const designTokens = {
  spacing: {
    xs: 4, s: 8, m: 16, l: 24, xl: 40,
  },
  borderRadii: {
    s: 4, m: 10, l: 25, xl: 75,
  },
  textVariants: {
    header: { fontFamily: 'Poppins-Bold', fontSize: 36 },
    subheader: { fontFamily: 'Poppins-SemiBold', fontSize: 20 },
    body: { fontFamily: 'Poppins-Regular', fontSize: 16 },
    caption: { fontFamily: 'Poppins-Regular', fontSize: 14, color: 'textSecondary' },
    button: { fontFamily: 'Poppins-SemiBold', fontSize: 16 },
  },
};

// 2. Color Palette
// =================================
const primaryColor = '#A9CF38';
const neutrals = {
  white: '#FFFFFF', offWhite: '#F4F4F4', lightGrey: '#EAEAEA',
  grey: '#AAAAAA', darkGrey: '#666666', charcoal: '#2f2f2f',
  offBlack: '#1E1E1E', black: '#121212',
};
const system = {
  success: '#2ECC40', error: '#FF4136', warning: '#FF851B',
};

// 3. Theme-Specific Colors
// =================================
const lightThemeColors = {
  primary: primaryColor, background: neutrals.offWhite, card: neutrals.white,
  text: neutrals.offBlack, textSecondary: neutrals.darkGrey, textOnPrimary: neutrals.white,
  border: neutrals.lightGrey, placeholder: neutrals.grey, icon: neutrals.darkGrey,
  tabIconDefault: neutrals.darkGrey, tabIconSelected: primaryColor,
  ...system,
};

const darkThemeColors = {
  primary: primaryColor, background: neutrals.black, card: neutrals.offBlack,
  text: neutrals.white, textSecondary: neutrals.grey, textOnPrimary: neutrals.black,
  border: neutrals.charcoal, placeholder: neutrals.darkGrey, icon: neutrals.grey,
  tabIconDefault: neutrals.grey, tabIconSelected: neutrals.white,
  ...system,
};

// 4. Full Application Themes
// =================================
// Combine Navigation defaults, our design tokens, and our color palettes
export const AppLightTheme = {
  ...DefaultTheme,
  ...designTokens,
  colors: {
    ...DefaultTheme.colors,
    ...lightThemeColors,
  },
};

export const AppDarkTheme = {
  ...DarkTheme,
  ...designTokens,
  colors: {
    ...DarkTheme.colors,
    ...darkThemeColors,
  },
};