/**
 * Toast Provider Component (app/providers/toast-provider.tsx)
 * 
 * This component provides application-wide toast notifications using the Sonner toast library.
 * It wraps the application to enable toast notifications anywhere in the component tree.
 * 
 * Related Files:
 * - app/providers/client-providers.tsx (Wraps app with ToastProvider)
 * - app/layout.tsx (Uses ClientProviders)
 * - app/(main)/(routes)/bible-chat/page.tsx (Example of toast usage)
 * - app/api/chat/conversations/route.ts (Uses toasts for API responses)
 * 
 * Purpose:
 * 1. Provides global toast notification system
 * 2. Centralizes toast configuration
 * 3. Ensures consistent notification appearance
 * 4. Handles toast positioning and animations
 * 
 * Configuration:
 * - position="top-center": Shows toasts at top center of screen
 * - richColors: Enables enhanced color schemes
 * - closeButton: Adds close button to toasts
 * - theme="system": Matches system theme preference
 * 
 * Usage Example:
 * ```tsx
 * import { toast } from 'sonner';
 * 
 * // Show success toast
 * toast.success('Operation completed');
 * 
 * // Show error toast
 * toast.error('Something went wrong');
 * ```
 */

'use client';

import { Toaster } from 'sonner';

export function ToastProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster 
        position="top-center"
        richColors
        closeButton
        theme="system"
      />
    </>
  );
}

/**
 * Implementation Details:
 * 
 * 1. Client Component:
 *    - Uses 'use client' directive for client-side rendering
 *    - Required for interactive notifications
 * 
 * 2. Children Wrapping:
 *    - Wraps children components to provide toast context
 *    - Maintains component hierarchy
 * 
 * 3. Toast Types Supported:
 *    - Success notifications
 *    - Error messages
 *    - Info alerts
 *    - Loading states
 *    - Custom content
 * 
 * 4. Common Use Cases:
 *    - API response feedback
 *    - Form submission results
 *    - Error handling
 *    - Operation confirmations
 *    - System notifications
 * 
 * 5. Benefits:
 *    - Consistent notification style
 *    - Centralized configuration
 *    - Automatic cleanup
 *    - Accessible by default
 *    - Theme awareness
 */ 