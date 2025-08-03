// sdaw/app/my-profile.tsx
import React from 'react';
import MeScreen from './(tabs)/me';

/**
 * This screen is a wrapper around the MeScreen component from the "Me" tab.
 * It allows the user's own profile to be displayed outside of the tab navigator,
 * for instance, when navigating from search results.
 */
export default function MyProfileScreen() {
  return <MeScreen />;
}