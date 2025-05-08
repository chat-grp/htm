"use strict";
// HTMmap.ts (FIXED for tuple assignment errors and readonly)
Object.defineProperty(exports, "__esModule", { value: true });
const sphere_1 = require("./sphere");
// --- Vector Math Helpers ---
const Vector3DStatic = { new: (x, y, z) => ({ x, y, z }) };
function v_add(v1, v2) { return { x: v1.x + v2.x, y: v1.y + v2.y, z: v1.z + v2.z }; }
function v_normalize(v) {
    const len = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
    if (len < 1e-15)
        return Vector3DStatic.new(0.0, 0.0, 0.0);
    return { x: v.x / len, y: v.y / len, z: v.z / len };
}
function spherical_to_cartesian(coords) {
    const ra_rad = coords.ra * Math.PI / 180.0;
    const dec_rad = coords.dec * Math.PI / 180.0;
    return {
        x: Math.cos(dec_rad) * Math.cos(ra_rad),
        y: Math.cos(dec_rad) * Math.sin(ra_rad),
        z: Math.sin(dec_rad)
    };
}
function v_cross(v1, v2) { return { x: v1.y * v2.z - v1.z * v2.y, y: v1.z * v2.x - v1.x * v2.z, z: v1.x * v2.y - v1.y * v2.x }; }
function v_dot(v1, v2) { return v1.x * v2.x + v1.y * v2.y + v1.z * v2.z; }
function is_point_in_triangle(p, v0, v1, v2, epsilon) {
    const n01 = v_cross(v0, v1);
    if (v_dot(n01, p) < -epsilon)
        return false;
    const n12 = v_cross(v1, v2);
    if (v_dot(n12, p) < -epsilon)
        return false;
    const n20 = v_cross(v2, v0);
    if (v_dot(n20, p) < -epsilon)
        return false;
    return true;
}
// --- Constants ---
const V_OCT = [
    Vector3DStatic.new(0.0, 0.0, 1.0), Vector3DStatic.new(1.0, 0.0, 0.0),
    Vector3DStatic.new(0.0, 1.0, 0.0), Vector3DStatic.new(-1.0, 0.0, 0.0),
    Vector3DStatic.new(0.0, -1.0, 0.0), Vector3DStatic.new(0.0, 0.0, -1.0),
];
// Ensure INITIAL_TRIANGLES_DEF provides the correct tuple type for 'v'
const INITIAL_TRIANGLES_DEF = [
    { id: 1, v: [V_OCT[1], V_OCT[5], V_OCT[2]] }, { id: 2, v: [V_OCT[2], V_OCT[5], V_OCT[3]] },
    { id: 3, v: [V_OCT[3], V_OCT[5], V_OCT[4]] }, { id: 4, v: [V_OCT[4], V_OCT[5], V_OCT[1]] },
    { id: 5, v: [V_OCT[1], V_OCT[0], V_OCT[4]] }, { id: 6, v: [V_OCT[4], V_OCT[0], V_OCT[3]] },
    { id: 7, v: [V_OCT[3], V_OCT[0], V_OCT[2]] }, { id: 8, v: [V_OCT[2], V_OCT[0], V_OCT[1]] },
];
const MAX_DEPTH_JS_NUMERIC = 15;
// --- Core Logic ---
function getTrixelVerticesNumeric(id) {
    const idStr = id.toString();
    if (!idStr || idStr.length === 0)
        throw new Error(`Invalid numeric ID (empty string from ${id})`);
    const rootId = parseInt(idStr[0], 10);
    if (isNaN(rootId) || rootId < 1 || rootId > 8)
        throw new Error(`Invalid root HTM ID segment: ${idStr[0]} from ID ${id}`);
    const initialTriangleDef = INITIAL_TRIANGLES_DEF.find(t => t.id === rootId);
    let currentVertices;
    // Adjust pole vertices slightly for root trixels (IDs 1-8) to aid rendering
    if (idStr.length === 1) {
        const adjustedV = initialTriangleDef.v.map(v_orig => {
            let v_new = Object.assign({}, v_orig); // Create a mutable copy
            const Z_ADJUST_NORTH = 0.9999998; // Corresponds to approx 89.966 deg lat
            const Z_ADJUST_SOUTH = -0.9999998; // Corresponds to approx -89.966 deg lat
            if (v_orig.x === 0 && v_orig.y === 0 && v_orig.z === 1.0) { // V_OCT[0] - North Pole
                v_new.z = Z_ADJUST_NORTH;
                return v_normalize(v_new); // Re-normalize after z adjustment
            }
            else if (v_orig.x === 0 && v_orig.y === 0 && v_orig.z === -1.0) { // V_OCT[5] - South Pole
                v_new.z = Z_ADJUST_SOUTH;
                return v_normalize(v_new);
            }
            return v_orig; // Return original if not a pole vertex
        });
        currentVertices = adjustedV;
    }
    else {
        currentVertices = initialTriangleDef.v;
    }
    for (let i = 1; i < idStr.length; i++) {
        const childSuffix = parseInt(idStr[i], 10);
        if (isNaN(childSuffix) || childSuffix < 1 || childSuffix > 4)
            throw new Error(`Invalid child suffix ${idStr[i]} in ID ${id}. Expected 1-4.`);
        // p0, p1, p2 are correctly destructured from the tuple currentVertices
        const [p0, p1, p2] = currentVertices;
        const w0 = v_normalize(v_add(p1, p2));
        const w1 = v_normalize(v_add(p0, p2));
        const w2 = v_normalize(v_add(p0, p1));
        // FIX: Ensure the new array assigned to currentVertices is explicitly a 3-element tuple
        if (childSuffix === 1)
            currentVertices = [p0, w2, w1];
        else if (childSuffix === 2)
            currentVertices = [p1, w0, w2];
        else if (childSuffix === 3)
            currentVertices = [p2, w1, w0];
        else
            currentVertices = [w0, w1, w2];
    }
    return currentVertices;
}
function lookupIdRaDec(ra, dec, depth) {
    if (depth > MAX_DEPTH_JS_NUMERIC)
        throw new Error(`Depth ${depth} exceeds max JS numeric ID depth ${MAX_DEPTH_JS_NUMERIC}`);
    if (depth < 0)
        throw new Error("Depth cannot be negative.");
    const point_cartesian = spherical_to_cartesian({ ra, dec });
    let current_htm_id = null;
    let current_triangle_vertices_opt = null;
    const primaryEpsilon = 1e-9, fallbackEpsilon = 1e-7;
    for (const it of INITIAL_TRIANGLES_DEF) {
        if (is_point_in_triangle(point_cartesian, it.v[0], it.v[1], it.v[2], primaryEpsilon)) {
            current_htm_id = it.id;
            current_triangle_vertices_opt = it.v;
            break;
        }
    }
    if (!current_triangle_vertices_opt) {
        for (const it of INITIAL_TRIANGLES_DEF) {
            if (is_point_in_triangle(point_cartesian, it.v[0], it.v[1], it.v[2], fallbackEpsilon)) {
                current_htm_id = it.id;
                current_triangle_vertices_opt = it.v;
                break;
            }
        }
    }
    if (!current_triangle_vertices_opt || current_htm_id === null)
        throw new Error(`Failed to find initial HTM triangle for RA ${ra}, Dec ${dec}.`);
    // current_triangle_vertices is correctly typed here because current_triangle_vertices_opt is a tuple or null
    let current_triangle_vertices = current_triangle_vertices_opt;
    for (let r = 0; r < depth; r++) {
        const [p0, p1, p2] = current_triangle_vertices;
        const w0 = v_normalize(v_add(p1, p2));
        const w1 = v_normalize(v_add(p0, p2));
        const w2 = v_normalize(v_add(p0, p1));
        // The 'v' property in children objects will be inferred as a 3-element tuple
        const children = [
            { s: 1, v: [p0, w2, w1] },
            { s: 2, v: [p1, w0, w2] },
            { s: 3, v: [p2, w1, w0] },
            { s: 4, v: [w0, w1, w2] }
        ];
        let found_child = false;
        for (const ch of children) {
            if (is_point_in_triangle(point_cartesian, ch.v[0], ch.v[1], ch.v[2], primaryEpsilon)) {
                current_htm_id = current_htm_id * 10 + ch.s;
                current_triangle_vertices = ch.v;
                found_child = true;
                break;
            }
        }
        if (!found_child) {
            for (const ch of children) {
                if (is_point_in_triangle(point_cartesian, ch.v[0], ch.v[1], ch.v[2], fallbackEpsilon)) {
                    current_htm_id = current_htm_id * 10 + ch.s;
                    current_triangle_vertices = ch.v;
                    found_child = true;
                    break;
                }
            }
        }
        if (!found_child)
            throw new Error(`Failed to find child HTM trixel at level ${r + 1} for RA ${ra}, Dec ${dec} (parent ${current_htm_id}).`);
    }
    return current_htm_id;
}
// --- Edge Densification & Boundary Generation ---
const DEFAULT_SEGMENTS_PER_EDGE = 16;
function objToArr(v) { return [v.x, v.y, v.z]; }
function normalizeLongitude(lon) {
    let l = lon % 360;
    if (l > 180)
        l -= 360;
    if (l < -180)
        l += 360;
    return l;
}
function areLonLatPointsEqual(p1, p2, tolerance = 1e-9) {
    if (!p1 || !p2)
        return false;
    return Math.abs(normalizeLongitude(p1[0]) - normalizeLongitude(p2[0])) < tolerance && Math.abs(p1[1] - p2[1]) < tolerance;
}
function getPolygonCoordinatesForGlobe(v0_obj, v1_obj, v2_obj, segmentsPerEdge) {
    const vertices3D = [v0_obj, v1_obj, v2_obj];
    const polygonRingLonLat = [];
    for (let i = 0; i < 3; i++) {
        const p_start_obj = vertices3D[i];
        const p_end_obj = vertices3D[(i + 1) % 3];
        const p_start_arr = objToArr(p_start_obj);
        const p_end_arr = objToArr(p_end_obj);
        const start_ll = [...(0, sphere_1.cart2ll)(p_start_arr)];
        if (i === 0) {
            polygonRingLonLat.push(start_ll);
        }
        for (let j = 1; j < segmentsPerEdge; j++) {
            const t = j / segmentsPerEdge;
            const slerped_p_arr = (0, sphere_1.slerp)(p_start_arr, p_end_arr, t);
            const slerped_norm_obj = v_normalize({ x: slerped_p_arr[0], y: slerped_p_arr[1], z: slerped_p_arr[2] });
            const slerped_ll = [...(0, sphere_1.cart2ll)(objToArr(slerped_norm_obj))];
            polygonRingLonLat.push(slerped_ll);
        }
        const end_ll = [...(0, sphere_1.cart2ll)(p_end_arr)];
        polygonRingLonLat.push(end_ll);
    }
    const uniquePoints = [];
    if (polygonRingLonLat.length > 0) {
        uniquePoints.push(polygonRingLonLat[0]);
        for (let k = 1; k < polygonRingLonLat.length; k++) {
            if (!areLonLatPointsEqual(polygonRingLonLat[k], polygonRingLonLat[k - 1])) {
                if (k === polygonRingLonLat.length - 1 && areLonLatPointsEqual(polygonRingLonLat[k], uniquePoints[0])) {
                    // Don't add
                }
                else {
                    uniquePoints.push(polygonRingLonLat[k]);
                }
            }
        }
    }
    if (uniquePoints.length > 0 && !areLonLatPointsEqual(uniquePoints[0], uniquePoints[uniquePoints.length - 1])) {
        uniquePoints.push([...uniquePoints[0]]);
    }
    if (uniquePoints.length < 4) {
        //console.warn(`[getPolygonCoordinatesForGlobe] Trixel resulted in < 4 unique points after densification: ${uniquePoints.length}`);
        return []; // Return empty if not enough points for a valid ring
    }
    // DO NOT wrap here, wrap in trixelBoundary after getting the raw coordinates.
    return uniquePoints;
}
// --- Custom Longitude Unwrapper ---
function unwrapLongitudeRing(ring) {
    if (!ring || ring.length === 0)
        return [];
    const unwrappedRing = [[ring[0][0], ring[0][1]]];
    for (let i = 1; i < ring.length; i++) {
        let lon = ring[i][0];
        const prevLon = unwrappedRing[i - 1][0];
        const lat = ring[i][1];
        // Adjust longitude to be closest to previous longitude
        if (Math.abs(prevLon - lon) > 180) { // Threshold for a jump that likely crossed antimeridian
            if (lon < prevLon) { // e.g. prevLon = 170, lon = -170. lon becomes 190
                lon += 360;
            }
            else { // e.g. prevLon = -170, lon = 170. lon becomes -190
                lon -= 360;
            }
        }
        unwrappedRing.push([lon, lat]);
    }
    // Check the closure between the new last point and the new first point.
    // If they are far apart, the entire ring might need a shift.
    if (unwrappedRing.length > 1) {
        const firstLon = unwrappedRing[0][0];
        const lastLon = unwrappedRing[unwrappedRing.length - 1][0];
        if (Math.abs(firstLon - lastLon) > 180) {
            // This naive adjustment of only the last point for closure might not be perfect
            // for all cases but aims to make the final segment connection short.
            // A more robust solution might involve shifting the whole ring.
            if (lastLon < firstLon) {
                unwrappedRing[unwrappedRing.length - 1][0] += 360;
            }
            else {
                unwrappedRing[unwrappedRing.length - 1][0] -= 360;
            }
            // Re-check equality for the very last point to prevent duplicates if it's now same as first
            if (areLonLatPointsEqual(unwrappedRing[0], unwrappedRing[unwrappedRing.length - 1])) {
                // This can happen if the ring was [A, B, C, A] and A was e.g. 170, C was -170.
                // C becomes 190. Then last point (A) vs C (190). A (170) vs 190 is not > 180.
                // Let's ensure the last point is numerically adjusted to be "close" to the first's original value for GeoJSON.
                // The `areLonLatPointsEqual` already handles normalization, so this explicit check is for numerical closeness.
                // Actually, MapLibre prefers the first and last point to be *identical* if it's a closed ring.
                // The `getPolygonCoordinatesForGlobe` already ensures the original ring closes on itself using normalized equality.
                // Our unwrapping might make the *numerical values* of the first and last point different while being equivalent.
                // e.g. start 170, end -190 (which is 170).
                // Best to ensure the last point in the unwrappedRing is a copy of the first point if they are equivalent.
                // However, areLonLatPointsEqual uses normalizeLongitude, so this might not be the direct numerical values.
                // Let's ensure the numerically last point refers to the same location as the first point, potentially unwrapped.
                // For now, simple unwrapping is the primary goal. The uniquePoints logic in getPolygonCoordinatesForGlobe handles the actual closure.
            }
        }
    }
    return unwrappedRing;
}
class HTMmap {
    constructor() {
        this.lookupIdRaDec = lookupIdRaDec;
    }
    lookupIdLonLat(lon, lat, depth) { return this.lookupIdRaDec(lon, lat, depth); }
    trixelBoundary(id) {
        if (typeof id !== 'number' || id <= 0 || isNaN(id)) {
            console.error("[HTMmap] trixelBoundary: Valid positive HTM numeric ID required. Received:", id);
            return [];
        }
        try {
            const [v0_obj, v1_obj, v2_obj] = getTrixelVerticesNumeric(id);
            // Check if it's one of the 8 root trixels for simplified polar cap handling
            if (id >= 1 && id <= 8) {
                const initialDef = INITIAL_TRIANGLES_DEF.find(t => t.id === id);
                let isNorthCap = false;
                let isSouthCap = false;
                const equatorialVertices = [];
                initialDef.v.forEach(v => {
                    if (v.x === 0 && v.y === 0 && v.z === 1.0)
                        isNorthCap = true;
                    else if (v.x === 0 && v.y === 0 && v.z === -1.0)
                        isSouthCap = true;
                    else
                        equatorialVertices.push(v);
                });
                // If it is a polar cap root trixel (one pole vertex, two equatorial)
                if ((isNorthCap || isSouthCap) && equatorialVertices.length === 2) {
                    const POLE_LAT_CLAMP = 89.99; // How close to the pole the "top" edge is
                    const nearPoleLat = isNorthCap ? POLE_LAT_CLAMP : -POLE_LAT_CLAMP;
                    // Get the two equatorial vertices' lon/lat
                    const eqV1_ll = [...(0, sphere_1.cart2ll)(objToArr(equatorialVertices[0]))];
                    const eqV2_ll = [...(0, sphere_1.cart2ll)(objToArr(equatorialVertices[1]))];
                    // Create the two near-pole vertices with the same longitudes as the equatorial ones
                    const nearPoleV1_ll = [eqV1_ll[0], nearPoleLat];
                    const nearPoleV2_ll = [eqV2_ll[0], nearPoleLat];
                    // Form a quadrilateral ring (densify the equatorial edge)
                    const simplifiedRing = [eqV1_ll];
                    const eqV1_arr = objToArr(equatorialVertices[0]);
                    const eqV2_arr = objToArr(equatorialVertices[1]);
                    for (let j = 1; j < DEFAULT_SEGMENTS_PER_EDGE; j++) {
                        const t = j / DEFAULT_SEGMENTS_PER_EDGE;
                        const slerped_p_arr = (0, sphere_1.slerp)(eqV1_arr, eqV2_arr, t);
                        const slerped_ll = [...(0, sphere_1.cart2ll)(objToArr(v_normalize({ x: slerped_p_arr[0], y: slerped_p_arr[1], z: slerped_p_arr[2] })))];
                        // Clamp latitude of intermediate points too, just in case slerp goes over pole slightly (unlikely for equator)
                        if (Math.abs(slerped_ll[1]) > POLE_LAT_CLAMP) {
                            slerped_ll[1] = Math.sign(slerped_ll[1]) * POLE_LAT_CLAMP;
                        }
                        simplifiedRing.push(slerped_ll);
                    }
                    simplifiedRing.push(eqV2_ll);
                    simplifiedRing.push(nearPoleV2_ll); // Add near-pole vertex 2
                    simplifiedRing.push(nearPoleV1_ll); // Add near-pole vertex 1
                    simplifiedRing.push(eqV1_ll); // Close the ring
                    console.log(`[HTMmap trixelBoundary DEBUG] For ROOT POLAR ID ${id}, SIMPLIFIED QUAD coordinates:`, JSON.stringify(simplifiedRing));
                    return unwrapLongitudeRing(simplifiedRing);
                }
            }
            // Default behavior for non-root or non-polar root trixels
            const rawCoordinates = getPolygonCoordinatesForGlobe(v0_obj, v1_obj, v2_obj, DEFAULT_SEGMENTS_PER_EDGE);
            if (rawCoordinates.length > 0) {
                return unwrapLongitudeRing(rawCoordinates);
            }
            else {
                return [];
            }
        }
        catch (e) {
            console.error(`[HTMmap] Error generating boundary for ID ${id}:`, e.message);
            return [];
        }
    }
}
exports.default = HTMmap;
