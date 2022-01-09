import { Euler } from "three";
import { Vector3 } from "three";
import { FirstPersonControls } from "three/examples/jsm/controls/FirstPersonControls";
const _euler = new Euler(0, 0, 0, "YXZ");
const _PI_2 = Math.PI / 2;

export class Controlls extends FirstPersonControls {
  constructor(camera, domElement) {
    super(camera, domElement);
    this.camera = camera;
    this.domElement = domElement;

    this.isLocked = false;
    this.minPolarAngle = 0; // radians
    this.maxPolarAngle = Math.PI; // radians

    this.boundOnPointerlockChange = this.onPointerlockChange.bind(this);
    this.boundOnMouseMove = this.myOnMouseMove.bind(this);

    this.domElement.addEventListener("mousemove", this.boundOnMouseMove, true);
    this.update = this.myUpdate;
    this.connect();
    this.handleResize();
  }

  myOnMouseMove(event) {
    event.stopImmediatePropagation();
    if (this.isLocked === false) return;

    const movementX =
      event.movementX || event.mozMovementX || event.webkitMovementX || 0;
    const movementY =
      event.movementY || event.mozMovementY || event.webkitMovementY || 0;

    _euler.setFromQuaternion(this.camera.quaternion);

    _euler.y -= movementX * 0.002;
    _euler.x -= movementY * 0.002;

    _euler.x = Math.max(
      _PI_2 - this.maxPolarAngle,
      Math.min(_PI_2 - this.minPolarAngle, _euler.x)
    );
    this.camera.quaternion.setFromEuler(_euler);
  }

  onPointerlockChange(evt) {
    if (this.domElement.ownerDocument.pointerLockElement === this.domElement) {
      this.isLocked = true;
    } else {
      this.isLocked = false;
    }
  }

  myUpdate(delta) {
    if (this.enabled === false) return;

    if (this.heightSpeed) {
      const y = MathUtils.clamp(
        this.object.position.y,
        this.heightMin,
        this.heightMax
      );
      const heightDelta = y - this.heightMin;

      this.autoSpeedFactor = delta * (heightDelta * this.heightCoef);
    } else {
      this.autoSpeedFactor = 0.0;
    }

    const actualMoveSpeed = delta * this.movementSpeed;

    if (this.moveForward || (this.autoForward && !this.moveBackward))
      this.object.translateZ(-(actualMoveSpeed + this.autoSpeedFactor));
    if (this.moveBackward) this.object.translateZ(actualMoveSpeed);

    if (this.moveLeft) this.object.translateX(-actualMoveSpeed);
    if (this.moveRight) this.object.translateX(actualMoveSpeed);

    if (this.moveUp) this.object.translateY(actualMoveSpeed);
    if (this.moveDown) this.object.translateY(-actualMoveSpeed);
  }

  connect() {
    this.domElement.ownerDocument.addEventListener(
      "pointerlockchange",
      this.boundOnPointerlockChange
    );
    this.domElement.ownerDocument.addEventListener(
      "pointerlockerror",
      this.onPointerlockError
    );
  }

  disconnect() {
    this.domElement.ownerDocument.removeEventListener(
      "pointerlockchange",
      this.onPointerlockChange
    );
    this.domElement.ownerDocument.removeEventListener(
      "pointerlockerror",
      this.onPointerlockError
    );
  }

  handleResize() {
    if (this.domElement === document) {
      this.viewHalfX = window.innerWidth / 2;
      this.viewHalfY = window.innerHeight / 2;
    } else {
      this.viewHalfX = this.domElement.offsetWidth / 2;
      this.viewHalfY = this.domElement.offsetHeight / 2;
    }
  }

  dispose() {
    this.disconnect();
  }

  lock() {
    this.domElement.requestPointerLock();
  }

  unlock() {
    this.domElement.ownerDocument.exitPointerLock();
  }
}
