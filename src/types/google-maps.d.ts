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
      setCenter(latLng: { lat: number; lng: number }): void;
      setZoom(zoom: number): void;
    }
    interface MarkerOptions {
      position: { lat: number; lng: number };
      map: Map;
      draggable?: boolean;
    }
    class Marker {
      constructor(options: MarkerOptions);
      setMap(map: Map | null): void;
      addListener(event: string, handler: () => void): void;
      getPosition(): { lat(): number; lng(): number } | null;
    }
    class Geocoder {
      geocode(
        request: { location: { lat: number; lng: number } } | { address: string },
        callback: (results: GeocoderResult[] | null, status: GeocoderStatus) => void
      ): void;
    }
    interface MapMouseEvent {
      latLng?: { lat(): number; lng(): number };
    }
    interface GeocoderResult {
      formatted_address: string;
      geometry: {
        location: { lat(): number; lng(): number };
      };
    }
    type GeocoderStatus = 'OK' | 'ZERO_RESULTS' | 'ERROR' | 'INVALID_REQUEST' | 'OVER_QUERY_LIMIT' | 'REQUEST_DENIED' | 'UNKNOWN_ERROR';
    
    namespace places {
      class AutocompleteService {
        getPlacePredictions(
          request: {
            input: string;
            componentRestrictions?: { country: string };
            types?: string[];
          },
          callback: (predictions: AutocompletePrediction[] | null, status: PlacesServiceStatus) => void
        ): void;
      }
      
      class PlacesService {
        constructor(map: Map);
        getDetails(
          request: {
            placeId: string;
            fields: string[];
          },
          callback: (place: PlaceResult | null, status: PlacesServiceStatus) => void
        ): void;
      }
      
      interface AutocompletePrediction {
        place_id: string;
        description: string;
        structured_formatting: {
          main_text: string;
          secondary_text: string;
        };
      }
      
      interface PlaceResult {
        geometry?: {
          location: { lat(): number; lng(): number };
        };
        formatted_address?: string;
      }
      
      enum PlacesServiceStatus {
        OK = 'OK',
        ZERO_RESULTS = 'ZERO_RESULTS',
        OVER_QUERY_LIMIT = 'OVER_QUERY_LIMIT',
        REQUEST_DENIED = 'REQUEST_DENIED',
        INVALID_REQUEST = 'INVALID_REQUEST',
        NOT_FOUND = 'NOT_FOUND',
        UNKNOWN_ERROR = 'UNKNOWN_ERROR'
      }
    }
  }
} 