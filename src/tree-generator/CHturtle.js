import { Vector3, Quaternion } from "three";
import {
  angleQuart,
  calc_point_on_bezier,
  calc_tangent_to_bezier,
  radians,
} from "./math";

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
  // Extension of the standard Vector class with some useful methods
  /*random() {
    // Normalised vector containing random entries in all dimensions 
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
    // Calculate declination of vector in degrees 
    return degrees(
      atan2(sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2)), this.z)
    );
  }*/

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

/*Create and setup the turtle for the position of a new branch, also returning the radius
    of the parent to use as a limit for the child*/
export function make_branch_pos_turtle(
  dir_turtle,
  offset,
  start_point,
  end_point,
  radius_limit
) {
  var branch_pos_turtle;
  dir_turtle.pos = calc_point_on_bezier(offset, start_point, end_point);
  branch_pos_turtle = new CHTurtle(dir_turtle);
  branch_pos_turtle.pitch_down(90);
  branch_pos_turtle.move(radius_limit);
  return branch_pos_turtle;
}

/* Create and setup the turtle for the direction of a new branch */
export function make_branch_dir_turtle(
  turtle,
  helix,
  offset,
  start_point,
  end_point
) {
  var branch_dir_turtle, tan_d, tangent;
  branch_dir_turtle = new CHTurtle();
  tangent = calc_tangent_to_bezier(offset, start_point, end_point);

  tangent.normalize();
  if (tangent.length() === 0) {
    debugger;
  }
  branch_dir_turtle.dir = tangent;
  if (helix) {
    tan_d = calc_tangent_to_bezier(
      offset + 0.0001,
      start_point,
      end_point
    ).normalize();
    branch_dir_turtle.right = branch_dir_turtle.dir.clone().cross(tan_d);
  } else {
    branch_dir_turtle.right = turtle.dir
      .clone()
      .cross(turtle.right)
      .cross(branch_dir_turtle.dir);
  }
  return branch_dir_turtle;
}
