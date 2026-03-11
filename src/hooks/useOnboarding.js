import { useState } from 'react';

export default function useOnboarding() {
  const [showOnboarding, setShowOnboarding] = useState(
    () => localStorage.getItem('pms-onboarding-complete') !== 'true'
  );

  const completeOnboarding = () => {
    localStorage.setItem('pms-onboarding-complete', 'true');
    setShowOnboarding(false);
  };

  return { showOnboarding, completeOnboarding };
}
