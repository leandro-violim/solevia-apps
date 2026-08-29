import { useEffect, useState } from "react";
import { getCoins, subscribeCoins } from "../lib/economy";

/**
 * Live coin balance. Reads on the client (SSR-safe: starts at 0) and re-renders
 * on any earn/spend via the economy subscription.
 */
export function CoinBalance({ className = "" }: { className?: string }) {
  const [coins, setCoins] = useState(0);
  useEffect(() => {
    const read = () => setCoins(getCoins());
    read();
    return subscribeCoins(read);
  }, []);
  return (
    <span className={`inline-flex items-center gap-1 tabular-nums ${className}`}>
      <span aria-hidden>🪙</span>
      <span>{coins}</span>
    </span>
  );
}
