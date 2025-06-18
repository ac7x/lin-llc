/**
 * Google Maps API 類型定義
 */

declare namespace google {
    namespace maps {
        class Map {
            constructor(mapDiv: Element, opts?: MapOptions);
            addListener(eventName: "click", handler: (event: MapMouseEvent) => void): MapsEventListener;
            addListener(eventName: string, handler: (...args: unknown[]) => void): MapsEventListener;
            setCenter(latLng: LatLng | LatLngLiteral): void;
            setZoom(zoom: number): void;
        }

        interface MapOptions {
            center?: LatLng | LatLngLiteral;
            zoom?: number;
            mapTypeControl?: boolean;
            streetViewControl?: boolean;
            fullscreenControl?: boolean;
        }

        interface MapMouseEvent {
            latLng?: LatLng;
        }

        class LatLng {
            constructor(lat: number, lng: number);
            lat(): number;
            lng(): number;
        }

        interface LatLngLiteral {
            lat: number;
            lng: number;
        }

        class Marker {
            constructor(opts?: MarkerOptions);
            setMap(map: Map | null): void;
            setPosition(latLng: LatLng | LatLngLiteral): void;
            getPosition(): LatLng | null;
        }

        interface MarkerOptions {
            position?: LatLng | LatLngLiteral;
            map?: Map;
            draggable?: boolean;
        }

        class Geocoder {
            constructor();
            geocode(request: GeocoderRequest, callback: (results: GeocoderResult[] | null, status: GeocoderStatus) => void): void;
        }

        interface GeocoderRequest {
            address?: string;
            location?: LatLng | LatLngLiteral;
            bounds?: LatLngBounds | LatLngBoundsLiteral;
            componentRestrictions?: GeocoderComponentRestrictions;
            region?: string;
        }

        interface GeocoderResult {
            formatted_address: string;
            geometry: GeocoderGeometry;
            place_id: string;
            types: string[];
        }

        interface GeocoderGeometry {
            location: LatLng;
            location_type: GeocoderLocationType;
            viewport: LatLngBounds;
        }

        interface GeocoderComponentRestrictions {
            country: string;
        }

        enum GeocoderStatus {
            OK = "OK",
            ZERO_RESULTS = "ZERO_RESULTS",
            OVER_QUERY_LIMIT = "OVER_QUERY_LIMIT",
            REQUEST_DENIED = "REQUEST_DENIED",
            INVALID_REQUEST = "INVALID_REQUEST",
            UNKNOWN_ERROR = "UNKNOWN_ERROR"
        }

        enum GeocoderLocationType {
            ROOFTOP = "ROOFTOP",
            RANGE_INTERPOLATED = "RANGE_INTERPOLATED",
            GEOMETRIC_CENTER = "GEOMETRIC_CENTER",
            APPROXIMATE = "APPROXIMATE"
        }

        interface LatLngBounds {
            getCenter(): LatLng;
            getNorthEast(): LatLng;
            getSouthWest(): LatLng;
        }

        interface LatLngBoundsLiteral {
            east: number;
            north: number;
            south: number;
            west: number;
        }

        interface MapsEventListener {
            remove(): void;
        }

        namespace places {
            class Autocomplete {
                constructor(inputField: HTMLInputElement, opts?: AutocompleteOptions);
                getPlace(): PlaceResult;
                setFields(fields: string[]): void;
                bindTo(bounds: LatLngBounds | LatLngBoundsLiteral, anchor: MVCObject): void;
                unbind(key: string): void;
                unbindAll(): void;
                addListener(eventName: "place_changed", handler: () => void): MapsEventListener;
                addListener(eventName: string, handler: (...args: unknown[]) => void): MapsEventListener;
            }

            interface AutocompleteOptions {
                componentRestrictions?: GeocoderComponentRestrictions;
                fields?: string[];
                types?: string[];
            }

            interface PlaceResult {
                formatted_address?: string;
                geometry?: PlaceGeometry;
                name?: string;
                place_id?: string;
                types?: string[];
            }

            interface PlaceGeometry {
                location?: LatLng;
                viewport?: LatLngBounds;
            }

            interface MVCObject {
                addListener(eventName: string, handler: (...args: unknown[]) => void): MapsEventListener;
                bindTo(key: string, target: MVCObject, targetKey?: string, noNotify?: boolean): void;
                get(key: string): unknown;
                notify(key: string): void;
                set(key: string, value: unknown): void;
                unbind(key: string): void;
                unbindAll(): void;
            }
        }
    }
}

declare global {
    interface Window {
        google: typeof google;
    }
} 