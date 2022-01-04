/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	// The require scope
/******/ 	var __webpack_require__ = {};
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
__webpack_require__.r(__webpack_exports__);
Object(function webpackMissingModule() { var e = new Error("Cannot find module './js/three.module.js'"); e.code = 'MODULE_NOT_FOUND'; throw e; }());


let camera, scene, renderer;
let geometry, material, mesh;

init();

function init() {

	camera = new Object(function webpackMissingModule() { var e = new Error("Cannot find module './js/three.module.js'"); e.code = 'MODULE_NOT_FOUND'; throw e; }())( 70, window.innerWidth / window.innerHeight, 0.01, 10 );
	camera.position.z = 1;

	scene = new Object(function webpackMissingModule() { var e = new Error("Cannot find module './js/three.module.js'"); e.code = 'MODULE_NOT_FOUND'; throw e; }())();

	geometry = new Object(function webpackMissingModule() { var e = new Error("Cannot find module './js/three.module.js'"); e.code = 'MODULE_NOT_FOUND'; throw e; }())( 0.2, 0.2, 0.2 );
	material = new Object(function webpackMissingModule() { var e = new Error("Cannot find module './js/three.module.js'"); e.code = 'MODULE_NOT_FOUND'; throw e; }())();

	mesh = new Object(function webpackMissingModule() { var e = new Error("Cannot find module './js/three.module.js'"); e.code = 'MODULE_NOT_FOUND'; throw e; }())( geometry, material );
	scene.add( mesh );

	renderer = new Object(function webpackMissingModule() { var e = new Error("Cannot find module './js/three.module.js'"); e.code = 'MODULE_NOT_FOUND'; throw e; }())( { antialias: true } );
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.setAnimationLoop( animation );
	document.body.appendChild( renderer.domElement );

}

function animation( time ) {

	mesh.rotation.x = time / 2000;
	mesh.rotation.y = time / 1000;

	renderer.render( scene, camera );

}
/******/ })()
;