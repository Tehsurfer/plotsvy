var dat = require("./dat.gui.js");
require("./styles/dat-gui-swec.css");
require("./styles/my_styles.css");
var THREE = require("three");
var ITEM_LOADED = require("./utility").ITEM_LOADED;

/**
 * Provides rendering of the 3D-scaffold data in the dom of the provided id with models
 * defined in the modelsLoader.
 * @class
 * @param {PJP.ModelsLoader} ModelsLoaderIn - defined in modelsLoade.js, providing locations of files.
 * @param {String} PanelName - Id of the target element to create the  {@link PJP.BodyViewer} on.
 * 
 * @author Alan Wu
 * @returns {PJP.BodyViewer}
 */
exports.BodyViewer = function(ModelsLoaderIn, DialogName)  {

	var currentScene = undefined;
	var currentSpecies = 'human';
	var bodyScenes = new Array();
	var toolTip = undefined;
	bodyScenes['human'] = undefined;
	bodyScenes['pig'] = undefined;
	bodyScenes['mouse'] = undefined;
	bodyScenes['rat'] = undefined;
	var modelsTransformationMap = new Array();
	var bodyGui;
	var bodyPartsGui;
	var currentHoveredMaterial = undefined;
	var currentSelectedMaterial = undefined;
	// Flag for removing geometry from ZincScene when not visible, thus freeing the memory. Default is false.
	var removeWhenNotVisible = false;
	var UIIsReady = false;
	var organsViewer = undefined;
	var modelsLoader = ModelsLoaderIn;
	var dialogObject = undefined;
	var localDialogName = DialogName;
	
	//Represents each physiological organ systems as folder in the dat.gui.
	var systemGuiFolder = new Array();
	systemGuiFolder["Musculo-skeletal"] = undefined;
	systemGuiFolder["Cardiovascular"] = undefined;
	systemGuiFolder["Respiratory"] = undefined;
	systemGuiFolder["Digestive"] = undefined;
	systemGuiFolder["Skin (integument)"] = undefined;
	systemGuiFolder["Urinary"] = undefined;
	systemGuiFolder["Brain & Central Nervous"] = undefined;
	systemGuiFolder["Immunological"] = undefined;
	systemGuiFolder["Endocrine"] = undefined;
	systemGuiFolder["Female Reproductive"] = undefined;
	systemGuiFolder["Male Reproductive"] = undefined;
	systemGuiFolder["Special sense organs"] = undefined;
	
	//Stores physiological organ systems specific gui settings in dat.gui. 
	var systemPartsGuiControls = new Array();
	systemPartsGuiControls["Musculo-skeletal"] = function() {};
	systemPartsGuiControls["Cardiovascular"] = function() {};
	systemPartsGuiControls["Respiratory"] = function() {};
	systemPartsGuiControls["Digestive"] = function() {};
	systemPartsGuiControls["Skin (integument)"] = function() {};
	systemPartsGuiControls["Urinary"] = function() {};
	systemPartsGuiControls["Brain & Central Nervous"] = function() {};
	systemPartsGuiControls["Immunological"] = function() {};
	systemPartsGuiControls["Endocrine"] = function() {};
	systemPartsGuiControls["Female Reproductive"] = function() {};
	systemPartsGuiControls["Male Reproductive"] = function() {};
	systemPartsGuiControls["Special sense organs"] = function() {};
	
	//Array of settings of the body viewer gui controls.
	var bodyControl = function() {
		  this.Background = [ 255, 255, 255 ]; // RGB array
	};
	
	var _this = this;
	
	//ZincRenderer for this viewer.
	var bodyRenderer = null;
	
	//Following matrices offset data that are offset from their proposed location
	var transformationMatrix = new THREE.Matrix4();
	transformationMatrix.set(0.493844, -0.823957, 0.277871, 30,
										  0.0782172, 0.6760355, 0.92953, -130,
										  -0.866025, -0.437309, 0.242407, 1227,
										  0, 0, 0, 1);
	modelsTransformationMap["heart"] = {
			transformation: transformationMatrix,
			folder: "cardiovascular",
			system: "Cardiovascular"};
	
	transformationMatrix = new THREE.Matrix4();
	transformationMatrix.set(120, 0, 0, 0,
										0, 120, 0, -110,
										0, 0, 120, 1230,
										0, 0, 0, 1);
	modelsTransformationMap["lungs"] = {
			transformation: transformationMatrix,
			folder: "respiratory",
			system: "Respiratory"};
	
	/**
	 * Set the organs viewer this {@link PJP.BodyViewer} fires event to.
	 * 
	 * @param {PJP.OrgansViewer} OrgansViewerIn - target Organs Viewer to fire the event to.
	 */
	this.setOrgansViewer = function(OrgansViewerIn) {
		organsViewer = OrgansViewerIn;
	}

	/**
	 * This callback is triggered when a body part is clicked.
	 * @callback
	 */
	var _pickingBodyCallback = function() {
		return function(intersects, window_x, window_y) {
			var bodyClicked = false;
			for (var i = 0; i < intersects.length; i++) {
				if (intersects[i] !== undefined && (intersects[ i ].object.name !== undefined)) {
					if (!intersects[ i ].object.name.includes("Body")) {
						if (organsViewer)
							organsViewer.loadOrgans(currentSpecies, intersects[ i ].object.userData[0], intersects[ i ].object.name);
						if (currentSelectedMaterial && currentSelectedMaterial != intersects[ i ].object.material) {
							if (currentSelectedMaterial == currentHoveredMaterial)
								currentSelectedMaterial.emissive.setHex(0x0000FF);
							else
								currentSelectedMaterial.emissive.setHex(0x000000);
						}
						currentSelectedMaterial = intersects[ i ].object.material;
						currentSelectedMaterial.emissive.setHex(0x00FF00);
						return;
					} else {
						bodyClicked = true;
					}
				}
			}
			if (bodyClicked && organsViewer) {
				organsViewer.loadOrgans(currentSpecies, "Skin (integument)", "Body");
			}
		}	
	};
	
	/**
	 * This callback is triggered when a body part is hovered over by the mosue.
	 * @callback
	 */
	var _hoverBodyCallback = function() {
		return function(intersects, window_x, window_y) {
			var bodyHovered = false;
			for (var i = 0; i < intersects.length; i++) {
				if (intersects[i] !== undefined && (intersects[ i ].object.name !== undefined)) {
					if (!intersects[ i ].object.name.includes("Body")) {
						dialogObject.find("#bodyDisplayArea")[0].style.cursor = "pointer";
				    toolTip.setText(intersects[ i ].object.name);
				    toolTip.show(window_x, window_y);
						if (currentHoveredMaterial &&
						  intersects[ i ].object.material != currentHoveredMaterial && currentHoveredMaterial != currentSelectedMaterial) {
							currentHoveredMaterial.emissive.setHex(0x000000);
							currentHoveredMaterial.depthFunc = THREE.LessEqualDepth;
						}
						if (intersects[ i ].object.material != currentSelectedMaterial) {
							currentHoveredMaterial = intersects[ i ].object.material;
							currentHoveredMaterial.emissive.setHex(0x0000FF);
						} else {
							currentHoveredMaterial = undefined;
						}
						return;
					} else {
						bodyHovered = true;
					}
				}
			}
			if (currentHoveredMaterial && currentHoveredMaterial != currentSelectedMaterial) {
				currentHoveredMaterial.emissive.setHex(0x000000);
			}
			currentHoveredMaterial = undefined;
			if (bodyHovered) {
				dialogObject.find("#bodyDisplayArea")[0].style.cursor = "pointer";
        toolTip.setText("Body");
        toolTip.show(window_x, window_y);
			} else {
			  toolTip.hide();
				dialogObject.find("#bodyDisplayArea")[0].style.cursor = "auto";
			}
			
		}
	};
	
	var removeGeometry = function(systemName, name) {
		if (removeWhenNotVisible) {
			var systemMeta = modelsLoader.getSystemMeta(currentSpecies);
			if (systemMeta[systemName].hasOwnProperty(name) && systemMeta[systemName][name].geometry) {
				currentScene.removeZincGeometry(systemMeta[systemName][name].geometry);
				systemMeta[systemName][name]["loaded"] = ITEM_LOADED.FALSE;
				systemMeta[systemName][name].geometry = undefined;
			}
			
		}
	}
	
	
	/**
	 * This is called when a body part visibility control is switch on/off.
	 * @callback
	 */
	var changeBodyPartsVisibility = function(name, systemName) {
		return function(value) { 
			var systemMeta = modelsLoader.getSystemMeta(currentSpecies);
			if (systemMeta[systemName].hasOwnProperty(name) && systemMeta[systemName][name].geometry) {
				systemMeta[systemName][name].geometry.setVisibility(value);
			}
			var isPartial = false;
			if (value == false) {
				removeGeometry(systemName, name);
				systemPartsGuiControls[systemName].All = false;
				for (var partName in systemPartsGuiControls[systemName]) {
					if (partName != "All" && systemPartsGuiControls[systemName].hasOwnProperty(partName)) {
						if (systemPartsGuiControls[systemName][partName] == true) {
							isPartial = true;
							break;
						}
					}
				}
				updateSystemButtons(systemName, false, isPartial);
			} else {
				readModel(systemName, name, false);
				for (var partName in systemPartsGuiControls[systemName]) {
					if (partName != "All" && systemPartsGuiControls[systemName].hasOwnProperty(partName)) {
						if (systemPartsGuiControls[systemName][partName] == false) {
							updateSystemButtons(systemName, false, true);
							return;
						}
					}
				}
				systemPartsGuiControls[systemName].All = true;
			}
			updateSystemButtons(systemName, systemPartsGuiControls[systemName].All, isPartial);
			for (var i = 0; i < systemGuiFolder[systemName].__controllers.length; i++) {
				if (systemGuiFolder[systemName].__controllers[i].property == "All") {
					systemGuiFolder[systemName].__controllers[i].updateDisplay();
					systemGuiFolder[systemName].__controllers[i].__prev = 
						systemGuiFolder[systemName].__controllers[i].__checkbox.checked;
					return;
				}
			}
		}
	}
	
	var updateSystemButtons = function(systemName, value, isPartial) {
		var element = document.getElementById(systemName);
		if (value == true)
			element.className = "w3-circle systemToggleButton systemToggleButtonOn";
		else {
			if (isPartial)
				element.className = "w3-circle systemToggleButton systemToggleButtonPartial";
			else
				element.className = "w3-circle systemToggleButton systemToggleButtonOff";
		}
	}
	
	var toggleSystem = function(systemName, value) {
		systemPartsGuiControls[systemName]["All"] = value;
		for (var partName in systemPartsGuiControls[systemName]) {
			if (partName != "All" && systemPartsGuiControls[systemName].hasOwnProperty(partName)) {
				if (systemPartsGuiControls[systemName][partName] != value) {
					var systemMeta = modelsLoader.getSystemMeta(currentSpecies);
					if (systemMeta[systemName].hasOwnProperty(partName)) {
						systemPartsGuiControls[systemName][partName] = value;
						if (systemMeta[systemName][partName].geometry) {
							systemMeta[systemName][partName].geometry.setVisibility(value);
							removeGeometry(systemName, partName);
						}
						if (value == true) {
							readModel(systemName, partName, false);
						}
					}
				}
			}
		}
		for (var i = 0; i < systemGuiFolder[systemName].__controllers.length; i++) {
			systemGuiFolder[systemName].__controllers[i].updateDisplay();
			readModel(systemName, partName, true);
			systemGuiFolder[systemName].__controllers[i].__prev = 
				systemGuiFolder[systemName].__controllers[i].__checkbox.checked;
		}
		updateSystemButtons(systemName, value, false);
	}
	
	var toggleSystemCallback = function(systemName) {
		return function(value) { 
			toggleSystem(systemName, value);
		}
	}
	
	var _addSystemPartGuiControl = function(systemName, partName, item, geometry, visible) {
		if (systemName) {
			if (systemGuiFolder[systemName] !== undefined &&
				systemPartsGuiControls.hasOwnProperty(systemName)) {
				if (!systemGuiFolder[systemName].hasOwnProperty(partName)) {
					systemPartsGuiControls[systemName][partName] = visible;
					systemGuiFolder[systemName].add(systemPartsGuiControls[systemName], partName).onChange(changeBodyPartsVisibility(partName, systemName));
					if (visible == true) {
						for (var partName in systemPartsGuiControls[systemName]) {
							if (partName != "All" && systemPartsGuiControls[systemName].hasOwnProperty(partName)) {
								if (systemPartsGuiControls[systemName][partName] == false) {
									updateSystemButtons(systemName, false, true);
									return;
								}
							}
						}
						systemPartsGuiControls[systemName].All = true;
						updateSystemButtons(systemName, true, false);
						for (var i = 0; i < systemGuiFolder[systemName].__controllers.length; i++) {
							if (systemGuiFolder[systemName].__controllers[i].property == "All") {
								systemGuiFolder[systemName].__controllers[i].updateDisplay();
								systemGuiFolder[systemName].__controllers[i].__prev = 
									systemGuiFolder[systemName].__controllers[i].__checkbox.checked;
								return;
							}
						}
					}
				}
			}
		}
	}
	
	var systemButtonPress = function(receivedElement) {
		var systemName = receivedElement.id;
		toggleSystem(systemName, !(systemPartsGuiControls[systemName]["All"]));
	}
	
	var _transformBodyPart = function(key, geometry) {
		if (modelsTransformationMap.hasOwnProperty(key) &&
				modelsTransformationMap[key].transformation !== undefined)
			geometry.morph.applyMatrix (modelsTransformationMap[key].transformation);
	};
	
	var _addBodyPartCallback = function(systemName, partName, item, scaling, useDefautColour, startup) {
		return function(geometry) {
			//_transformBodyPart(key, geometry);
			item["loaded"] = ITEM_LOADED.TRUE;
			item.geometry = geometry;
			if (startup)
				_addSystemPartGuiControl(systemName, partName, item, geometry, (item["loaded"] == ITEM_LOADED.TRUE));
			if (scaling == true) {
				geometry.morph.scale.x = 1.00;
				geometry.morph.scale.y = 1.00;
				geometry.morph.scale.z = 1.03;
				//geometry.morph.position.y = 20;
				geometry.morph.position.z = -47;
			}
			if (useDefautColour)
				modelsLoader.setGeometryColour(geometry, systemName, partName);
			if (partName == "Body") {
				geometry.setAlpha(0.5);
				geometry.morph.material.side = THREE.FrontSide;
			}
			geometry.morph.userData = [systemName, partName];
		}
	};
	
	/** This method add all system folders to the dat.gui user interface.
	 * 
	 */
	var addSystemFolders = function() {
		for (var key in systemGuiFolder) {
			if (systemGuiFolder.hasOwnProperty(key) && systemPartsGuiControls.hasOwnProperty(key)) {
				systemGuiFolder[key] = bodyGui.addFolder(key);
				systemGuiFolder[key].close();
				systemPartsGuiControls[key]["All"] = false;
				systemGuiFolder[key].add(systemPartsGuiControls[key], "All").onChange(toggleSystemCallback(key));
			}
		}
	}
	
	var bodyBackGroundChanged = function() {
		return function(value) {
			var redValue = parseInt(value[0]);
			var greenValue = parseInt(value[1]);
			var blueValue = parseInt(value[2]);
			
			var backgroundColourString = 'rgb(' + redValue + ',' + greenValue + ',' + blueValue + ')';
			var colour = new THREE.Color(backgroundColourString);
			var internalRenderer = bodyRenderer.getThreeJSRenderer();
			internalRenderer.setClearColor( colour, 1 );
		}
	}
	
	/** Initialise everything in the bodyRender, including the 3D renderer,
	 *  dat.gui UI and picker for the 3D renderer.
	 * 
	 */
	var initialiseBodyRenderer = function() {
	  toolTip = new (require("./tooltip").ToolTip)(dialogObject[0]);
		bodyRenderer = require("./utility").setupRenderer("bodyDisplayArea");
		bodyGui = new dat.GUI({autoPlace: false});
		bodyGui.domElement.id = 'gui';
		var control = new bodyControl();
		var controller = bodyGui.addColor(control, 'Background');
		controller.onChange(bodyBackGroundChanged());
		bodyGui.close();
		addSystemFolders();
		var customContainer = dialogObject.find("#bodyGui")[0].append(bodyGui.domElement);
		var resetViewButton = { 'Reset View':function(){ bodyRenderer.resetView() }};
		var scene = bodyRenderer.createScene("human");
		bodyRenderer.setCurrentScene(scene);
		scene.loadViewURL(modelsLoader.getBodyDirectoryPrefix() + "/body_view.json");
		currentScene = scene;
		var directionalLight = scene.directionalLight;
		directionalLight.intensity = 1.4;
		var zincCameraControl = scene.getZincCameraControls();
		zincCameraControl.enableRaycaster(scene, _pickingBodyCallback(), _hoverBodyCallback());
		zincCameraControl.setMouseButtonAction("AUXILIARY", "ZOOM");
		zincCameraControl.setMouseButtonAction("SECONDARY", "PAN");
	
		bodyGui.add(resetViewButton, 'Reset View');
		bodyRenderer.animate();
	}
	
	var systemButtonPressCallback = function(element) {
		return function() {
			systemButtonPress(element);
		}
	}
	
	var changeSpecies = function(element) {
		currentSpecies = element.value;
		var scene = bodyRenderer.getSceneByName(element.value);
		if (scene == undefined) {
			scene = bodyRenderer.createScene(element.value);
		}
		currentScene = scene;
		bodyRenderer.setCurrentScene(scene);
	}
	
	var addUICallback = function() {
		var callbackContainer = dialogObject.find("#systemToggle")[0];
		var inputs, index;
		inputs = callbackContainer.getElementsByTagName('input');
		for (var i = 0; i < inputs.length; ++i) {
			inputs[i].onclick = systemButtonPressCallback(inputs[i]); 
		}
		var speciesSelected = dialogObject.find("#bodySpeciesSelect")[0];
		speciesSelected.onchange = function() { changeSpecies(speciesSelected) };
	}
	
	 var createNewDialog = function(data) {
	   dialogObject = require("./utility").createDialogContainer(localDialogName, data);
	   addUICallback();
	   initialiseBodyRenderer();
	   UIIsReady = true;
	 }
	/**
	 * Initialise the {@link PJP.BodyViewer}, it will load snippets/bodyViewer.html 
	 * which contains the general layout of this viewer, this is called when 
	 * the {@link PJP.BodyViewer} is created.
	 */
	var initialise = function() {
    createNewDialog(require("./snippets/bodyViewer.html"));
	}
	
	var readModel = function(systemName, partName, startup) {
		var systemMeta = modelsLoader.getSystemMeta(currentSpecies);
		item = systemMeta[systemName][partName];
		if (item["loaded"] ==  ITEM_LOADED.FALSE) {
			var downloadPath = item["BodyURL"];
			var scaling = false;
			item["loaded"] =  ITEM_LOADED.DOWNLOADING;
			if (item["FileFormat"] == "JSON") {
				if (systemName == "Musculo-skeletal" || systemName == "Skin (integument)")
					scaling = true;
				currentScene.loadMetadataURL(downloadPath, _addBodyPartCallback(systemName, partName, item, scaling, false, startup));
			}
			else if (item["FileFormat"] == "STL")
				currentScene.loadSTL(downloadPath, partName, _addBodyPartCallback(systemName, partName, item, scaling, true, startup));
			else if (item["FileFormat"] == "OBJ") 
				currentScene.loadOBJ(downloadPath, partName, _addBodyPartCallback(systemName, partName, item, scaling, true, startup));
		}
	}
	
	var readBodyRenderModel = function(systemName, partMap) {
		for (var partName in partMap) {
			if (partMap.hasOwnProperty(partName)) {
				var item = partMap[partName]; toggleSystem
				item["loaded"] = ITEM_LOADED.FALSE;
				if (item["loadAtStartup"] == true) {
					readModel(systemName, partName, true);
				} else {
					_addSystemPartGuiControl(systemName, partName, item, undefined, false);
				}
			}
		}
	}
	
	/**
	 * Signal the {@link PJP.BodyViewer} to start reading the meta file once the UI is ready.
	 * @async
	 */
	this.readSystemMeta = function() {
		if (UIIsReady) {
			var systemMeta = modelsLoader.getSystemMeta(currentSpecies);
			for (var systemItem  in systemMeta) {
				readBodyRenderModel(systemItem, systemMeta[systemItem]);	
			}
		} else {
			setTimeout(function(){ _this.readSystemMeta(); }, 500);
		}
	}
	
	initialise();
}

