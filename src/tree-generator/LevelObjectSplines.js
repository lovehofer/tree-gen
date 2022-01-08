import { Spline } from "./Spline";

export class LevelObjectSplines {
  children = [];
  constructor(parent) {
    this.parent = parent;
  }

  makeNew(type) {
    const newSpline = new Spline(type, this);
    this.children.push(newSpline);
    return newSpline;
  }
}
