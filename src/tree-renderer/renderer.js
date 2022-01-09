import {
  Scene,
  Mesh,
  BufferGeometry,
  Float32BufferAttribute,
  MeshLambertMaterial,
  MeshPhongMaterial,
  DoubleSide,
} from "three";
import { mergeBufferGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

import { VertexNormalsHelper } from "three/examples/jsm/helpers/VertexNormalsHelper";

import logger from "../logger";

import { TreeScene } from "./TreeScene";
import { CatmullRomCurveRadius3 } from "./geometry/CatmulRomCurve";
import { RadiusVector3 } from "./RadiusVector3";
import { TubeGeometry } from "./geometry/TubeGeometry";

export function renderTree(tree, domElement) {
  const treeScene = new TreeScene(domElement);

  // Render Branches
  const branchesGeometry = generateBranchesGeometry(tree);
  //const branchMaterial = new MeshLambertMaterial({ color: 0x472b13 });
  const branchMaterial = new MeshLambertMaterial({ color: 0xffffff });
  var branchMesh = new Mesh(branchesGeometry, branchMaterial);
  treeScene.scene.add(branchMesh);

  // Render Leaves
  const leavesGeometry = generateLeavesGeometry(tree);
  //const leavesMaterial = new MeshLambertMaterial({
  const leavesMaterial = new MeshPhongMaterial({
    //color: 0x2a5709,
    color: 0xffffff,
    side: DoubleSide,
  });
  const leavesMesh = new Mesh(leavesGeometry, leavesMaterial);
  //const helper = new VertexNormalsHelper(leavesMesh, 2, 0x00ff00, 1);
  //treeScene.scene.add(helper);
  treeScene.scene.add(leavesMesh);
}

function generateBranchesGeometry(tree) {
  const radius = 1;
  const radiusSegments = 8;
  const branchesGeometries = [];
  tree.branch_curves.forEach((branchCurve, branchIdx) => {
    //if (branchIdx > 1) return;
    branchCurve.splines.children.forEach((spline) => {
      // Translate Tree BezierPoints to THREE Vector with extra radius
      const points = spline.bezier_points.map((bp) => {
        try {
          return new RadiusVector3(bp.co.x, bp.co.z, -bp.co.y, bp.radius);
        } catch (e) {
          logger.warn(e);
        }
      });

      try {
        branchesGeometries.push(
          new TubeGeometry(
            new CatmullRomCurveRadius3(points),
            200,
            radius,
            radiusSegments,
            false
          )
        );
      } catch (e) {
        logger.warn(e);
      }
    });
  });
  return mergeBufferGeometries(branchesGeometries);
}

/*function generateLeavesGeometry(tree) {
  const allGeoms = [];
  // For each leaf
  tree.leafMeshes.faces.forEach((leafFaceIndices, leafIndex) => {
    const leafGeometry = new BufferGeometry();

    const leafVertices = [];
    const leafIndices = [];

    // For each face in the leaf at leafIndex
    leafFaceIndices.forEach((faceIndices) => {
      leafIndices.push(faceIndices[0], faceIndices[1], faceIndices[2]);
      //leafIndices.push(faceIndices[2], faceIndices[1], faceIndices[0]);
    });

    // For each vertex in the leaf at leafIndex
    tree.leafMeshes.verts[leafIndex].forEach((v) => {
      leafVertices.push(v.x, v.z, -v.y);
    });

    // Create Leaf Geometry
    leafGeometry.setIndex(leafIndices);

    leafGeometry.setAttribute(
      "position",
      new Float32BufferAttribute(leafVertices, 3)
    );

    leafGeometry.computeVertexNormals();

    allGeoms.push(leafGeometry);
  });

  const merged = mergeBufferGeometries(allGeoms);
  merged.computeVertexNormals();
  return merged;
}*/

function generateLeavesGeometry(tree) {
  const leafGeometry = new BufferGeometry();
  const leafIndices = [];

  tree.leafMeshes.faces.forEach((faceIndices) => {
    leafIndices.push(faceIndices[0], faceIndices[1], faceIndices[2]);
  });

  const leafVertices = [];
  tree.leafMeshes.verts.forEach((v) => {
    leafVertices.push(v.x, v.z, -v.y);
  });
  leafGeometry.setIndex(leafIndices);
  leafGeometry.setAttribute(
    "position",
    new Float32BufferAttribute(leafVertices, 3)
  );

  leafGeometry.computeVertexNormals();
  return leafGeometry;
}
