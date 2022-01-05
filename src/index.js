import * as THREE from "three";
import * as gen from "./parametric/gen";
//import params from "./parametric/tree_params/balsam_fir";
//import params from "./parametric/tree_params/quaking_aspen";
import params from "./parametric/tree_params/palm";
import { init } from "./renderer";

console.log(params);
const tree = gen.construct(params, 123, true);
console.log(tree);

init(tree);
