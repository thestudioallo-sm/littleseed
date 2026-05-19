/**
 * SVGO configuration — optimises coloring sheet SVGs for web delivery.
 *
 * Usage:
 *   npx svgo --config svgo.config.js -f public/coloring/ -r
 *
 * IMPORTANT: coloring sheets must retain their stroke paths so children
 * can colour them in. We therefore keep viewBox, strokes, and paths
 * intact, only removing metadata and redundant attributes.
 */
module.exports = {
  multipass: true,

  plugins: [
    // Safe: remove XML declaration, comments, and metadata
    'removeDoctype',
    'removeXMLProcInst',
    'removeComments',
    'removeMetadata',
    'removeEditorsNSData',
    'cleanupAttrs',

    // Safe: remove redundant whitespace
    'collapseGroups',
    'cleanupIds',

    // Safe: minimise numbers (fewer decimal places = smaller file)
    { name: 'cleanupNumericValues', params: { floatPrecision: 2 } },
    { name: 'convertPathData',      params: { floatPrecision: 2 } },

    // Safe: remove hidden / invisible elements that have no colour
    'removeHiddenElems',
    'removeEmptyAttrs',
    'removeEmptyContainers',
    'removeEmptyText',

    // DO NOT enable these for coloring sheets:
    // 'convertShapeToPath'  — changes element types, breaks some SVG viewers
    // 'mergePaths'          — merges paths, removing individual colourable areas
    // 'removeViewBox'       — we NEED viewBox for responsive scaling
    // 'removeUselessStrokeAndFill' — coloring sheets are defined by strokes!
    // 'convertColors'       — keep colours explicit for teacher reference
  ],
};
