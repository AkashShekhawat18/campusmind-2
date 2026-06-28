'use client';

import { useState, useCallback, useEffect } from 'react';
import { BoundingBox } from './useSafeZones';

export type WaypointName = 'hero' | 'features' | 'teacher' | 'footer' | 'chat' | 'hiddenRight';

interface Point {
  x: number;
  y: number;
}

export function useWaypointMovement(safeZones: BoundingBox[], malphorSize: number = 280) {
  const [currentWaypoint, setCurrentWaypoint] = useState<WaypointName>('hero');
  const [offset, setOffset] = useState<Point>({ x: 0, y: 0 });

  // Rightmost edge of screen. 
  // Base position (0,0) is bottom-right (bottom: 24px, right: 24px).
  const getWaypointCoordinates = useCallback((name: WaypointName): Point => {
    if (typeof window === 'undefined') return { x: 0, y: 0 };
    
    // x and y here are translation offsets from the bottom-right corner.
    // Negative y moves UP. Negative x moves LEFT.
    
    switch (name) {
      case 'hiddenRight':
        return { x: 400, y: 0 }; // Off-screen right
      case 'hero':
      case 'footer': // Footer also wants lower right
        return { x: 0, y: 0 };
      case 'features':
        // Middle right
        return { x: 0, y: -(window.innerHeight / 2 - malphorSize / 2) };
      case 'teacher':
        // Upper right
        return { x: 0, y: -(window.innerHeight - malphorSize - 120) }; // 120px margin from top to clear nav
      case 'chat': {
        // Chat panel is 380px wide and 600px tall, positioned bottom-right.
        const isMobile = window.innerWidth < 768;
        if (isMobile) {
          // Move above chat
          return { x: 0, y: -620 }; 
        } else {
          // Move to left of chat
          return { x: -400, y: 0 };
        }
      }
      default:
        return { x: 0, y: 0 };
    }
  }, [malphorSize]);

  // Collision resolution
  const resolveCollision = useCallback((targetOffset: Point): Point => {
    if (typeof window === 'undefined') return targetOffset;

    // Calculate Malphor's bounding box based on the proposed offset
    // The container is fixed bottom-6 right-6
    const bottomMargin = 24;
    const rightMargin = 24;
    
    let resolved = { ...targetOffset };
    let hasCollision = true;
    let iterations = 0;

    while (hasCollision && iterations < 10) {
      hasCollision = false;
      
      const malphorRect = {
        x: window.innerWidth - rightMargin - malphorSize + resolved.x,
        y: window.innerHeight - bottomMargin - malphorSize + resolved.y,
        width: malphorSize,
        height: malphorSize
      };

      for (const zone of safeZones) {
        // Check intersection
        if (
          malphorRect.x < zone.x + zone.width &&
          malphorRect.x + malphorRect.width > zone.x &&
          malphorRect.y < zone.y + zone.height &&
          malphorRect.y + malphorRect.height > zone.y
        ) {
          hasCollision = true;
          // Resolve by pushing Malphor UP (since he's on the right edge, we usually just slide him up or down)
          // We will push him to the top edge of the exclusion zone
          resolved.y -= 10; 
          break;
        }
      }
      iterations++;
    }

    return resolved;
  }, [safeZones, malphorSize]);

  const moveToWaypoint = useCallback((name: WaypointName) => {
    setCurrentWaypoint(name);
    const target = getWaypointCoordinates(name);
    const resolved = resolveCollision(target);
    setOffset(resolved);
  }, [getWaypointCoordinates, resolveCollision]);

  // Re-evaluate on resize or safe zone updates
  useEffect(() => {
    moveToWaypoint(currentWaypoint);
  }, [safeZones, currentWaypoint, moveToWaypoint]);

  return {
    currentWaypoint: { name: currentWaypoint },
    offset,
    moveToWaypoint
  };
}
