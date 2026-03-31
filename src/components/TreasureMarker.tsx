import { useEffect, useRef } from 'react';
import type { TreasureLocation } from '../types/hunt';

interface TreasureMarkerProps {
  panorama: google.maps.StreetViewPanorama | null;
  location: TreasureLocation;
  visible: boolean;
  onFound: () => void;
}

/**
 * custom OverlayView that renders a treasure image in Street View.
 * it is attached to the panorama and positioned at the location's coordinates.
 * only shown when `visible` is true (player is within proximity radius).
 */
export function TreasureMarker({ panorama, location, visible, onFound }: TreasureMarkerProps) {
  const overlayRef = useRef<google.maps.OverlayView | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!panorama) return;

    class TreasureOverlay extends google.maps.OverlayView {
      private position: google.maps.LatLng;
      private container: HTMLDivElement;

      constructor(position: google.maps.LatLng, container: HTMLDivElement) {
        super();
        this.position = position;
        this.container = container;
      }

      onAdd() {
        this.container.style.position = 'absolute';
        this.container.style.cursor = 'pointer';
        this.container.style.transform = 'translate(-50%, -100%)';
        const panes = this.getPanes();
        panes?.overlayMouseTarget.appendChild(this.container);
      }

      draw() {
        const projection = this.getProjection();
        if (!projection) return;
        const point = projection.fromLatLngToDivPixel(this.position);
        if (!point) return;
        this.container.style.left = point.x + 'px';
        this.container.style.top = point.y + 'px';
      }

      onRemove() {
        this.container.parentElement?.removeChild(this.container);
      }
    }

    // create container element
    const container = document.createElement('div');
    container.innerHTML = `
      <div class="treasure-marker ${visible ? 'treasure-marker--visible' : ''}" title="Click to collect!">
        <img src="${location.imageUrl}" alt="Treasure" width="48" height="48" />
        <div class="treasure-marker__pulse"></div>
      </div>
    `;
    container.addEventListener('click', (e) => {
      e.stopPropagation();
      if (visible) onFound();
    });
    containerRef.current = container;

    const pos = new google.maps.LatLng(location.coordinates.lat, location.coordinates.lng);
    const overlay = new TreasureOverlay(pos, container);
    overlay.setMap(panorama);
    overlayRef.current = overlay;

    return () => {
      overlay.setMap(null);
      overlayRef.current = null;
      containerRef.current = null;
    };
    // re-create when panorama or location changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panorama, location.id]);

  // update visibility without recreating the overlay
  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current.querySelector('.treasure-marker') as HTMLElement | null;
    if (!el) return;
    if (visible) {
      el.classList.add('treasure-marker--visible');
    } else {
      el.classList.remove('treasure-marker--visible');
    }
  }, [visible]);

  // update click handler when onFound changes
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const handler = (e: Event) => {
      e.stopPropagation();
      if (visible) onFound();
    };
    container.addEventListener('click', handler);
    return () => container.removeEventListener('click', handler);
  }, [onFound, visible]);

  return null;
}
