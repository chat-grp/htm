declare function lookupIdRaDec(ra: number, dec: number, depth: number): number;
declare class HTMmap {
    constructor();
    lookupIdLonLat(lon: number, lat: number, depth: number): number;
    lookupIdRaDec: typeof lookupIdRaDec;
    trixelBoundary(id: number): Array<[number, number]>;
}
export default HTMmap;
