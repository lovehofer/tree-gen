import {
  Scene,
  WebGLRenderer,
  PerspectiveCamera,
  AmbientLight,
  DirectionalLight,
} from "three";
import { Controlls } from "./Controlls";

export class TreeScene {
  camera;
  scene;
  renderer;

  constructor(rendererDomElement) {
    this.setupCamera();
    this.setupScene();
    this.setupLighting();
    this.setupRenderer(rendererDomElement);
    this.setupControls(rendererDomElement);
  }

  setupCamera() {
    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new PerspectiveCamera(70, aspect, 0.01, 100);
    this.camera.position.x = 0;
    this.camera.position.y = 6;
    this.camera.position.z = 15;
  }

  setupScene() {
    this.scene = new Scene();
  }

  setupLighting() {
    //this.scene.add(new AmbientLight(0xbbbbbb, 0.6));
    const directionalLight1 = new DirectionalLight(0x00ff00, 1);
    const directionalLight2 = new DirectionalLight(0xff0000, 1);
    directionalLight1.position.set(0, 1, 0);
    directionalLight2.position.set(0, -1, 0);
    this.scene.add(directionalLight1);
    this.scene.add(directionalLight2);
  }

  setupRenderer(rendererDomElement) {
    this.renderer = new WebGLRenderer({ antialias: true });
    this.renderer.setClearColor(0xcccccc, 1);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setAnimationLoop((time) => {
      this.controls.update(0.01);
      this.renderer.render(this.scene, this.camera);
    });
    rendererDomElement.appendChild(this.renderer.domElement);
  }

  setupControls(rendererDomElement) {
    this.controls = new Controlls(this.camera, this.renderer.domElement);

    rendererDomElement.addEventListener("click", () => {
      this.controls.lock();
    });
    this.controls.movementSpeed = 10;
    this.controls.lookSpeed = 0.5;
    this.controls.autoForward = false;
    this.controls.dragToLook = true;
  }
}
