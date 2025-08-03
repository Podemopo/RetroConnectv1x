// sdaw/app/(tabs)/sell.tsx
import React from 'react';
import { View } from 'react-native';

/**
 * This component exists only to satisfy the file-based routing of Expo Tabs.
 * The actual "Sell" action is handled in the `_layout.tsx` file for this directory,
 * which intercepts the tab press and opens the image picker and sell form modal.
 * The content of this screen is never rendered.
 */
export default function SellTabScreen() {
  return <View />;
}