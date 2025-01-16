import type GUI from 'lil-gui';
import type Instance from '../core/Instance';
import type Entity3D from '../entities/Entity3D';
import type EntityInspector from './EntityInspector';
import Panel from './Panel';
/**
 * Provides an inspector for the entities in an instance.
 * To add a custom inspector for a specific entity type,
 * use {@link registerInspector}.
 *
 */
declare class EntityPanel extends Panel {
    private _createInspectorsCb;
    folders: GUI[];
    inspectors: EntityInspector[];
    /**
     * @param gui - The GUI.
     * @param instance - The Giro3D instance.
     */
    constructor(gui: GUI, instance: Instance);
    dispose(): void;
    /**
     * Registers an inspector for an entity type.
     *
     * @param type - The entity type. This should match the property `type` on the entity.
     * @param inspector - The inspector.
     * @example
     * EntityPanel.registerInspector('Map', MyCustomMapInspector);
     */
    static registerInspector<T extends Entity3D = Entity3D>(type: string, inspector: typeof EntityInspector<T>): void;
    update(): void;
    createInspectors(): void;
}
export default EntityPanel;
//# sourceMappingURL=EntityPanel.d.ts.map