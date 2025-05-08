import * as GeoJSON from 'geojson';
interface MapBounds {
    getWest: () => number;
    getSouth: () => number;
    getEast: () => number;
    getNorth: () => number;
}
interface TrixelProperties {
    id: number;
    level: number;
}
type TrixelFeatureCollection = GeoJSON.FeatureCollection<GeoJSON.Polygon, TrixelProperties>;
export declare const getTrixelLevelFromNumericId: (id: number) => number;
export declare const getTrixelsForView: (bounds: MapBounds | null, // Parameter kept for signature compatibility, but now IGNORED
resolution: number) => number[];
export declare const trixelsToFC: (ids: number[]) => TrixelFeatureCollection;
export declare const getTriResolutionForZoom: (zoom: number) => number;
export {};
