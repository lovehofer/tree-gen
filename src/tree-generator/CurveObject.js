import { LevelObjectSplines } from "./LevelObjectSplines";

export class CurveObject {
  type = "CURVE";
  name = "";

  constructor(name, children) {
    this.name = name;
    this.splines = new LevelObjectSplines(this);
  }
}
