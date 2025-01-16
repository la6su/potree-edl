/**
 * The source to feed a `Tiles3D` entity.
 */
declare class Tiles3DSource {
    readonly isTiles3DSource: boolean;
    readonly type: string;
    readonly url: string;
    readonly networkOptions: RequestInit | undefined;
    /**
     * @param url - The URL to the root tileset.
     * @param networkOptions - the network options.
     */
    constructor(url: string, networkOptions?: RequestInit);
}
export default Tiles3DSource;
//# sourceMappingURL=Tiles3DSource.d.ts.map