import * as THREE from "three";
import { Mesh, MeshBasicMaterial } from "three";
import { BufferGeometry } from "three";
import { WebGLRenderer } from "three";
import { Float32BufferAttribute } from "three";
import { Vector3 } from "three";
import { CatmullRomCurveRadius3 } from "./CatmulRomCurve";
import { TubeGeometry } from "./TubeGeometry";
import { FlyControls } from 'three/examples/jsm/controls/FlyControls';

let camera, scene, renderer, controls;
let geometry, material, mesh;

export function init(tree) {
  camera = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    0.01,
    100
  );

  camera.position.x = 0;
  camera.position.y = 6;
  camera.position.z = 15;
  var position = new THREE.Vector3(0, 0, 0);
  //camera.lookAt(position);

  scene = new THREE.Scene();
  //const CLRS = [0xff0000, 0x00ff00, 0x0000ff,, 0xff00ff];
  const CLRS = [0x261709, 0x472b13, 0x17290e];

  // render branches
  tree.branch_curves.forEach((branchCurve, branchIdx) => {
    if (branchIdx > 1) return;
    branchCurve.splines.children.forEach((spline, splineIdx) => {
      //if (splineIdx > 1) return;
      const points = [];
      spline.bezier_points.forEach((bp, bpIdx) => {
        //addLines(scene, bp, bpIdx);
        //points[i] = new THREE.Vector3(x, z, -y);
        //points.push(bp.co);
        try {
          const v = new Vector3(bp.co.x, bp.co.z, -bp.co.y);
          v.radius = bp.radius; // || 0;
          points.push(v);
        } catch (e) {
          console.warn(e);
        }
      });
      addLines(scene, points, CLRS[branchIdx]);
    });
  });

  // render leaves
  const leafGeometry = new BufferGeometry();
  const leafIndices = [];
  // Fan triangulation is supposedly supposed to be like this:
  /*
    Given a quad A B C D we can split it into A B C, A C D or A B D, D B C.
    Compare the length of A-C and B-D and use the shorter for the splitting edge.
    In other words use A B C, A C D if A-C is shorter and A B D, D B C otherwise.
  */
  // this should be moved to the base shape place as it will be much much faster
  tree.leafMeshes.faces.forEach((faceIndices) => {
    leafIndices.push(faceIndices[0], faceIndices[1], faceIndices[2]);
  });

  const leafVertices = [];
  tree.leafMeshes.verts.forEach((v) => {
    //points[i] = new THREE.Vector3(x, z, -y);
    leafVertices.push(v.x, v.z, -v.z);    
  });
  leafGeometry.setIndex(leafIndices);
  leafGeometry.setAttribute(
    "position",
    new Float32BufferAttribute(leafVertices, 3)
  );
  leafGeometry.computeBoundingBox();
  const leafMaterial = new MeshBasicMaterial({ color: 0x00ff00 });
  const leafMesh = new Mesh(leafGeometry, leafMaterial);
  scene.add(leafMesh);

  // STATS
  //stats = new Stats();
  //document.body.appendChild( stats.dom );


  renderer = new WebGLRenderer({ antialias: true });
  renderer.setClearColor(0xcccccc, 1);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setAnimationLoop(animation);
  document.body.appendChild(renderer.domElement);

  
  // Fly controlls
  controls = new FlyControls( camera, renderer.domElement );
  controls.movementSpeed = 10;
  controls.rollSpeed = Math.PI / 5;
  controls.autoForward = false;
  controls.dragToLook = true;
}

function addLines(scene, points, color) {
  try {
    /*const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ color });
    const curveObject = new THREE.Line(geometry, material);
    scene.add(curveObject);*/

    var curvePath = new CatmullRomCurveRadius3(points);
    const radius = 1;
    const radiusSegments = 4;
    const tubeGeom = new TubeGeometry(
      curvePath,
      200,
      radius,
      radiusSegments,
      false
    );
    const tubeMaterial = new MeshBasicMaterial({ color });
    var tubeObject = new Mesh(tubeGeom, tubeMaterial);

    scene.add(tubeObject);
  } catch (e) {
    console.error(e);
  }
}

function animation(time) {
  controls.update(0.01)
  renderer.render(scene, camera);
}
