import { useEffect, useState, type ComponentType } from 'react';

export function DashboardSwitchGate() {
  const [Bar, setBar] = useState<ComponentType | null>(null);

  useEffect(() => {
    let active = true;
    if (
      import.meta.env.VITE_DATA_SOURCE === 'memory' &&
      import.meta.env.VITE_APP_ENV !== 'production'
    ) {
      void import('./DashboardSwitchBar').then((mod) => {
        if (active) {
          setBar(() => mod.DashboardSwitchBar);
        }
      });
    }
    return () => {
      active = false;
    };
  }, []);

  if (
    import.meta.env.VITE_DATA_SOURCE === 'memory' &&
    import.meta.env.VITE_APP_ENV !== 'production' &&
    Bar
  ) {
    return <Bar />;
  }

  return null;
}
