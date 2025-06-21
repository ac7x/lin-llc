declare namespace google {
  namespace maps {
    interface MapOptions {
      center: { lat: number; lng: number };
      zoom: number;
      mapTypeControl?: boolean;
      streetViewControl?: boolean;
      fullscreenControl?: boolean;
    }
    class Map {
      constructor(element: Element | null, options?: MapOptions);
      addListener(event: string, handler: (event: MapMouseEvent) => void): void;
    }
    interface MarkerOptions {
      position: { lat: number; lng: number };
      map: Map;
      draggable?: boolean;
    }
    class Marker {
      constructor(options: MarkerOptions);
      setMap(map: Map | null): void;
    }
    class Geocoder {
      geocode(
        request: { location: { lat: number; lng: number } },
        callback: (results: GeocoderResult[] | null, status: GeocoderStatus) => void
      ): void;
    }
    interface MapMouseEvent {
      latLng?: { lat(): number; lng(): number };
    }
    interface GeocoderResult {
      formatted_address: string;
    }
    type GeocoderStatus = 'OK' | 'ZERO_RESULTS' | 'ERROR' | 'INVALID_REQUEST' | 'OVER_QUERY_LIMIT' | 'REQUEST_DENIED' | 'UNKNOWN_ERROR';
    namespace places {
      class Autocomplete {}
    }
  }
} 