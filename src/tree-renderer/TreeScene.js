import {
  Scene,
  WebGLRenderer,
  PerspectiveCamera,
  AmbientLight,
  DirectionalLight,
} from "three";
import { FlyControls } from "three/examples/jsm/controls/FlyControls";

export class TreeScene {
  camera;
  scene;
  renderer;

  constructor(rendererDomElement) {
    this.setupCamera();
    this.setupScene();
    this.setupLighting();
    this.setupRenderer(rendererDomElement);
    this.setupControls();
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
    this.scene.add(new AmbientLight(0xbbbbbb, 0.6));
    this.scene.add(new DirectionalLight(0xffffff, 0.6));
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

  setupControls() {
    this.controls = new FlyControls(this.camera, this.renderer.domElement);
    this.controls.movementSpeed = 10;
    this.controls.rollSpeed = Math.PI / 5;
    this.controls.autoForward = false;
    this.controls.dragToLook = true;
  }
}
