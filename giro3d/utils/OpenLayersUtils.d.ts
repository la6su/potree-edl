import type { Feature } from 'ol';
import type { Color as OLColor } from 'ol/color';
import type { ColorLike } from 'ol/colorlike';
import type { Extent as OLExtent } from 'ol/extent';
import { Color } from 'three';
import Extent from '../core/geographic/Extent';
declare function fromOLExtent(extent: OLExtent, projectionCode: string): Extent;
declare function toOLExtent(extent: Extent, margin?: number): OLExtent;
declare function fromOLColor(input: OLColor | ColorLike): {
    color: Color;
    opacity: number;
};
declare function getFeatureExtent(feature: Feature, crs: string): Extent | undefined;
declare const _default: {
    fromOLExtent: typeof fromOLExtent;
    toOLExtent: typeof toOLExtent;
    fromOLColor: typeof fromOLColor;
    getFeatureExtent: typeof getFeatureExtent;
};
export default _default;
//# sourceMappingURL=OpenLayersUtils.d.ts.map