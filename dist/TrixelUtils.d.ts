declare class TrixelUtils {
    htmMap: any;
    DEFAULT_LEVEL: number;
    DEFAULT_LENGTH: number;
    constructor(htmMap: any);
    fetchTrixelsFromView(nw: any, sw: any, se: any, ne: any): {
        startTrixId: any;
        endTrixId: any;
    };
}
export default TrixelUtils;
