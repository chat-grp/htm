export declare const RAD: number;
export declare const DEG: number;
/**
 * Spherical linear interpolation.
 * @param a Start unit vector (Cartesian [x,y,z])
 * @param b End unit vector (Cartesian [x,y,z])
 * @param t Interpolation factor (0 to 1)
 * @returns Interpolated unit vector (Cartesian [x,y,z])
 */
export declare function slerp(a: number[], b: number[], t: number): number[];
/**
 * Converts Cartesian coordinates (unit vector) to [longitude, latitude] in degrees.
 * @param p Cartesian [x,y,z] unit vector
 * @returns Tuple [longitude, latitude] in degrees
 */
export declare function cart2ll([x, y, z]: number[]): readonly [number, number];
/**
 * Adjusts longitude coordinates in a ring to handle antimeridian crossings,
 * ensuring segments are represented in a way that allows continuous rendering.
 * Input ring points are expected to have longitudes already normalized to [-180, 180]
 * by the cart2ll function or similar.
 * @param ring An array of [longitude, latitude] points.
 * @returns A new array of [longitude, latitude] points with adjusted longitudes.
 */
export declare function wrapRingForAntimeridian(ring: Array<[number, number]>): Array<[number, number]>;
