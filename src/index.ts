import ActualHTMmapClass from './HTMmap';
import ActualTrixelUtilsClass from './TrixelUtils';

// Continue to export your custom function (getTrixelCornerVectorsFromHTMName) as a named export
export * from './htm-vertex-utils';

// Main HTM classes and functions
export { default as HTMmap } from './HTMmap';

// HTM utility functions
export * from './htm-utils';

// Potentially other core exports if any, for example, types used across modules
// export type { Vec3D } from './htm-vertex-utils'; // Example if Vec3D is a core type to expose
// export type { SphericalCoords, Vector3D as CartVector3D } from './HTMmap'; // Example for core data types

// Create the default export object that triangle-globe expects
const htmJsDefault = {
  HTMmap: ActualHTMmapClass,
  TrixelUtils: ActualTrixelUtilsClass,
  // You could also add getTrixelCornerVectorsFromHTMName to this default export if desired:
  // getTrixelCornerVectorsFromHTMName: getTrixelCornerVectorsFromHTMName // (would need to be imported explicitly if not using export *)
};

export default htmJsDefault; 