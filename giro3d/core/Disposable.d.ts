/**
 * Trait of objects that hold unmanaged resources.
 */
export default interface Disposable {
    /**
     * Releases unmanaged resources from this object.
     */
    dispose(): void;
}
export declare function isDisposable(object: unknown): object is Disposable;
//# sourceMappingURL=Disposable.d.ts.map