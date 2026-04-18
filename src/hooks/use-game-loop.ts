import { useEffect } from 'react';
import { getDistanceInMeters } from '../utils.ts/geo-match';
import { useGameStore } from '../store/gameStore';

interface UseGameLoopProps {
  coordinates: { lat: number; lng: number } | null;
  accuracy: number | null;
}

/**
 * Shared game loop hook — handles route tracking and win detection.
 * Works identically in both Random and Custom game modes.
 */
export function useGameLoop({ coordinates, accuracy }: UseGameLoopProps) {
  const target = useGameStore((s) => s.target);
  const setRoute = useGameStore((s) => s.setRoute);
  const winRound = useGameStore((s) => s.winRound);

  useEffect(() => {
    if (!target || !coordinates) return;

    // Wait until address is resolved
    if (target.address === 'Loading address...') return;

    // Filter out GPS jitter
    if (accuracy && accuracy > 25) return;

    // Add point to route only if moved > 10m
    setRoute((prev) => {
      const lastPoint = prev[prev.length - 1];
      if (!lastPoint) return [[coordinates.lat, coordinates.lng]];
      const moved = getDistanceInMeters(
        coordinates.lat,
        coordinates.lng,
        lastPoint[0],
        lastPoint[1]
      );
      if (moved > 10) {
        return [...prev, [coordinates.lat, coordinates.lng]];
      }
      return prev;
    });

    // Win condition
    const distToTarget = getDistanceInMeters(
      coordinates.lat,
      coordinates.lng,
      target.lat,
      target.lng
    );
    if (distToTarget <= 10) {
      setTimeout(() => winRound(), 0);
    }
  }, [coordinates, target, accuracy, setRoute, winRound]);
}
