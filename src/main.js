import { Color, BoxGeometry, MeshBasicMaterial, DirectionalLight, Fog, HemisphereLight, MathUtils, Mesh, MeshPhongMaterial, PlaneGeometry, Vector3, GridHelper } from 'three';
// noinspection JSFileReferences
import { MapControls } from 'three/examples/jsm/controls/MapControls';
// import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import Instance from '../giro3d/src/core/Instance';
import ColorMap from '../giro3d/src/core/ColorMap';
import PointCloud from '../giro3d/src/entities/PointCloud';
import Inspector from '../giro3d/src/gui/Inspector';
import PotreeSource from "../giro3d/src/sources/PotreeSource";
import {setLazPerfPath} from '../giro3d/src/sources/las/config';
import colormap from 'colormap';
function bindColorPicker(id, onChange) {
    const element = document.getElementById(id);
    if (!(element instanceof HTMLInputElement)) {
        throw new Error(
            "invalid binding element: expected HTMLInputElement, got: " +
            element.constructor.name,
        );
    }

    element.oninput = function oninput() {
        // Let's change the classification color with the color picker value
        const hexColor = element.value;
        onChange(new Color(hexColor));
    };

    const externalFunction = (v) => {
        element.value = `#${new Color(v).getHexString()}`;
        onChange(element.value);
    };

    return [externalFunction, new Color(element.value), element];
}

function bindDropDown(id, onChange) {
    const element = document.getElementById(id);
    if (!(element instanceof HTMLSelectElement)) {
        throw new Error(
            "invalid binding element: expected HTMLSelectElement, got: " +
            element.constructor.name,
        );
    }

    element.onchange = () => {
        onChange(element.value);
    };

    const callback = (v) => {
        element.value = v;
        onChange(element.value);
    };

    const setOptions = (options) => {
        const items = options.map(
            (opt) =>
                `<option value=${opt.id} ${opt.selected ? "selected" : ""}>${opt.name}</option>`,
        );
        element.innerHTML = items.join("\n");
    };

    return [callback, element.value, element, setOptions];
}

function bindProgress(id) {
    const element = document.getElementById(id);
    if (!(element instanceof HTMLDivElement)) {
        throw new Error(
            "invalid binding element: expected HTMLDivElement, got: " +
            element.constructor.name,
        );
    }

    const setProgress = (normalized, text) => {
        element.style.width = `${Math.round(normalized * 100)}%`;
        if (text) {
            element.innerText = text;
        }
    };

    return [setProgress, element.parentElement];
}

function bindSlider(id, onChange) {
    const element = document.getElementById(id);
    if (!(element instanceof HTMLInputElement)) {
        throw new Error(
            "invalid binding element: expected HTMLInputElement, got: " +
            element.constructor.name,
        );
    }

    element.oninput = function oninput() {
        onChange(element.valueAsNumber);
    };

    const setValue = (v, min, max, step) => {
        if (min != null && max != null) {
            element.min = min.toString();
            element.max = max.toString();

            if (step != null) {
                element.step = step;
            }
        }
        element.valueAsNumber = v;
        onChange(element.valueAsNumber);
    };

    const initialValue = element.valueAsNumber;

    return [setValue, initialValue, element];
}

function bindToggle(id, onChange) {
    const element = document.getElementById(id);
    if (!(element instanceof HTMLInputElement)) {
        throw new Error(
            "invalid binding element: expected HTMLButtonElement, got: " +
            element.constructor.name,
        );
    }

    element.oninput = function oninput() {
        onChange(element.checked);
    };

    const callback = (v) => {
        element.checked = v;
        onChange(element.checked);
    };

    return [callback, element.checked, element];
}

function formatPointCount(count, numberFormat = undefined) {
    let displayedPointCount = count;
    let suffix = "";

    if (count > 1_000_000) {
        displayedPointCount /= 1_000_000;
        suffix = "M";
    } else if (count > 1_000_000_000) {
        displayedPointCount /= 1_000_000_000;
        suffix = "B";
    }

    if (numberFormat == null) {
        numberFormat = new Intl.NumberFormat(undefined, {
            maximumFractionDigits: 2,
        });
    }

    return numberFormat.format(displayedPointCount) + suffix;
}

function makeColorRamp(
    preset,
    discrete = false,
    invert = false,
    mirror = false,
) {
    let nshades = discrete ? 10 : 256;

    const values = colormap({ colormap: preset, nshades });

    const colors = values.map((v) => new Color(v));

    if (invert) {
        colors.reverse();
    }

    if (mirror) {
        return [...colors, ...colors.reverse()];
    }

    return colors;
}

function placeCameraOnTop(volume, instance) {
    if (!instance) {
        return;
    }

    const center = volume.getCenter(new Vector3());
    const size = volume.getSize(new Vector3());

    const camera = instance.view.camera;
    const top = volume.max.z;
    const fov = camera.fov;
    const aspect = camera.aspect;

    const hFov = MathUtils.degToRad(fov) / 2;
    const altitude = (Math.max(size.x / aspect, size.y) / Math.tan(hFov)) * 0.5;

    instance.view.camera.position.set(center.x, center.y - 1, altitude + top);
    instance.view.camera.lookAt(center);

    const controls = new MapControls(instance.view.camera, instance.domElement);
    controls.target.copy(center);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;

    instance.view.setControls(controls);
    instance.notifyChange(instance.view.camera);
}

// Some Potree datasets contain LAZ files.
// LAS processing requires the WebAssembly laz-perf library
// This path is specific to your project, and must be set accordingly.
setLazPerfPath("/assets/wasm");

// We use this CRS when the point cloud does not have a CRS defined.
// It is technically the WebMercator CRS, but we label it 'unknown' to make
// it very explicit that it is not correct.
// See https://gitlab.com/giro3d/giro3d/-/issues/514
Instance.registerCRS(
    "unknown",
    "+proj=merc +a=6378137 +b=6378137 +lat_ts=0 +lon_0=0 +x_0=0 +y_0=0 +k=1 +units=m +nadgrids=@null +wktext +no_defs +type=crs",
);

const options = {
    attribute: "position",
    colorRamp: "greys",
    min: 0,
    max: 100,
};

let entity;

let instance;


function updateActiveAttribute() {
    const attribute = options.attribute;

    entity.setActiveAttribute(attribute);

    const classificationGroup = document.getElementById("classification-group");
    const colorMapGroup = document.getElementById("ramp-group");

    const shouldDisplayClassifications =
        attribute.toLowerCase() === "classification";
    classificationGroup.style.display = shouldDisplayClassifications
        ? "block"
        : "none";
    colorMapGroup.style.display =
        !shouldDisplayClassifications &&
        attribute !== "Color" &&
        attribute !== "COLOR_PACKED"
            ? "flex"
            : "none";

    updateColorMap();
}


const [setProgress, progressElement] = bindProgress("progress");

const [, , , setAvailableAttributes] = bindDropDown(
    "attribute",
    (attribute) => {
        options.attribute = attribute;

        if (entity) {
            updateActiveAttribute();
        }
    },
);

const [setMin] = bindSlider("min", (min) => {
    options.min = Math.round(min);
    if (entity && instance) {
        entity.colorMap.min = min;
        instance.notifyChange(entity);
        document.getElementById("label-bounds").innerHTML =
            `Bounds: <b>${options.min}</b> — <b>${options.max}<b>`;
    }
});

const [setMax] = bindSlider("max", (max) => {
    options.max = Math.round(max);
    if (entity && instance) {
        entity.colorMap.max = max;
        instance.notifyChange(entity);
        document.getElementById("label-bounds").innerHTML =
            `Bounds: <b>${options.min}</b> — <b>${options.max}<b>`;
    }
});

function updateColorMapMinMax() {
    if (!entity) {
        return;
    }

    const min = entity.activeAttribute.min ?? 0;
    const max = entity.activeAttribute.max ?? 255;

    const lowerBound = min;
    const upperBound = max;

    setMin(min, lowerBound, upperBound);
    setMax(max, lowerBound, upperBound);
}
function updateColorMap() {
    if (entity && instance) {
        entity.colorMap.colors = makeColorRamp(options.colorRamp);

        updateColorMapMinMax();

        instance.notifyChange();
    }
}

bindToggle("show-tile-volumes", (v) => {
    entity.showNodeVolumes = v;
});

bindToggle("show-volume", (v) => {
    entity.showVolume = v;
});

bindToggle("edl", (v) => {
    instance.renderingOptions.enableEDL = v;
    instance.notifyChange();
});

bindToggle("inpainting", (v) => {
    instance.renderingOptions.enableInpainting = v;
    instance.renderingOptions.enablePointCloudOcclusion = v;
    instance.notifyChange();
});

bindSlider("point-size", (size) => {
    if (entity) {
        entity.pointSize = size;
        document.getElementById("point-size-label").innerHTML =
            `Point size: <b>${size === 0 ? "auto" : size.toFixed(0)}</b>`;
    }
});
bindSlider("subdivision-threshold", (threshold) => {
    if (entity) {
        entity.subdivisionThreshold = threshold;
        document.getElementById("subdivision-threshold-label").innerHTML =
            `Subdivision threshold: <b>${threshold}</b>`;
    }
});

function populateGUI() {
    document.getElementById("accordion").style.display = "block";

    const tableElement = document.getElementById("table");
    tableElement.style.display = "block";

    progressElement.style.display = "none";
}

const numberFormat = new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 2,
});

function updateDisplayedPointCounts(count, displayed) {
    const pointCountElement = document.getElementById("point-count");
    pointCountElement.innerHTML =
        count != null ? formatPointCount(count, numberFormat) : "unknown";
    pointCountElement.title =
        count != null ? numberFormat.format(count) : "unknown";

    const activePointCountElement = document.getElementById(
        "displayed-point-count",
    );
    activePointCountElement.innerHTML = formatPointCount(displayed, numberFormat);
    activePointCountElement.title = numberFormat.format(displayed);
}

async function load(url) {
    progressElement.style.display = "block";

    const source = new PotreeSource({ url });

    source.addEventListener("progress", () => setProgress(source.progress));

    await source.initialize();

    const metadata = await source.getMetadata();

    let crs = "unknown";
    if (metadata.crs != null) {
        crs = metadata.crs.name;
        Instance.registerCRS(metadata.crs.name, metadata.crs.definition);
    }

    instance = new Instance({
        target: "view",
        crs: crs,
        backgroundColor: null,
        renderer: {
            logarithmicDepthBuffer: true,
        },
    });

    // Let's enable Eye Dome Lighting to make the point cloud more readable.
    instance.renderingOptions.enableEDL = true;
    instance.renderingOptions.EDLRadius = 0.6;
    instance.renderingOptions.EDLStrength = 5;
    ///
    instance.renderingOptions.enableMSAA = false;
    instance.renderingOptions.enablePointCloudOcclusion = false;
    entity = new PointCloud({ source });

// we can access the THREE.js scene directly
    instance.scene.background = new Color(0xa0a0a0);
    instance.scene.fog = new Fog(0xa0a0a0, 15, 80);

// adding lights directly to scene is ok
    const hemiLight = new HemisphereLight(0xffffff, 0x444444, 2);
    hemiLight.position.set(0, 0, 20);
    hemiLight.updateMatrixWorld();
    instance.scene.add(hemiLight);
    const dirLight = new DirectionalLight(0xffffff, 3);
    dirLight.position.set(-3, 10, 10);
    dirLight.castShadow = true;
    dirLight.shadow.camera.top = 4;
    dirLight.shadow.camera.bottom = -4;
    dirLight.shadow.camera.left = -4;
    dirLight.shadow.camera.right = 4;
    dirLight.shadow.camera.near = 0.1;
    dirLight.shadow.camera.far = 40;
    instance.scene.add(dirLight);
    instance.scene.add(dirLight.target);
    dirLight.updateMatrixWorld();
    //////////////////////////
    const grid = new GridHelper(60, 10);
    grid.rotateX(MathUtils.degToRad(90));
    // grid.position.set(center.x, center.y, 0);
    grid.updateMatrixWorld(true);

    const geometry = new BoxGeometry(5, 5, 5);
    const material = new MeshPhongMaterial({color: 0x00ff00});
    const cube = new Mesh(geometry, material);
    cube.name = 'myCube';

    cube.receiveShadow = true;
    cube.castShadow = true;


    const mesh = new Mesh(
        new PlaneGeometry(20, 20),
        new MeshPhongMaterial({ color: 0xcccccc, depthWrite: true }),
    );
    mesh.position.set(0.0, 0.001, 0.0);
    mesh.receiveShadow = true;

    try {
        await instance.add(entity);
        await instance.add(grid);
        await instance.add(mesh);
        await instance.add(cube);
    } catch (err) {
        if (err instanceof Error) {
            const messageElement = document.getElementById("message");
            messageElement.innerText = err.message;
            messageElement.style.display = "block";
        }
        console.error(err);
        return;
    } finally {
        progressElement.style.display = "none";
    }

    // Create the color map. The color ramp and bounds will be set later.
    entity.colorMap = new ColorMap({ colors: [], min: 0, max: 1 });



    instance.addEventListener("update-end", () => {
        updateDisplayedPointCounts(entity.pointCount, entity.displayedPointCount);

        // console.log("render");
});

    placeCameraOnTop(entity.getBoundingBox(), instance);

    setAvailableAttributes(
        metadata.attributes.map((att, index) => ({
            id: att.name,
            name: att.name,
            selected: index === 0,
        })),
    );

    if (metadata.attributes.length > 0) {
        options.attribute = metadata.attributes[0].name;
        entity.setActiveAttribute(metadata.attributes[0].name);
    }

    // Let's populate the classification list with default values from the ASPRS classifications.
    addClassification(0, "Created, never classified", entity.classifications);
    addClassification(1, "Unclassified", entity.classifications);
    addClassification(2, "Ground", entity.classifications);
    addClassification(3, "Low vegetation", entity.classifications);
    addClassification(4, "Medium vegetation", entity.classifications);
    addClassification(5, "High vegetation", entity.classifications);
    addClassification(6, "Building", entity.classifications);
    addClassification(7, "Low point (noise)", entity.classifications);
    addClassification(8, "Reserved", entity.classifications);
    addClassification(9, "Water", entity.classifications);
    addClassification(10, "Rail", entity.classifications);
    addClassification(11, "Road surface", entity.classifications);
    addClassification(12, "Reserved", entity.classifications);
    addClassification(13, "Wire - Guard (shield)", entity.classifications);
    addClassification(14, "Wire - Conductor (Phase)", entity.classifications);
    addClassification(15, "Transmission Tower", entity.classifications);
    addClassification(
        16,
        "Wire Structure connector (e.g Insulator)",
        entity.classifications,
    );
    addClassification(17, "Bridge deck", entity.classifications);
    addClassification(18, "High noise", entity.classifications);

    bindToggle("show-dataset", (show) => {
        entity.visible = show;
        instance.notifyChange(entity);
    });

    populateGUI();

    updateActiveAttribute();

    Inspector.attach("inspector", instance);
}

const defaultUrl =
    "https://lemonroom.ru/pointclouds/lion_takanawa/cloud.js";

// Extract dataset URL from URL
const url = new URL(document.URL);
let datasetUrl = url.searchParams.get("dataset");
if (!datasetUrl) {
    datasetUrl = defaultUrl;
    url.searchParams.append("dataset", datasetUrl);
    window.history.replaceState({}, null, url.toString());
}

// GUI controls for classification handling

const classificationNames = new Array(32);

function addClassification(number, name, array) {
    const currentColor = array[number].color.getHexString();

    const template = `
    <div class="form-check">
        <input
            class="form-check-input"
            type="checkbox"
            checked
            role="switch"
            id="class-${number}"
            autocomplete="off"
        />
        <label class="form-check-label w-100" for="class-${number}">
            <div class="row">
                <div class="col" style="font-size: 13px">${name}</div>
                <div class="col-auto">
                    <input
                        type="color"
                        style="height: 1rem; padding: 1px;"
                        class="form-control form-control-color float-end"
                        id="color-${number}"
                        value="#${currentColor}"
                        title="Classification color"
                    />
                </div>
            </div>
        </label>
    </div>
    `;

    const node = document.createElement("div");
    node.innerHTML = template;
    document.getElementById("classifications").appendChild(node);

    // Let's change the classification color with the color picker value
    bindColorPicker(`color-${number}`, (v) => {
        // Parse it into a THREE.js color
        array[number].color = new Color(v);

        instance.notifyChange();
    });

    classificationNames[number] = name;

    bindToggle(`class-${number}`, (enabled) => {
        // By toggling the .visible property of a classification,
        // all points that have this classification are hidden/shown.
        array[number].visible = enabled;
        instance.notifyChange();
    });
}

load(datasetUrl).catch(console.error);



