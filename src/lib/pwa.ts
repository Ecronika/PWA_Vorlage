import { useRegisterSW } from 'virtual:pwa-register/react';

export function useUpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisterError(error) {
      console.error('SW registration failed', error);
    },
  });

  return {
    needRefresh,
    dismiss: () => setNeedRefresh(false),
    refresh: () => updateServiceWorker(true),
  };
}
