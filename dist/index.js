"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HTMmap = void 0;
const HTMmap_1 = __importDefault(require("./HTMmap"));
const TrixelUtils_1 = __importDefault(require("./TrixelUtils"));
// Continue to export your custom function (getTrixelCornerVectorsFromHTMName) as a named export
__exportStar(require("./htm-vertex-utils"), exports);
// Main HTM classes and functions
var HTMmap_2 = require("./HTMmap");
Object.defineProperty(exports, "HTMmap", { enumerable: true, get: function () { return __importDefault(HTMmap_2).default; } });
// HTM utility functions
__exportStar(require("./htm-utils"), exports);
// Potentially other core exports if any, for example, types used across modules
// export type { Vec3D } from './htm-vertex-utils'; // Example if Vec3D is a core type to expose
// export type { SphericalCoords, Vector3D as CartVector3D } from './HTMmap'; // Example for core data types
// Create the default export object that triangle-globe expects
const htmJsDefault = {
    HTMmap: HTMmap_1.default,
    TrixelUtils: TrixelUtils_1.default,
    // You could also add getTrixelCornerVectorsFromHTMName to this default export if desired:
    // getTrixelCornerVectorsFromHTMName: getTrixelCornerVectorsFromHTMName // (would need to be imported explicitly if not using export *)
};
exports.default = htmJsDefault;
