import { Color } from 'three';
import Helpers from '../../helpers/Helpers';
import { isLight } from '../../utils/predicates';
import Panel from '../Panel';
import OutlinerPropertyView from './OutlinerPropertyView';
function getHash(scene) {
  let hash = 27 | 0;
  scene.traverse(obj => {
    hash = 13 * hash + obj.id | 0;
  });
  return hash;
}

/**
 * Returns the colors associated with the THREE object type.
 *
 * @param obj - the THREE object
 * @returns the object containing foreground and background colors
 */
function selectColor(obj) {
  const entity = isEntityRoot(obj);
  if (entity) {
    return {
      back: 'gold',
      fore: 'black'
    };
  }
  if (isLight(obj)) {
    return {
      back: 'yellow',
      fore: 'black'
    };
  }
  switch (obj.type) {
    case 'Mesh':
    case 'TileMesh':
      return {
        back: 'orange',
        fore: 'black'
      };
    case 'Points':
      return {
        back: 'red',
        fore: 'white'
      };
    case 'Object3D':
      return {
        back: 'gray',
        fore: 'white'
      };
    case 'Scene':
      return {
        back: '#CCCCCC',
        fore: 'black'
      };
    case 'Group':
      return {
        back: 'green',
        fore: 'white'
      };
    default:
      return {
        back: 'blue',
        fore: 'white'
      };
  }
}
function isMesh(obj) {
  return obj.isMesh;
}
function hasSingleMaterial(mesh) {
  return !Array.isArray(mesh.material);
}
function getMaterialVisibility(obj) {
  if (isMesh(obj) && hasSingleMaterial(obj)) {
    return obj.material.visible;
  }
  return true;
}
function isEntityRoot(obj) {
  if (obj.userData.parentEntity != null) {
    const entity = obj.userData.parentEntity;
    if (entity.object3d === obj) {
      return entity;
    }
  }
  return null;
}
function getType(obj) {
  const entity = isEntityRoot(obj);
  if (entity != null) {
    return entity.type;
  }
  return obj.type;
}
function getName(obj) {
  const entity = isEntityRoot(obj);
  if (entity != null) {
    return entity.id;
  }
  return obj.name;
}
function createTreeViewNode(object, marginLeft, clickHandler, onUpdate) {
  const root = document.createElement('button');
  root.style.width = 'unset';
  root.style.textAlign = 'left';
  root.onclick = () => clickHandler(object);
  const collapseButton = document.createElement('button');
  collapseButton.style.width = '1rem';
  collapseButton.style.height = '1rem';
  collapseButton.title = 'collapse sub-tree';
  collapseButton.style.backgroundColor = 'grey';
  collapseButton.style.margin = '2px';
  collapseButton.style.borderRadius = '3px';
  collapseButton.innerText = object.___outlinerTreeviewCollapsed === true ? '➕' : '➖';
  collapseButton.onclick = function () {
    if (object.___outlinerTreeviewCollapsed == null) {
      object.___outlinerTreeviewCollapsed = false;
    }
    object.___outlinerTreeviewCollapsed = !object.___outlinerTreeviewCollapsed;
    collapseButton.innerText = object.___outlinerTreeviewCollapsed ? '➕' : '➖';
    onUpdate();
  };
  const name = document.createElement('p');
  name.style.marginLeft = `${marginLeft}px`;
  name.style.marginTop = '0px';
  name.style.marginBottom = '0px';
  name.style.background = 'transparent';
  const textColor = getMaterialVisibility(object) ? 'white' : 'rgba(222, 208, 105, 0.59)';
  const {
    fore,
    back
  } = selectColor(object);
  name.innerHTML = `<span style="border-radius: 6px; padding: 2px; font-family: monospace; background-color: ${back}; color: ${fore}">${getType(object)}</span> <span style="font-family: monospace; color: ${textColor}";>${getName(object)}</span>`;
  root.appendChild(name);
  return {
    root,
    collapseButton,
    name,
    object,
    textColor,
    opacity: undefined
  };
}
function updateNode(node) {
  const {
    root,
    object,
    name
  } = node;
  const opacity = object.visible ? '100%' : '50%';
  if (node.opacity == null || node.opacity !== opacity) {
    root.style.opacity = opacity;
    node.opacity = opacity;
  }
  const textColor = getMaterialVisibility(object) ? 'white' : 'rgba(222, 208, 105, 0.59)';
  const {
    fore,
    back
  } = selectColor(object);
  if (textColor !== node.textColor) {
    node.textColor = textColor;
    name.innerHTML = `<span style="border-radius: 6px; padding: 2px; font-family: monospace; background-color: ${back}; color: ${fore}">${object.type}</span> <span style="font-family: monospace; color: ${textColor}";>${object.name}</span>`;
  }
}

/**
 * Creates a treeview node for the specified object and its children.
 *
 * @param obj - the THREE object.
 * @param clickHandler - the function to call when a node is clicked.
 * @param level - the hierarchy level
 */
function createTreeViewNodeWithDescendants(obj, clickHandler, onUpdate, map, level = 0) {
  if (obj.type !== 'Scene' && obj.___outlinerTreeviewVisible === false) {
    return undefined;
  }
  const div = document.createElement('div');
  div.style.background = 'transparent';
  div.style.opacity = obj.visible ? '100%' : '50%';

  // create the DOM element for the object itself

  const node = createTreeViewNode(obj, level * 15, clickHandler, onUpdate);
  map.set(obj.id, node);
  div.appendChild(node.collapseButton);
  div.appendChild(node.root);
  if (obj.___outlinerTreeviewCollapsed === undefined) {
    obj.___outlinerTreeviewCollapsed = false;
  }
  if (obj.___outlinerTreeviewCollapsed !== true) {
    // recursively create the DOM elements for the children

    obj.children.forEach(child => {
      const childNode = createTreeViewNodeWithDescendants(child, clickHandler, onUpdate, map, level + 1);
      if (childNode) {
        div.appendChild(childNode);
      }
    });
  }
  return div;
}
function setAncestorsVisible(obj) {
  if (obj != null) {
    obj.___outlinerTreeviewVisible = true;
    setAncestorsVisible(obj.parent);
  }
}
function isHelper(obj) {
  return 'isHelper' in obj && obj.isHelper === true;
}
function matches(obj, regex) {
  if (regex == null) {
    return true;
  }
  if (regex.test(obj.name.toLowerCase())) {
    return true;
  }
  if (regex.test(obj.type.toLowerCase())) {
    return true;
  }
  return false;
}
function shouldBeDisplayedInTree(obj, filter) {
  if (isHelper(obj) && !filter.showHelpers) {
    return false;
  }
  if (!obj.visible && !filter.showHiddenObjects) {
    return false;
  }
  if (matches(obj, filter.searchRegex)) {
    return true;
  }
  return false;
}

/**
 * @param obj - the object to process
 * @param filter - the search filter
 */
function applySearchFilter(obj, filter) {
  if (shouldBeDisplayedInTree(obj, filter)) {
    setAncestorsVisible(obj);
  } else {
    obj.___outlinerTreeviewVisible = false;
  }
  if (obj.children != null) {
    obj.children.forEach(c => applySearchFilter(c, filter));
  }
}

/**
 * Provides a tree view of the three.js [scene](https://threejs.org/docs/index.html?q=scene#api/en/scenes/Scene).
 *
 */
class Outliner extends Panel {
  sceneHash = undefined;
  _nodes = new Map();

  /**
   * @param gui - The GUI.
   * @param instance - The Giro3D instance.
   */
  constructor(gui, instance) {
    super(gui, instance, 'Outliner');
    this.filters = {
      showHelpers: false,
      showHiddenObjects: true,
      searchQuery: '',
      searchRegex: undefined
    };
    this.treeviewContainer = document.createElement('div');
    this.treeview = document.createElement('div');
    this.treeview.style.background = '#424242';
    this.treeview.id = 'treeview';
    this.treeview.style.height = '350px';
    this.treeview.style.overflow = 'auto';
    // avoid wrapping ids and coordinates for deep-nested elements
    this.treeview.style.whiteSpace = 'nowrap';
    this.addController(this.filters, 'showHelpers').name('Show helpers').onChange(() => {
      this.search();
      this.instance.notifyChange();
    });
    this.addController(this.filters, 'showHiddenObjects').name('Show hidden objects').onChange(() => {
      this.search();
      this.instance.notifyChange();
    });
    this.addController(this.filters, 'searchQuery').name('Name filter').onChange(() => {
      this.search();
      this.instance.notifyChange();
    });
    this.treeviewContainer.appendChild(this.treeview);

    // A little bit of DOM hacking to insert the treeview in the GUI.
    const treeGui = this.gui.addFolder('Hierarchy');
    const children = treeGui.domElement.getElementsByClassName('children');
    children[0].appendChild(this.treeviewContainer);
    this.updateTreeView();
    this.propView = new OutlinerPropertyView(this.gui, this.instance);
  }
  updateValues() {
    this.updateTreeView();
  }
  onNodeClicked(obj) {
    this.select(obj);
    this.propView.populateProperties(obj);
    this.instance.notifyChange();
  }

  /**
   * Selects the object by displaying a bright bounding box around it.
   *
   * @param obj - The object to select.
   */
  select(obj) {
    this.clearSelection();
    if (obj === this.selectionHelper) {
      return;
    }
    this.selectionHelper = Helpers.createSelectionBox(obj, new Color('#00FF00'));
    this.selectionHelper.name = 'selection';
  }

  /**
   * Unselect the currently selected object.
   */
  clearSelection() {
    if (this.selectionHelper && this.selectionHelper.parent) {
      this.selectionHelper.parent.remove(this.selectionHelper);
    }
    delete this.selectionHelper;
  }
  search() {
    this.filters.searchQuery = this.filters.searchQuery.trim().toLowerCase();
    this.filters.searchRegex = this.filters.searchQuery.length > 0 ? new RegExp(this.filters.searchQuery) : undefined;
    this.sceneHash = undefined;
    this.updateTreeView();
  }
  updateObject(o) {
    o.updateMatrixWorld(true);
    this.instance.notifyChange();
  }
  updateExistingNodes() {
    this._nodes.forEach(n => updateNode(n));
  }
  updateTreeView() {
    if (this.isClosed()) {
      // we don't want to refresh the treeview if the GUI is collapsed.
      return;
    }
    const hash = getHash(this.instance.scene);
    if (hash === this.sceneHash) {
      this.updateExistingNodes();
    } else {
      this.sceneHash = hash;
      if (this.rootNode) {
        this.treeview.removeChild(this.rootNode);
      }
      applySearchFilter(this.instance.scene, this.filters);
      this._nodes.clear();
      this.rootNode = createTreeViewNodeWithDescendants(this.instance.scene, obj => this.onNodeClicked(obj), () => queueMicrotask(() => {
        this.sceneHash = undefined;
        this.updateTreeView();
      }), this._nodes);
      if (this.rootNode) {
        this.treeview.appendChild(this.rootNode);
      }
    }
  }
}
export default Outliner;