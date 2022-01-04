import * as THREE from "three";
import { Mesh } from "three";
import { Vector3 } from "three";
import { DoubleSide, FaceColors } from "three";
import { Color, MeshBasicMaterial } from "three";
import { CatmullRomCurve3 } from "three";

let camera, scene, renderer;
let geometry, material, mesh;

export function init(tree) {
  camera = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    0.01,
    100
  );

  camera.position.x = 0;
  camera.position.y = 0;
  camera.position.z = 25;
  var position = new THREE.Vector3(0, 0, 0);
  camera.lookAt(position);

  scene = new THREE.Scene();
  const CLRS = [0xff0000, 0x00ff00, 0x0000ff];

  tree.branch_curves.forEach((branchCurve, branchIdx) => {
    if (branchIdx > 2) return;
    branchCurve.splines.children.forEach((spline, splineIdx) => {
      //if (splineIdx > 1) return;
      const points = [];
      spline.bezier_points.forEach((bp, bpIdx) => {
        //addLines(scene, bp, bpIdx);
        //points[i] = new THREE.Vector3(x, z, -y);
        //points.push(bp.co);
        try{
          points.push(new Vector3(bp.co.x, bp.co.z, -bp.co.y));
        } catch(e) {
          console.warn(e)
        }
        
      });
      addLines(scene, points, CLRS[branchIdx]);
    });
  });

  //addBox(scene);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setAnimationLoop(animation);
  document.body.appendChild(renderer.domElement);
}



function addLines(scene, points, color) {
    try {
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    //geometry.computeBoundingBox();
  
    //const clrIdx = bpIdx % 3;
    const material = new THREE.LineBasicMaterial({ color });
    const curveObject = new THREE.Line(geometry, material);
    scene.add(curveObject);
  } catch(e) {
    console.error(e);
  }
  

  //========== Create a path from the points
  /*var curvePath = new CatmullRomCurve3(points);
  var radius = 0.25;
  var cetGeometry = new THREE.TubeGeometry(curvePath, 600, radius, 10, false);
  cetGeometry.computeBoundingBox();
  var cetMaterial = new MeshBasicMaterial({
    vertexColors: FaceColors,
    side: DoubleSide,
    transparent: true,
    opacity: 1,
  });
  var tube = new Mesh(cetGeometry, cetMaterial);*/
  //scene.add(tube);
}

function addBox(scene) {
  geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
  material = new THREE.MeshNormalMaterial();

  mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);
}

function animation(time) {
  renderer.render(scene, camera);
}
