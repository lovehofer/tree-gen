import { Vector3 } from "three";

export class RadiusVector3 extends Vector3 {
  radius;
  constructor(x, y, z, radius) {
    super(x, y, z);
    this.radius = radius;
  }
}
