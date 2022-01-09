/*  Parametric tree generation system for Blender based on the paper by Weber and Penn  */
import { renderTree } from "./tree-renderer/renderer";
import logger from "./logger";
import { random } from "./random";
import { TreeParam } from "./tree-params/tree_param";
import { Tree } from "./tree-generator/Tree";

//import params from "./tree-params/balsam_fir";
//import params from "./tree-params/quaking_aspen";
//import params from "./tree-params/palm";
import params from "./tree-params/acer";
logger.info(params);

// Seed for random state (not implemented)
const seed = 123;
if (seed === 0) {
  seed = Number.parseInt(Math.random() * 9999999);
}
logger.info(`\nUsing seed: ${seed}\n`);
random.seed(seed);

// Toggle for leaves
const generateLeaves = true;

// Generate Tree
const tree = new Tree(new TreeParam(params), generateLeaves);
logger.debug(tree);

// Render
renderTree(tree, document.body);
