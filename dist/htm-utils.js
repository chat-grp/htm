"use strict";
// htm-utils.ts - Aligned with HTMmap.ts using 1-4 child suffixes for IDs.
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTriResolutionForZoom = exports.trixelsToFC = exports.getTrixelsForView = exports.getTrixelLevelFromNumericId = void 0;
const HTMmap_1 = __importDefault(require("./HTMmap"));
// --- Constants ---
// Max depth (0-indexed levels after root) for JS numeric IDs.
// Should match MAX_DEPTH_JS_NUMERIC in HTMmap.ts.
const MAX_HTM_DEPTH = 15;
const MAX_OUTPUT_TRIXELS = 20000;
const MAX_BFS_QUEUE_PROCESSING = 50000;
const SEED_RESOLUTION_OFFSET = 3;
// --- Numeric ID Helper Functions ---
const getTrixelLevelFromNumericId = (id) => {
    if (id < 1 || isNaN(id))
        return -1;
    // Level is 0-indexed count of digits after the root digit.
    return id.toString().length - 1;
};
exports.getTrixelLevelFromNumericId = getTrixelLevelFromNumericId;
const ROOT_TRIXEL_IDS = [1, 2, 3, 4, 5, 6, 7, 8];
const subdivideNumericId = (id) => {
    if (id < 1 || isNaN(id))
        return [];
    const currentLevel = (0, exports.getTrixelLevelFromNumericId)(id);
    if (currentLevel === -1 || currentLevel >= MAX_HTM_DEPTH) {
        return [];
    }
    // Child suffixes are 1, 2, 3, 4 (aligned with Rust code)
    return [1, 2, 3, 4].map(suffix => id * 10 + suffix);
};
// --- Geometry Helper Functions ---
function getPolygonBoundingBox(polygon) {
    if (!polygon || polygon.length === 0)
        return { west: 0, south: 0, east: 0, north: 0 };
    let minLng = polygon[0][0], maxLng = polygon[0][0];
    let minLat = polygon[0][1], maxLat = polygon[0][1];
    for (let i = 1; i < polygon.length; i++) {
        minLng = Math.min(minLng, polygon[i][0]);
        maxLng = Math.max(maxLng, polygon[i][0]);
        minLat = Math.min(minLat, polygon[i][1]);
        maxLat = Math.max(maxLat, polygon[i][1]);
    }
    return { west: minLng, south: minLat, east: maxLng, north: maxLat };
}
function doRectanglesIntersect(trixelRect, viewRect) {
    if (trixelRect.north < viewRect.south || trixelRect.south > viewRect.north)
        return false;
    for (const shift of [0, 360, -360]) {
        const shiftedViewWest = viewRect.west + shift;
        const shiftedViewEast = viewRect.east + shift;
        if (Math.max(trixelRect.west, shiftedViewWest) < Math.min(trixelRect.east, shiftedViewEast)) {
            return true;
        }
    }
    for (const shift of [0, 360, -360]) {
        const shiftedTrixelWest = trixelRect.west + shift;
        const shiftedTrixelEast = trixelRect.east + shift;
        if (Math.max(viewRect.west, shiftedTrixelWest) < Math.min(viewRect.east, shiftedTrixelEast)) {
            return true;
        }
    }
    return false;
}
// --- Seed Finding ---
const findSeedTrixelsNearBoundsNumeric = (bounds, seedResolution, htmMapInstance) => {
    const seeds = [];
    const queue = [...ROOT_TRIXEL_IDS];
    const expansionDegrees = 20;
    const generousViewRect = {
        west: bounds.getWest() - expansionDegrees,
        east: bounds.getEast() + expansionDegrees,
        south: Math.max(-90, bounds.getSouth() - expansionDegrees),
        north: Math.min(90, bounds.getNorth() + expansionDegrees)
    };
    let processedCount = 0;
    const MAX_SEED_QUEUE_PROCESSING = 5000;
    while (queue.length > 0 && processedCount < MAX_SEED_QUEUE_PROCESSING) {
        processedCount++;
        const trixelId = queue.shift();
        if (!trixelId)
            continue;
        const trixelLevel = (0, exports.getTrixelLevelFromNumericId)(trixelId);
        if (trixelLevel === -1 || trixelLevel > seedResolution)
            continue;
        let trixelBoundaryLonLat;
        try {
            trixelBoundaryLonLat = htmMapInstance.trixelBoundary(trixelId);
        }
        catch (e) {
            continue;
        }
        if (!trixelBoundaryLonLat || trixelBoundaryLonLat.length < 3)
            continue;
        const trixelRect = getPolygonBoundingBox(trixelBoundaryLonLat);
        if (!doRectanglesIntersect(trixelRect, generousViewRect))
            continue;
        if (trixelLevel === seedResolution) {
            seeds.push(trixelId);
        }
        else {
            const children = subdivideNumericId(trixelId);
            for (const childId of children)
                queue.push(childId);
        }
    }
    if (processedCount >= MAX_SEED_QUEUE_PROCESSING) {
        console.warn("[findSeedTrixelsNearBoundsNumeric] Exceeded max processing limit.");
    }
    return seeds;
};
// --- getTrixelsForView (REMOVING ALL 2D CULLING) ---
const getTrixelsForView = (bounds, // Parameter kept for signature compatibility, but now IGNORED
resolution) => {
    // const htmMapInstance = new HTMmap(); // Only needed if getting boundaries for culling
    const targetResolution = Math.min(Math.max(0, resolution), MAX_HTM_DEPTH);
    // Simplified start: Always begin from root, no seed finding based on bounds needed
    const initialTrixelSet = [...ROOT_TRIXEL_IDS];
    console.log(`[@my-scope/my-htm-fork htm-utils NO_CULLING] getTrixelsForView called, resolution: ${targetResolution}, MAX_OUTPUT: ${MAX_OUTPUT_TRIXELS}`);
    const resultTrixels = [];
    const queue = [...initialTrixelSet];
    let processedInQueueCount = 0;
    while (queue.length > 0 && resultTrixels.length < MAX_OUTPUT_TRIXELS && processedInQueueCount < MAX_BFS_QUEUE_PROCESSING) {
        processedInQueueCount++;
        const trixelId = queue.shift();
        if (!trixelId)
            continue;
        const trixelLevel = (0, exports.getTrixelLevelFromNumericId)(trixelId);
        if (trixelLevel === -1 || trixelLevel > targetResolution)
            continue;
        // ------------------------------------
        // --- NO CULLING LOGIC EXECUTED --- 
        // ------------------------------------
        // --- Add to results or subdivide ---
        if (trixelLevel === targetResolution) {
            // Add to results only if limit not reached
            if (resultTrixels.length < MAX_OUTPUT_TRIXELS) {
                resultTrixels.push(trixelId);
            }
        }
        else { // trixelLevel < targetResolution
            // Add children to queue only if result limit not reached
            if (resultTrixels.length < MAX_OUTPUT_TRIXELS) {
                const children = subdivideNumericId(trixelId);
                for (const childId of children)
                    queue.push(childId);
            }
        }
    }
    // --- Logging final status --- 
    if (processedInQueueCount >= MAX_BFS_QUEUE_PROCESSING)
        console.warn("[@my-scope/my-htm-fork htm-utils NO_CULLING] Exceeded BFS queue limit.");
    if (resultTrixels.length >= MAX_OUTPUT_TRIXELS && queue.length > 0)
        console.log(`[@my-scope/my-htm-fork htm-utils NO_CULLING] Reached MAX_OUTPUT_TRIXELS limit of ${MAX_OUTPUT_TRIXELS}.`);
    console.log(`[@my-scope/my-htm-fork htm-utils NO_CULLING] Found ${resultTrixels.length} trixels.`);
    return resultTrixels;
};
exports.getTrixelsForView = getTrixelsForView;
// --- trixelsToFC ---
const trixelsToFC = (ids) => {
    const htmMapInstance = new HTMmap_1.default();
    const features = [];
    for (const id of ids) {
        try {
            const boundaryVertices = htmMapInstance.trixelBoundary(id);
            if (!boundaryVertices || boundaryVertices.length < 4) {
                // console.warn(`[trixelsToFC] Skipping ID ${id} due to invalid boundary.`);
                continue;
            }
            // Ensure the 'id' in properties is a string if it's to be used with promoteId for string matching.
            // If your application expects to filter/query by the numeric ID directly, 
            // and promoteId is targeting that, then number is fine. 
            // But if click events are expected to yield a string ID, this should be a string.
            // For now, let's assume the numeric ID itself is the feature identifier and convert to string for promoteId.
            const properties = {
                id: id, // Keep original numeric ID as per TrixelProperties definition
                // If you need a different string for promoteId, add it here, e.g.:
                // promoted_id_str: id.toString() or a more complex stringified HTM ID like "N012"
                level: (0, exports.getTrixelLevelFromNumericId)(id)
            };
            // Let's refine properties to ensure what promoteId uses is clearly a string
            // and what your TrixelProperties type expects is met.
            // Assuming TrixelProperties.id is number, and you want to promote a string version.
            const featureProperties = {
                numericHtmId: id, // Matches TrixelProperties.id: number
                id: id.toString(), // This will be the string ID used by promoteId
                level: (0, exports.getTrixelLevelFromNumericId)(id) // Matches TrixelProperties.level: number
            };
            const feature = {
                type: 'Feature',
                geometry: { type: 'Polygon', coordinates: [boundaryVertices] },
                properties: featureProperties,
            };
            features.push(feature); // Cast back if TrixelFeature has specific property keys
        }
        catch (error) {
            console.error(`[trixelsToFC] Error processing ID ${id}:`, error.message);
            continue;
        }
    }
    return { type: 'FeatureCollection', features: features };
};
exports.trixelsToFC = trixelsToFC;
// --- getTriResolutionForZoom ---
const getTriResolutionForZoom = (zoom) => {
    // This function now expects a 'normalizedZoom' value that has already accounted
    // for latitude-based scaling in globe view.
    let res = 0;
    // The previous logic for handling negative zoom directly is removed.
    // The caller (e.g., the map component) is responsible for calculating
    // normalizedZoom = map.getZoom() + Math.log2(1 / Math.cos(map.getCenter().lat * Math.PI / 180));
    // and passing that value as the 'zoom' argument to this function.
    if (zoom < 1.0)
        res = 0;
    else if (zoom < 1.5)
        res = 1;
    else if (zoom < 2.0)
        res = 2;
    else if (zoom < 2.5)
        res = 3;
    else if (zoom < 3.0)
        res = 4;
    else if (zoom < 4.0)
        res = 5;
    else if (zoom < 5.0)
        res = 6;
    else if (zoom < 6.0)
        res = 7;
    else if (zoom < 7.0)
        res = 8;
    else if (zoom < 8.0)
        res = 9;
    else
        res = 10;
    return Math.min(res, MAX_HTM_DEPTH);
};
exports.getTriResolutionForZoom = getTriResolutionForZoom;
