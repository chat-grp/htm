import ActualHTMmapClass from './HTMmap';
import ActualTrixelUtilsClass from './TrixelUtils';
export * from './htm-vertex-utils';
export { default as HTMmap } from './HTMmap';
export * from './htm-utils';
declare const htmJsDefault: {
    HTMmap: typeof ActualHTMmapClass;
    TrixelUtils: typeof ActualTrixelUtilsClass;
};
export default htmJsDefault;
