import { Quaternion } from "@math.gl/core";
import { Vector } from "./CHturtle";
const { atan2, sqrt } = Math;

export const degrees = function radians_to_degrees(input_radians) {
  return input_radians * (180 / Math.PI);
};
export const radians = function degrees_to_radians(input_degrees) {
  return input_degrees * (Math.PI / 180);
};

export function angleQuart(axis, angleRad) {
  return new Quaternion().setFromAxisAngle(axis, angleRad);
}

export function vectorDeclination(vector) {
  // Calculate declination of vector in degrees
  return degrees(
    atan2(sqrt(Math.pow(vector.x, 2) + Math.pow(vector.y, 2)), vector.z)
  );
}

/* Evaluate Bezier curve at offset between bezier_spline_points start_point and end_point */
export function calc_point_on_bezier(offset, start_point, end_point) {
  var one_minus_offset, res;
  if (offset < 0 || offset > 1) {
    throw new Error("Offset out of range: %s not between 0 and 1" % offset);
  }
  one_minus_offset = 1 - offset;

  const rightPartialCoPartial = start_point.co
    .clone()
    .multiplyScalar(Math.pow(one_minus_offset, 3));
  const rightPartialRightPartial = start_point.handle_right
    .clone()
    .multiplyScalar(3 * Math.pow(one_minus_offset, 2) * offset);
  const rightPartial = rightPartialCoPartial.add(rightPartialRightPartial);

  const leftPartial = end_point.handle_left
    .clone()
    .multiplyScalar(3 * one_minus_offset * Math.pow(offset, 2));

  const coPartial = end_point.co.clone().multiplyScalar(Math.pow(offset, 3));

  const ret = rightPartial.add(leftPartial).add(coPartial);
  return ret;
}

/* Calculate tangent to Bezier curve at offset between bezier_spline_points start_point and end_point */
export function calc_tangent_to_bezier(offset, start_point, end_point) {
  var end_handle_left, one_minus_offset, res, start_handle_right;
  if (offset < 0 || offset > 1) {
    throw new Error("Offset out of range: %s not between 0 and 1" % offset);
  }
  one_minus_offset = 1 - offset;
  start_handle_right = start_point.handle_right;
  end_handle_left = end_point.handle_left;

  const startDiff = start_handle_right.clone().sub(start_point.co);
  const startPartial = startDiff.multiplyScalar(
    3 * Math.pow(one_minus_offset, 2)
  );

  const mixedDiff = end_handle_left.clone().sub(start_handle_right);
  const mixedPartial = mixedDiff.multiplyScalar(6 * one_minus_offset * offset);

  const endDiff = end_point.co.clone().sub(end_handle_left);
  const endPartial = endDiff.multiplyScalar(3 * Math.pow(offset, 2));

  const ret = startPartial.add(mixedPartial).add(endPartial);
  return ret;
}

/*  calculates required points to produce helix bezier curve with given radius and pitch in direction of turtle */
export function calc_helix_points(turtle, rad, pitch) {
  var points, rot_quat, spin_ang, trf;
  points = [
    new Vector([0, -rad, -pitch / 4]),
    new Vector([(4 * rad) / 3, -rad, 0]),
    new Vector([(4 * rad) / 3, rad, 0]),
    new Vector([0, rad, pitch / 4]),
  ];
  trf = turtle.dir.to_track_quat("Z", "Y");
  spin_ang = rand_in_range(0, 2 * pi);
  rot_quat = angleQuart(new Vector(0, 0, 1), spin_ang);
  for (
    var p, _pj_c = 0, _pj_a = points, _pj_b = _pj_a.length;
    _pj_c < _pj_b;
    _pj_c += 1
  ) {
    p = _pj_a[_pj_c];
    p.rotate(rot_quat);
    p.rotate(trf);
  }
  return [
    points[1] - points[0],
    points[2] - points[0],
    points[3] - points[0],
    turtle.dir.clone(),
  ];
}

export function point_in_cube(point) {
  const size = 2;
  return (
    abs(point.x) < size && abs(point.y) < size && abs(point.z - size) < size
  );
}

export function scale_bezier_handles_for_flare(stem, max_points_per_seg) {
  /*Reduce length of bezier handles to account for increased density of points on curve for
    flared base of trunk*/
  stem.curve.bezier_points.forEach((point) => {
    const leftPartial = point.handle_left
      .clone()
      .sub(point.co)
      .divideScalar(max_points_per_seg);
    point.handle_left = leftPartial.add(point.co);

    const rightPartial = point.handle_right
      .clone()
      .sub(point.co)
      .divideScalar(max_points_per_seg);
    point.handle_right = rightPartial.add(point.co);
  });
}

// https://github.com/mrdoob/three.js/blob/dev/src/math/Quaternion.js#L363
// http://lolengine.net/blog/2013/09/18/beautiful-maths-quaternion-from-vectors
export function quatFromUnitVectors(vFrom, vTo) {
  // assumes direction vectors vFrom and vTo are normalized

  let x, y, z, w;
  let r = vFrom.dot(vTo) + 1;

  if (r < Number.EPSILON) {
    // vFrom and vTo point in opposite directions

    r = 0;

    if (Math.abs(vFrom.x) > Math.abs(vFrom.z)) {
      x = -vFrom.y;
      y = vFrom.x;
      z = 0;
      w = r;
    } else {
      x = 0;
      y = -vFrom.z;
      z = vFrom.y;
      w = r;
    }
  } else {
    // crossVectors( vFrom, vTo ); // inlined to avoid cyclic dependency on Vector3

    x = vFrom.y * vTo.z - vFrom.z * vTo.y;
    y = vFrom.z * vTo.x - vFrom.x * vTo.z;
    z = vFrom.x * vTo.y - vFrom.y * vTo.x;
    w = r;
  }

  const quat = new Quaternion(x, y, z, w);

  return quat.normalize();
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
