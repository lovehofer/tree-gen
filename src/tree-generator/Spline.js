import { BezierPoint } from "./BezierPoint";

export class Spline {
  type;
  bezier_points = new Proxy([new BezierPoint()], {
    get(target, prop) {
      if (!isNaN(prop)) {
        prop = parseInt(prop, 10);
        if (prop < 0) {
          prop += target.length;
        }
      }
      return target[prop];
    },
  });
  constructor(type, parent) {
    this.type = type;
    this.parent = parent;
    this.bezier_points.add = (numPoints) => {
      for (let index = 0; index < numPoints; index++) {
        this.bezier_points.push(new BezierPoint());
      }
    };
  }
}
