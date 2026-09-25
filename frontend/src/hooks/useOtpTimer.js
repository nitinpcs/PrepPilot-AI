import { useState, useEffect } from 'react';

export const useOtpTimer = (expiresAt) => {
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!expiresAt) {
      setSecondsLeft(0);
      setIsExpired(true);
      return;
    }

    const tick = () => {
      const remaining = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
      setSecondsLeft(remaining);
      setIsExpired(remaining === 0);
    };

    tick();
    const interval = setInterval(tick, 250);
    return () => clearInterval(interval);
  }, [expiresAt]);

  return { secondsLeft, isExpired };
};
