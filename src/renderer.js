import * as THREE from "three";
import { Mesh } from "three";
import { Vector3 } from "three";
import { CatmullRomCurveRadius3 } from "./CatmulRomCurve";
import { TubeGeometry } from "./TubeGeometry";

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
  camera.position.y = 6;
  camera.position.z = 15;
  var position = new THREE.Vector3(0, 0, 0);
  //camera.lookAt(position);

  scene = new THREE.Scene();
  //const CLRS = [0xff0000, 0x00ff00, 0x0000ff,, 0xff00ff];
  const CLRS = [0x261709, 0x472b13, 0x17290e];

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
          const v= new Vector3(bp.co.x, bp.co.z, -bp.co.y)
          v.radius = bp.radius;// || 0;
          points.push(v);
        } catch(e) {
          console.warn(e)
        }
        
      });
      addLines(scene, points, CLRS[branchIdx]);
    });
  });

  //addBox(scene);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setClearColor( 0xcccccc, 1 );
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setAnimationLoop(animation);
  document.body.appendChild(renderer.domElement);
}



function addLines(scene, points, color) {
    try {
    
    /*const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ color });
    const curveObject = new THREE.Line(geometry, material);
    scene.add(curveObject);*/
    
    var curvePath = new CatmullRomCurveRadius3(points)
    const radius = 1;
    const radiusSegments = 4;
    const tubeGeom = new TubeGeometry(curvePath, 200, radius, radiusSegments, false);
    const tubeMaterial = new THREE.MeshBasicMaterial( { color } );
    var tubeObject = new Mesh(tubeGeom, tubeMaterial);

    scene.add(tubeObject);
  } catch(e) {
    console.error(e);
  }
  
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
