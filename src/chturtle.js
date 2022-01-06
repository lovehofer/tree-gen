//import {atan2, degrees, radians, sqrt} from 'math';
const { atan2, sqrt } = Math;
const degrees = function radians_to_degrees(input_radians) {
  return input_radians * (180 / Math.PI);
};
const radians = function degrees_to_radians(input_degrees) {
  return input_degrees * (Math.PI / 180);
};

//import {random as random_random} from 'random';
const random_random = () => Math.random();

//import * as mathutils from 'mathutils';
import { Vector3 } from "three";
//import {Quaternion} from 'mathutils';
import { Quaternion } from "three";
import { angleQuart } from "./parametric/vector-algebra";

/*3D Turtle implementation for use in tree generation module, also extends
Blender Vector class with some useful methods*/
export class Vector extends Vector3 {
  constructor(x, y, z) {
    if (Array.isArray(x)) {
      if (isNaN(x[0]) || isNaN(x[1]) || isNaN(x[2])) {
        debugger;
      }
      super(...x);
    } else {
      if (isNaN(x) || isNaN(y) || isNaN(z)) {
        debugger;
      }
      super(x, y, z);
    }
  }
  /* Extension of the standard Vector class with some useful methods */
  random() {
    /* Normalised vector containing random entries in all dimensions */
    var vec;
    vec = new Vector([random_random(), random_random(), random_random()]);
    vec.normalize();
    return vec;
  }
  rotated(rotation) {
    var vec;
    vec = this.clone();
    //vec.rotate(rotation);
    vec.applyQuaternion(rotation);
    return vec;
  }
  declination() {
    /* Calculate declination of vector in degrees */
    return degrees(
      atan2(sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2)), this.z)
    );
  }

  // Blender vector methods
  to_track_quat(track, up) {
    if (track !== "Z") throw "Expected track to be Z unit vector.";
    return new Quaternion().setFromUnitVectors(
      new Vector3(0, 0, 1).normalize(),
      this.clone().normalize()
      
    );
  }
}
export class CHTurtle {
  /*3D turtle implementation for use in both L-Systems and Parametric tree
    generation schemes*/
  constructor(other = null) {
    /* Copy Constructor */
    if (other !== null) {
      this.dir = other.dir.clone();
      this.pos = other.pos.clone();
      this.right = other.right.clone();
      this.width = other.width;
      this.check();
    } else {
      this.dir = new Vector([0.0, 0.0, 1.0]);
      this.pos = new Vector([0.0, 0.0, 0.0]);
      this.right = new Vector([1.0, 0.0, 0.0]);
      this.width = 0.0;
    }
  }

  preCheck() {
    this._dir = this.dir.clone();
  }
  check() {
    if (this.dir.x === 0 && this.dir.y === 0 && this.dir.z === 0) {
      if (this._dir.x !== 0 || this._dir.y !== 0 || this._dir.z !== 0) {
        debugger;
      }
    }
    if (this.dir.x === 0 && this.dir.y === 0 && this.dir.z === 1) {
      //debugger;
    }
  }
  toString() {
    return (
      "Turtle at %s, direction %s, right %s" % [this.pos, this.dir, this.right]
    );
  }
  turn_right(angle) {
    if (angle === 0) return;
    this.preCheck();
    /*Turn the turtle right about the axis perpendicular to the direction
        it is facing*/
    var axis, rot_quat;
    axis = this.dir.clone().cross(this.right);
    axis.normalize();
    rot_quat = angleQuart(axis, radians(angle));
    //this.dir.rotate(rot_quat);
    this.dir.applyQuaternion(rot_quat);
    this.dir.normalize();
    //this.right.rotate(rot_quat);
    this.right.applyQuaternion(rot_quat);
    this.right.normalize();
    this.check();
  }
  turn_left(angle) {
    if (angle === 0) return;
    this.preCheck();
    /*Turn the turtle left about the axis perpendicular to the direction it
        is facing*/
    var axis, rot_quat;
    axis = this.dir.clone().cross(this.right);
    axis.normalize();
    rot_quat = angleQuart(axis, radians(-angle));
    this.dir.applyQuaternion(rot_quat);
    this.dir.normalize();
    this.right.applyQuaternion(rot_quat);
    this.right.normalize();
    this.check();
  }
  pitch_up(angle) {
    if (angle === 0) return;
    this.preCheck();
    /* Pitch the turtle up about the right axis */
    this.dir.applyQuaternion(angleQuart(this.right, radians(angle)));
    this.dir.normalize();
    this.check();
  }
  pitch_down(angle) {
    if (angle === 0) return;
    this.preCheck();
    /* Pitch the turtle down about the right axis */
    this.dir.applyQuaternion(angleQuart(this.right, radians(-angle)));
    this.dir.normalize();
    this.check();
  }
  roll_right(angle) {
    if (angle === 0) return;
    this.preCheck();
    /* Roll the turtle right about the direction it is facing */
    this.right.applyQuaternion(angleQuart(this.dir, radians(angle)));
    this.right.normalize();
    this.check();
  }
  roll_left(angle) {
    if (angle === 0) return;
    this.preCheck();
    /* Roll the turtle left about the direction it is facing */
    this.right.applyQuaternion(angleQuart(this.dir, radians(-angle)));
    this.right.normalize();
    this.check();
  }
  move(distance) {
    if (distance === 0) return;
    this.preCheck();
    /* Move the turtle in t
    he direction it is facing by specified distance */
    this.pos.addScaledVector(this.dir, distance);
    this.check();
  }
  set_width(width) {
    /* Set the width stored by the turtle */
    this.width = width;
  }
}
//_pj.set_properties(CHTurtle, { __slots__: ["dir", "pos", "right", "width"] });
