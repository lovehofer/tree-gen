export class Stem {
  /*Class to store data for each stem (branch) in the system, primarily to
      be accessed by its children in calculating their own parameters*/

  name;
  depth;
  curve;
  parent;
  offset;
  radius_limit;
  children;
  length;
  radius;
  length_child_max;

  constructor(depth, curve, parent = null, offset = 0, radius_limit = -1) {
    /* Init with at depth with curve, possibly parent and offset (for depth > 0) */
    this.depth = depth;
    this.curve = curve;
    this.parent = parent;
    this.offset = offset;
    this.radius_limit = radius_limit;
    this.children = [];
    this.length = 0;
    this.radius = 0;
    this.length_child_max = 0;
  }
  copy() {
    /* Copy method for stems */
    var new_stem;
    new_stem = new Stem(
      this.depth,
      this.curve,
      this.parent,
      this.offset,
      this.radius_limit
    );
    new_stem.name = this.name + " copy";
    new_stem.length = this.length;
    new_stem.radius = this.radius;
    new_stem.length_child_max = this.length_child_max;
    return new_stem;
  }
  toString() {
    return `${this.length} ${this.offset}  ${this.radius}`;
  }
}
