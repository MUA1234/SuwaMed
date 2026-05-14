import { createNavigationContainerRef } from '@react-navigation/native';

// Shared NavigationContainer ref used for deep-linking from outside the React
// tree (e.g. push notification tap handlers in App.tsx). Use isReady() before
// dispatching navigation actions — the ref is null during the first render.
export const navigationRef = createNavigationContainerRef();
