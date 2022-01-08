const time = { time: () => new Date().getTime() };
import { CurveObject } from "./CurveObject";

const copy = (obj) => JSON.parse(JSON.stringify(obj));
const { ceil, abs, cos, PI: pi, pow, sin, sqrt, tan, max, min } = Math;

import {
  calc_point_on_bezier,
  calc_tangent_to_bezier,
  calc_helix_points,
  point_in_cube,
  scale_bezier_handles_for_flare,
  angleQuart,
  vectorDeclination,
  radians,
} from "./math";
import {
  CHTurtle,
  make_branch_dir_turtle,
  make_branch_pos_turtle,
  Vector,
} from "./CHturtle";
import { Leaf } from "./Leaf";
import { Stem } from "./Stem";
import {
  random_getstate,
  random_random,
  random_setstate,
  random_uniform,
  rand_in_range,
} from "../random";
import {
  BranchMode,
  BRANCH_MODE_ALT_OPP,
  BRANCH_MODE_FAN,
  BRANCH_MODE_WHORLED,
} from "./BranchMode";
import logger from "../logger";

export class Tree {
  /* Class to store data for the tree */
  param;
  generate_leaves;
  leaves_array;
  stem_index;
  tree_scale;
  /** @type {CurveObject[]}*/
  branch_curves;
  base_length;
  split_num_error;
  tree_obj;
  trunk_length;

  constructor(param, generate_leaves = true) {
    /* initialize tree with specified parameters */
    this.param = param;
    this.generate_leaves = generate_leaves;
    this.leaves_array = [];
    this.stem_index = 0;
    this.tree_scale = 0;
    this.branch_curves = [];
    this.base_length = 0;
    this.split_num_error = [0, 0, 0, 0, 0, 0, 0];
    this.tree_obj = null;
    this.trunk_length = 0;
    if (!generate_leaves) {
      this.param.leaf_blos_num = 0;
    }
    this.make();
  }

  make() {
    /* make the tree */
    this.create_branches();
    if (this.generate_leaves) {
      this.create_leaf_mesh();
    }
  }
  points_for_floor_split() {
    /* Calculate Poissonly distributed points for stem start points */
    var array, dis, point_m_ok, point_ok, pos, rad, stem, theta;
    array = [];
    this.tree_scale = this.param.g_scale + this.param.g_scale_v;
    stem = new Stem(0, null);
    stem.name = "floor stem";
    stem.length = this.calc_stem_length(stem);
    rad = 2.5 * this.calc_stem_radius(stem);
    for (var _ = 0, _pj_a = this.param.branches[0]; _ < _pj_a; _ += 1) {
      point_ok = false;
      while (!point_ok) {
        dis = sqrt(
          ((random_random() * this.param.branches[0]) / 2.5) *
            this.param.g_scale *
            this.param.ratio
        );
        theta = rand_in_range(0, 2 * pi);
        pos = new Vector([dis * cos(theta), dis * sin(theta), 0]);
        point_m_ok = true;
        for (
          var point, _pj_d = 0, _pj_b = array, _pj_c = _pj_b.length;
          _pj_d < _pj_c;
          _pj_d += 1
        ) {
          point = _pj_b[_pj_d];
          if ((point[0] - pos).magnitude < rad) {
            point_m_ok = false;
            break;
          }
        }
        if (point_m_ok) {
          point_ok = true;
          array.push([pos, theta]);
        }
      }
    }
    return array;
  }
  create_branches() {
    /* Create branches for tree */
    let b_time, curve_points, point, points, start_time, turtle;
    logger.info("Making Stems");
    start_time = time.time();
    const enumeratedLevels = ["Trunk"];
    for (let index = 1; index < this.param.levels; index++) {
      enumeratedLevels.push("Branches" + index);
    }

    // Create empy levels (Trunk, Branches1, Branches2, ...)
    enumeratedLevels.forEach((level_name, level_depth) => {
      logger.info(`Making level ${level_name}`);
      const level_curve = new CurveObject(level_name.toLowerCase());
      level_curve.dimensions = "3D";
      level_curve.resolution_u = this.param.curve_res[level_depth];
      level_curve.fill_mode = "FULL";
      level_curve.bevel_depth = 1;
      level_curve.bevel_resolution = this.param.bevel_res[level_depth];
      if ("use_uv_as_generated" in level_curve) {
        level_curve.use_uv_as_generated = true;
      }
      this.branch_curves.push(level_curve);
    });

    // Calculate points for stem start points
    if (this.param.branches[0] > 0) {
      points = this.points_for_floor_split();
    }

    // Make all trunk branches
    for (let ind = 0; ind < this.param.branches[0]; ind += 1) {
      this.tree_scale =
        this.param.g_scale + random_uniform(-1, 1) * this.param.g_scale_v;
      turtle = new CHTurtle();
      turtle.pos = new Vector([0, 0, 0]);
      turtle.dir = new Vector([0, 0, 1]);
      turtle.right = new Vector([1, 0, 0]);
      if (this.param.branches[0] > 1) {
        point = points[ind];
        turtle.roll_right(degrees(point[1] - 90));
        turtle.pos = point[0];
      } else {
        turtle.roll_right(rand_in_range(0, 360));
      }
      const trunkSpline = this.branch_curves[0].splines.makeNew("BEZIER");
      trunkSpline.radius_interpolation = "CARDINAL";
      trunkSpline.resolution_u = this.param.curve_res[0];

      const trunkStem = new Stem(0, trunkSpline);
      trunkStem.name = "trunk stem nr " + ind;

      // Recurse deeply for this trunk to create tree
      this.make_stem(turtle, trunkStem);
    }

    b_time = time.time() - start_time;
    logger.info(`Stems made: ${this.stem_index} in ${b_time} seconds`);
    /*curve_points = 0;
    this.branch_curves.forEach((branchCurve) => {
      branchCurve.splines.children.forEach((spline) => {
        curve_points += spline.bezier_points.length;
      });
    });

    logger.info(`Curve points: ${curve_points}`);*/
    return b_time;
  }
  create_leaf_mesh() {
    /* Create leaf mesh for tree */
    var base_blossom_shape,
      base_leaf_shape,
      blossom,
      blossom_faces,
      blossom_index,
      blossom_obj,
      blossom_verts,
      counter,
      faces,
      l_time,
      leaf_faces,
      leaf_index,
      leaf_uv,
      leaf_verts,
      leaves,
      leaves_obj,
      start_time,
      uv_layer,
      vert_ind,
      verts,
      windman;
    if (this.leaves_array.length <= 0) {
      return;
    }
    logger.info("Making Leaves");
    start_time = time.time();
    //windman = bpy.context.window_manager;
    //windman.progress_begin(0, this.leaves_array.length);
    base_leaf_shape = Leaf.get_shape(
      this.param.leaf_shape,
      this.tree_scale / this.param.g_scale,
      this.param.leaf_scale,
      this.param.leaf_scale_x
    );
    base_blossom_shape = Leaf.get_shape(
      -this.param.blossom_shape,
      this.tree_scale / this.param.g_scale,
      this.param.blossom_scale,
      1
    );
    leaf_verts = [];
    leaf_faces = [];
    leaf_index = 0;
    blossom_verts = [];
    blossom_faces = [];
    blossom_index = 0;
    counter = 0;
    for (
      var leaf, _pj_c = 0, _pj_a = this.leaves_array, _pj_b = _pj_a.length;
      _pj_c < _pj_b;
      _pj_c += 1
    ) {
      leaf = _pj_a[_pj_c];
      if (counter % 500 === 0) {
        //windman.progress_update((counter / 100));
        logger.info(
          `\r-> ${leaf_index} leaves made, ${blossom_index} blossoms made`
        );
      }
      if (
        this.param.blossom_rate &&
        random_random() < this.param.blossom_rate
      ) {
        [verts, faces] = leaf.get_mesh(
          this.param.leaf_bend,
          base_blossom_shape,
          blossom_index
        );
        blossom_verts.push(...verts);
        blossom_faces.push(...faces);
        blossom_index += 1;
      } else {
        [verts, faces] = leaf.get_mesh(
          this.param.leaf_bend,
          base_leaf_shape,
          leaf_index
        );
        leaf_verts.push(...verts);
        leaf_faces.push(...faces);
        leaf_index += 1;
      }
      counter += 1;
    }
    if (leaf_index > 0) {
      //leaves = new bpy.data.meshes.COMPAT_new("leaves");
      //leaves_obj = new bpy.data.objects.COMPAT_new("Leaves", leaves);
      //bpy.context.collection.objects.link(leaves_obj);
      //leaves_obj.parent = this.tree_obj;

      this.leafMeshes = {
        verts: leaf_verts,
        faces: leaf_faces,
      };
      /*console.warn("Skipping leaf UV stuff");
        leaf_uv = base_leaf_shape[2];
        if (leaf_uv) {
          new leaves.uv_layers.COMPAT_new({ name: "leavesUV" });
          uv_layer = leaves.uv_layers.active.data;
          for (
            var seg_ind = 0,
              _pj_a = Number.parseInt(
                leaf_faces.length / base_leaf_shape[1].length
              );
            seg_ind < _pj_a;
            seg_ind += 1
          ) {
            vert_ind = 0;
            for (
              var vert, _pj_d = 0, _pj_b = leaf_uv, _pj_c = _pj_b.length;
              _pj_d < _pj_c;
              _pj_d += 1
            ) {
              vert = _pj_b[_pj_d];
              uv_layer[seg_ind * len(leaf_uv) + vert_ind].uv = vert;
              vert_ind += 1;
            }
          }
        }*/
    }
    if (blossom_index > 0) {
      //blossom = new bpy.data.meshes.COMPAT_new("blossom");
      //blossom_obj = new bpy.data.objects.COMPAT_new("Blossom", blossom);
      //bpy.context.collection.objects.link(blossom_obj);
      blossom_obj.parent = this.tree_obj;
      blossom.from_pydata(blossom_verts, [], blossom_faces);
    }
    l_time = time.time() - start_time;
    logger.info(
      `Made ${leaf_index} leaves and ${blossom_index} blossoms in ${l_time} seconds`
    );
    //windman.progress_end();
  }
  make_leaf(leaf, base_leaf_shape, index, verts_array, faces_array) {
    /* get vertices and faces for leaf and append to appropriate arrays */
    var faces, verts;
    [verts, faces] = leaf.get_mesh(
      this.param.leaf_bend,
      base_leaf_shape,
      index
    );
    verts_array.push(...verts);
    faces_array.push(...faces);
  }
  make_stem(
    turtle,
    stem,
    start = 0,
    split_corr_angle = 0,
    num_branches_factor = 1,
    clone_prob = 1,
    pos_corr_turtle = null,
    cloned_turtle = null
  ) {
    /*Generate stem given parameters, as well as all children (branches, splits and leaves) via
          recursion*/

    var base_seg_ind,
      num_of_splits,
      branch_count,
      branches_on_seg,
      branch_num_error,
      curve_res,
      curve_angle,
      d_plus_1,
      depth,
      dif_p,
      f_branches_on_seg,
      f_leaves_on_seg,
      fitting_length,
      hel_axis,
      hel_p_0,
      hel_p_1,
      hel_p_2,
      hel_pitch,
      hel_radius,
      in_pruning_envelope,
      is_base_split,
      leaf_count,
      leaf_num_error,
      leaves_on_seg,
      max_points_per_seg,
      new_point,
      points_per_seg,
      pos,
      prev_point,
      prev_rotation_angle,
      r_state,
      remaining_segs,
      seg_length,
      seg_splits,
      split_err_state,
      start_length,
      tan_ang,
      using_direct_split,
      declination,
      spl_angle,
      spr_angle;

    // if the stem is so thin as to be invisible then don't bother to make it
    if (0 <= stem.radius_limit && stem.radius_limit < 0.0001) {
      return;
    }
    if (this.stem_index % 100 === 0) {
      logger.info(`\r-> ${this.stem_index} stems made`);
    }

    // use level 3 parameters for any depth greater than this
    depth = stem.depth;
    d_plus_1 = depth + 1;
    if (d_plus_1 > 3) {
      d_plus_1 = 3;
    }

    // calc length and radius for this stem (only applies for non clones)
    if (start === 0) {
      stem.length_child_max =
        this.param.length[d_plus_1] +
        random_uniform(-1, 1) * this.param.length_v[d_plus_1];
      stem.length = this.calc_stem_length(stem);
      stem.radius = this.calc_stem_radius(stem);
      if (depth === 0) {
        this.base_length = stem.length * this.param.base_size[0];
      }
    }

    // if the branch origin needs to be repositioned so bevel doesnt sit outside parent
    if (pos_corr_turtle) {
      // pos_corr_turtle currently positioned on circumference so subtract this branch radius
      // to ensure open ends are never visible
      pos_corr_turtle.move(-min(stem.radius, stem.radius_limit));
      turtle.pos = pos_corr_turtle.pos;
    }

    // apply pruning, not required if is a clone, as this will have been tested already
    if (cloned_turtle === null && this.param.prune_ratio > 0) {
      start_length = stem.length;
      r_state = random_getstate();
      split_err_state = copy(this.split_num_error);
      in_pruning_envelope = this.test_stem(
        new CHTurtle(turtle),
        stem,
        start,
        split_corr_angle,
        clone_prob
      );
      while (!in_pruning_envelope) {
        stem.length *= 0.9;
        if (stem.length < 0.15 * start_length) {
          if (this.param.prune_ratio < 1) {
            stem.length = 0;
            break;
          } else {
            return;
          }
        }
        random_setstate(r_state);
        this.split_num_error = split_err_state;
        in_pruning_envelope = this.test_stem(
          new CHTurtle(turtle),
          stem,
          start,
          split_corr_angle,
          clone_prob
        );
      }
      fitting_length = stem.length;
      stem.length =
        start_length * (1 - this.param.prune_ratio) +
        fitting_length * this.param.prune_ratio;
      stem.radius = this.calc_stem_radius(stem);
      random_setstate(r_state);
      this.split_num_error = split_err_state;
    }

    // get parameters
    curve_res = Number.parseInt(this.param.curve_res[depth]);
    seg_splits = this.param.seg_splits[depth];
    seg_length = stem.length / curve_res;

    // calc base segment
    base_seg_ind = ceil(
      this.param.base_size[0] * Number.parseInt(this.param.curve_res[0])
    );

    leaf_count = 0;
    branch_count = 0;

    if (
      depth === this.param.levels - 1 &&
      depth > 0 &&
      this.param.leaf_blos_num !== 0
    ) {
      // calc base leaf count
      leaf_count = this.calc_leaf_count(stem);
      // correct leaf count for start position along stem
      leaf_count *= 1 - start / curve_res;
      //  divide by curve_res to get no per seg
      f_leaves_on_seg = leaf_count / curve_res;
    } else {
      // calc base branch count
      branch_count = this.calc_branch_count(stem);
      // correct branch Count for start position along stem
      branch_count *= 1 - start / curve_res;
      // correct for reduced number on clone branches
      branch_count *= num_branches_factor;
      // divide by curve_res to get no per seg
      f_branches_on_seg = branch_count / curve_res;
    }

    // higher point resolution for flared based
    max_points_per_seg = ceil(max(1.0, 100 / curve_res));

    //  set up FS error values
    branch_num_error = 0;
    leaf_num_error = 0;

    // decide on start rotation for branches/leaves
    // use array to allow other methods to modify the value (otherwise passed by value)
    prev_rotation_angle = [0];
    if (this.param.rotate[d_plus_1] >= 0) {
      // start at random rotation
      prev_rotation_angle[0] = rand_in_range(0, 360);
    } else {
      // on this case prev_rotation_angle used as multiplier to alternate side of branch
      prev_rotation_angle[0] = 1;
    }

    // calc helix parameters if needed
    hel_p_0 = hel_p_1 = hel_p_2 = hel_axis = null;
    if (this.param.curve_v[depth] < 0) {
      tan_ang = tan(radians(90 - abs(this.param.curve_v[depth])));
      hel_pitch = ((2 * stem.length) / curve_res) * rand_in_range(0.8, 1.2);
      hel_radius = ((3 * hel_pitch) / (16 * tan_ang)) * rand_in_range(0.8, 1.2);

      // apply full tropism if not trunk/main branch and horizontal tropism if is
      if (depth > 1) {
        apply_tropism(turtle, this.param.tropism);
      } else {
        apply_tropism(
          turtle,
          new Vector([this.param.tropism[0], this.param.tropism[1], 0])
        );
      }
      [hel_p_0, hel_p_1, hel_p_2, hel_axis] = calc_helix_points(
        turtle,
        hel_radius,
        hel_pitch
      );
    }

    // point resolution for this seg, max_points_per_seg if base, 1 otherwise
    if (depth === 0 || this.param.taper[depth] > 1) {
      points_per_seg = max_points_per_seg;
    } else {
      points_per_seg = 2;
    }

    for (var seg_ind = start; seg_ind < curve_res + 1; seg_ind += 1) {
      remaining_segs = curve_res + 1 - seg_ind;

      // set up next bezier point

      if (this.param.curve_v[depth] < 0) {
        // negative curve_v so helix branch
        pos = turtle.pos;
        if (seg_ind === 0) {
          new_point = stem.curve.bezier_points[0];
          new_point.co = pos.clone();
          new_point.handle_right = hel_p_0.clone().add(pos);
          new_point.handle_left = pos.clone();
        } else {
          stem.curve.bezier_points.add(1);
          new_point = stem.curve.bezier_points[-1];
          if (seg_ind === 1) {
            new_point.co = hel_p_2.clone().add(pos);
            new_point.handle_left = hel_p_1.clone().add(pos);
            new_point.handle_right = new_point.co
              .clone()
              .multiplyScalar(2)
              .sub(new_point.handle_left);
          } else {
            prev_point = stem.curve.bezier_points[-2];
            new_point.co = hel_p_2.clone();
            applyQuaternion(angleQuart(hel_axis, (seg_ind - 1) * pi));
            new_point.co.add(prev_point.co);
            dif_p = hel_p_2.clone().sub(hel_p_1);
            applyQuaternion(angleQuart(hel_axis, (seg_ind - 1) * pi));
            new_point.handle_left = new_point.co.clone().sub(dif_p);
            new_point.handle_right = new_point.co
              .clone()
              .multiplyScalar(2)
              .sub(new_point.handle_left);
          }
        }
        turtle.pos = new_point.co.clone();
        turtle.dir = new_point.handle_right.clone().normalize();
      } else {
        // normal curved branch
        // get/make new point to be modified
        if (seg_ind === start) {
          new_point = stem.curve.bezier_points[0];
        } else {
          turtle.move(seg_length);
          stem.curve.bezier_points.add(1);
          new_point = stem.curve.bezier_points[-1];
        }

        // set position and handles of new point
        // if this is a clone then correct initial direction to match original to make
        // split smoother

        new_point.co = turtle.pos.clone();
        if (cloned_turtle && seg_ind === start) {
          new_point.handle_left = turtle.pos
            .clone()
            .addScaledVector(
              cloned_turtle.dir,
              (-1 * stem.length) / (curve_res * 3)
            );
          new_point.handle_right = turtle.pos
            .clone()
            .addScaledVector(cloned_turtle.dir, stem.length / (curve_res * 3));
        } else {
          new_point.handle_left = turtle.pos
            .clone()
            .addScaledVector(turtle.dir, (-1 * stem.length) / (curve_res * 3));
          new_point.handle_right = turtle.pos
            .clone()
            .addScaledVector(turtle.dir, stem.length / (curve_res * 3));
        }
      }

      // set radius of new point
      let actual_radius = this.radius_at_offset(stem, seg_ind / curve_res);
      new_point.radius = actual_radius;

      if (seg_ind > start) {
        // calc number of splits at this seg (N/A for helix)
        if (this.param.curve_v[depth] >= 0) {
          num_of_splits = 0;
          if (
            this.param.base_splits > 0 &&
            depth === 0 &&
            seg_ind === base_seg_ind
          ) {
            // if base_seg_ind and has base splits then override with base split number
            // take random number of splits up to max of base_splits if negative
            if (this.param.base_splits < 0) {
              num_of_splits = Number.parseInt(
                random_random() * (abs(this.param.base_splits) + 0.5)
              );
            } else {
              num_of_splits = Number.parseInt(this.param.base_splits);
            }
          } else {
            if (
              seg_splits > 0 &&
              seg_ind < curve_res &&
              (depth > 0 || seg_ind > base_seg_ind)
            ) {
              // otherwise get number of splits from seg_splits and use floyd-steinberg to
              // fix non-integer values only clone with probability clone_prob
              if (random_random() <= clone_prob) {
                num_of_splits = Number.parseInt(
                  seg_splits + this.split_num_error[depth]
                );
                this.split_num_error[depth] -= num_of_splits - seg_splits;

                // reduce clone/branch propensity
                clone_prob /= num_of_splits + 1;
                num_branches_factor /= num_of_splits + 1;
                num_branches_factor = max(0.8, num_branches_factor);

                branch_count *= num_branches_factor;
                f_branches_on_seg = branch_count / curve_res;
              }
            }
          }
        }

        // add branches/leaves for this seg
        // if below max level of recursion then draw branches, otherwise draw leaves
        r_state = random_getstate();
        if (abs(branch_count) > 0 && depth < this.param.levels - 1) {
          if (branch_count < 0) {
            // fan branches
            if (seg_ind === curve_res) {
              branches_on_seg = Number.parseInt(branch_count);
            } else {
              branches_on_seg = 0;
            }
          } else {
            // get FS corrected branch number
            branches_on_seg = Number.parseInt(
              f_branches_on_seg + branch_num_error
            );
            branch_num_error -= branches_on_seg - f_branches_on_seg;
          }

          // add branches
          if (abs(branches_on_seg) > 0) {
            this.make_branches(
              turtle,
              stem,
              seg_ind,
              branches_on_seg,
              prev_rotation_angle
            );
          }
        } else {
          if (abs(leaf_count) > 0 && depth > 0) {
            if (leaf_count < 0) {
              if (seg_ind === curve_res) {
                leaves_on_seg = leaf_count;
              } else {
                leaves_on_seg = 0;
              }
            } else {
              leaves_on_seg = Number.parseInt(f_leaves_on_seg + leaf_num_error);
              leaf_num_error -= leaves_on_seg - f_leaves_on_seg;
            }
            if (abs(leaves_on_seg) > 0) {
              this.make_leaves(
                turtle,
                stem,
                seg_ind,
                leaves_on_seg,
                prev_rotation_angle
              );
            }
          }
        }
        random_setstate(r_state);

        if (this.param.curve_v[depth] >= 0) {
          if (num_of_splits > 0) {
            is_base_split =
              this.param.base_splits > 0 &&
              depth === 0 &&
              seg_ind === base_seg_ind;
            using_direct_split = this.param.split_angle[depth] < 0;
            if (using_direct_split) {
              spr_angle =
                abs(this.param.split_angle[depth]) +
                random_uniform(-1, 1) * this.param.split_angle_v[depth];
              spl_angle = 0;
              split_corr_angle = 0;
            } else {
              declination = vectorDeclination(turtle.dir);
              spl_angle =
                this.param.split_angle[depth] +
                random_uniform(-1, 1) * this.param.split_angle_v[depth] -
                declination;
              spl_angle = max(0, spl_angle);
              split_corr_angle = spl_angle / remaining_segs;
              spr_angle = -(
                20 +
                0.75 *
                  (30 + abs(declination - 90) * Math.pow(random_random(), 2))
              );
            }
            r_state = random_getstate();
            this.make_clones(
              turtle,
              seg_ind,
              split_corr_angle,
              num_branches_factor,
              clone_prob,
              stem,
              num_of_splits,
              spl_angle,
              spr_angle,
              is_base_split
            );
            random_setstate(r_state);
            turtle.pitch_down(spl_angle / 2);
            if (!is_base_split && num_of_splits === 1) {
              if (using_direct_split) {
                turtle.turn_right(spr_angle / 2);
              } else {
                turtle.dir.applyQuaternion(
                  angleQuart(new Vector(0, 0, 1), radians(-spr_angle / 2))
                );
                turtle.dir.normalize();
                turtle.right.applyQuaternion(
                  angleQuart(new Vector(0, 0, 1), radians(-spr_angle / 2))
                );
                turtle.right.normalize();
              }
            }
          } else {
            const leftAng =
              (random_uniform(-1, 1) * this.param.bend_v[depth]) / curve_res;
            turtle.turn_left(leftAng);
            curve_angle = this.calc_curve_angle(depth, seg_ind);
            turtle.pitch_down(curve_angle - split_corr_angle);
          }
          if (depth > 1) {
            apply_tropism(turtle, new Vector(this.param.tropism));
          } else {
            apply_tropism(
              turtle,
              new Vector([this.param.tropism[0], this.param.tropism[1], 0])
            );
          }
        }
        if (points_per_seg > 2) {
          this.increase_bezier_point_res(stem, seg_ind, points_per_seg);
        }
      }
    }
    if (points_per_seg > 2) {
      scale_bezier_handles_for_flare(stem, max_points_per_seg);
    }
    this.stem_index += 1;
  }
  test_stem(turtle, stem, start = 0, split_corr_angle = 0, clone_prob = 1) {
    /* Test if stem is inside pruning envelope */
    var _,
      base_seg_ind,
      curve_angle,
      curve_res,
      d_plus_1,
      declination,
      depth,
      hel_axis,
      hel_p_2,
      hel_pitch,
      hel_radius,
      is_base_split,
      num_of_splits,
      pos,
      prev_rotation_angle,
      previous_helix_point,
      remaining_segs,
      seg_length,
      seg_splits,
      spl_angle,
      spr_angle,
      tan_ang,
      using_direct_split;
    depth = stem.depth;
    d_plus_1 = depth + 1;
    if (d_plus_1 > 3) {
      d_plus_1 = 3;
    }
    curve_res = Number.parseInt(this.param.curve_res[depth]);
    seg_splits = this.param.seg_splits[depth];
    seg_length = stem.length / curve_res;
    base_seg_ind = ceil(
      this.param.base_size[0] * Number.parseInt(this.param.curve_res[0])
    );
    prev_rotation_angle = [0];
    if (this.param.rotate[d_plus_1] >= 0) {
      prev_rotation_angle[0] = rand_in_range(0, 360);
      console.log("rand_in_range", prev_rotation_angle[0]);
    } else {
      prev_rotation_angle[0] = 1;
    }
    hel_p_2 = hel_axis = previous_helix_point = null;
    if (this.param.curve_v[depth] < 0) {
      tan_ang = tan(radians(90 - abs(this.param.curve_v[depth])));
      hel_pitch = ((2 * stem.length) / curve_res) * rand_in_range(0.8, 1.2);
      hel_radius = ((3 * hel_pitch) / (16 * tan_ang)) * rand_in_range(0.8, 1.2);
      if (depth > 1) {
        apply_tropism(turtle, this.param.tropism);
      } else {
        apply_tropism(
          turtle,
          new Vector([this.param.tropism[0], this.param.tropism[1], 0])
        );
      }
      [_, _, hel_p_2, hel_axis] = calc_helix_points(
        turtle,
        hel_radius,
        hel_pitch
      );
    }

    for (let seg_ind = start; seg_ind < curve_res + 1; seg_ind += 1) {
      remaining_segs = curve_res + 1 - seg_ind;
      if (this.param.curve_v[depth] < 0) {
        pos = turtle.pos.clone();
        if (seg_ind === 0) {
          turtle.pos = pos;
        } else {
          if (seg_ind === 1) {
            turtle.pos = hel_p_2 + pos;
          } else {
            hel_p_2applyQuaternion(angleQuart(hel_axis, (seg_ind - 1) * pi));
            turtle.pos = hel_p_2 + previous_helix_point;
          }
        }
        previous_helix_point = turtle.pos.clone();
      } else {
        if (seg_ind !== start) {
          turtle.move(seg_length);
          if (
            !(stem.depth === 0 && start < base_seg_ind) &&
            !this.point_inside(turtle.pos)
          ) {
            return false;
          }
        }
      }
      if (seg_ind > start) {
        if (this.param.curve_v[depth] >= 0) {
          num_of_splits = 0;
          if (
            this.param.base_splits > 0 &&
            depth === 0 &&
            seg_ind === base_seg_ind
          ) {
            num_of_splits = Number.parseInt(
              random_random() * (this.param.base_splits + 0.5)
            );
          } else {
            if (
              seg_splits > 0 &&
              seg_ind < curve_res &&
              (depth > 0 || seg_ind > base_seg_ind)
            ) {
              if (random_random() <= clone_prob) {
                num_of_splits = Number.parseInt(
                  seg_splits + this.split_num_error[depth]
                );
                this.split_num_error[depth] -= num_of_splits - seg_splits;
                clone_prob /= num_of_splits + 1;
              }
            }
          }
          if (num_of_splits > 0) {
            is_base_split =
              this.param.base_splits > 0 &&
              depth === 0 &&
              seg_ind === base_seg_ind;
            using_direct_split = this.param.split_angle[depth] < 0;
            if (using_direct_split) {
              spr_angle =
                abs(this.param.split_angle[depth]) +
                random_uniform(-1, 1) * this.param.split_angle_v[depth];
              spl_angle = 0;
              split_corr_angle = 0;
            } else {
              declination = turtle.dir.declination();
              spl_angle =
                this.param.split_angle[depth] +
                random_uniform(-1, 1) * this.param.split_angle_v[depth] -
                declination;
              spl_angle = max(0, spl_angle);
              split_corr_angle = spl_angle / remaining_segs;
              spr_angle = -(
                20 +
                0.75 *
                  (30 + abs(declination - 90) * Math.pow(random_random(), 2))
              );
            }
            turtle.pitch_down(spl_angle / 2);
            if (!is_base_split && num_of_splits === 1) {
              if (using_direct_split) {
                turtle.turn_left(spr_angle / 2);
              } else {
                turtle.dir.applyQuaternion(
                  angleQuart(new Vector(0, 0, 1), radians(-spr_angle / 2))
                );
                turtle.dir.normalize();
                turtle.right.applyQuaternion(
                  angleQuart(new Vector(0, 0, 1), radians(-spr_angle / 2))
                );
                turtle.right.normalize();
              }
            }
          } else {
            turtle.turn_left(
              (random_uniform(-1, 1) * this.param.bend_v[depth]) / curve_res
            );
            curve_angle = this.calc_curve_angle(depth, seg_ind);
            turtle.pitch_down(curve_angle - split_corr_angle);
          }
          if (depth > 1) {
            apply_tropism(turtle, new Vector(this.param.tropism));
          } else {
            apply_tropism(
              turtle,
              new Vector([this.param.tropism[0], this.param.tropism[1], 0])
            );
          }
        }
      }
    }
    return this.point_inside(turtle.pos);
  }
  make_clones(
    turtle,
    seg_ind,
    split_corr_angle,
    num_branches_factor,
    clone_prob,
    stem,
    num_of_splits,
    spl_angle,
    spr_angle,
    is_base_split
  ) {
    /* make clones of branch used if seg_splits or base_splits > 0 */
    var cloned,
      eff_spr_angle,
      n_turtle,
      new_stem,
      quat,
      split_stem,
      stem_depth,
      using_direct_split;
    using_direct_split = this.param.split_angle[stem.depth] < 0;
    stem_depth = this.param.split_angle_v[stem.depth];
    if (!is_base_split && num_of_splits > 2 && using_direct_split) {
      throw new Error("Only splitting up to 3 branches is supported");
    }
    for (
      var split_index = 0, _pj_a = num_of_splits;
      split_index < _pj_a;
      split_index += 1
    ) {
      n_turtle = new CHTurtle(turtle);
      n_turtle.pitch_down(spl_angle / 2);
      if (is_base_split && !using_direct_split) {
        eff_spr_angle =
          (split_index + 1) * (360 / (num_of_splits + 1)) +
          random_uniform(-1, 1) * stem_depth;
      } else {
        if (split_index === 0) {
          eff_spr_angle = spr_angle / 2;
        } else {
          eff_spr_angle = -spr_angle / 2;
        }
      }
      if (using_direct_split) {
        n_turtle.turn_left(eff_spr_angle);
      } else {
        quat = angleQuart(new Vector(0, 0, 1), radians(eff_spr_angle));
        n_turtle.dir.applyQuaternion(quat);
        turtle.dir.normalize();
        n_turtle.right.applyQuaternion(quat);
        turtle.right.normalize();
      }
      split_stem = this.branch_curves[stem.depth].splines.makeNew("BEZIER");
      split_stem.resolution_u = stem.curve.resolution_u;
      split_stem.radius_interpolation = "CARDINAL";
      new_stem = stem.copy();
      new_stem.curve = split_stem;
      if (this.param.split_angle_v[stem.depth] >= 0) {
        cloned = turtle;
      } else {
        cloned = null;
      }

      this.make_stem(
        n_turtle,
        new_stem,
        seg_ind,
        split_corr_angle,
        num_branches_factor,
        clone_prob,
        null,
        cloned
      );
    }
  }
  make_branches(
    turtle,
    stem,
    seg_ind,
    branches_on_seg,
    prev_rotation_angle,
    is_leaves = false
  ) {
    /* Make the required branches for a segment of the stem */
    var base_length,
      branch_dist,
      branch_whorl_error,
      branches_array,
      branches_per_whorl,
      branches_this_whorl,
      curve_res,
      d_plus_1,
      end_point,
      num_of_whorls,
      offset,
      start_point,
      stem_offset;
    start_point = stem.curve.bezier_points[-2];
    end_point = stem.curve.bezier_points[-1];
    branches_array = [];
    d_plus_1 = min(3, stem.depth + 1);
    if (branches_on_seg < 0) {
      for (
        var branch_ind = 0, _pj_a = abs(Number.parseInt(branches_on_seg));
        branch_ind < _pj_a;
        branch_ind += 1
      ) {
        stem_offset = 1;
        branches_array.append(
          this.set_up_branch(
            turtle,
            stem,
            BRANCH_MODE_FAN,
            1,
            start_point,
            end_point,
            stem_offset,
            branch_ind,
            prev_rotation_angle,
            abs(branches_on_seg)
          )
        );
      }
    } else {
      base_length = stem.length * this.param.base_size[stem.depth];
      branch_dist = this.param.branch_dist[d_plus_1];
      curve_res = Number.parseInt(this.param.curve_res[stem.depth]);
      if (branch_dist > 1) {
        num_of_whorls = Number.parseInt(branches_on_seg / (branch_dist + 1));
        branches_per_whorl = branch_dist + 1;
        branch_whorl_error = 0;
        for (
          var whorl_num = 0, _pj_a = num_of_whorls;
          whorl_num < _pj_a;
          whorl_num += 1
        ) {
          offset = min(max(0.0, whorl_num / num_of_whorls), 1.0);
          stem_offset = ((seg_ind - 1 + offset) / curve_res) * stem.length;
          if (stem_offset > base_length) {
            branches_this_whorl = Number.parseInt(
              branches_per_whorl + branch_whorl_error
            );
            branch_whorl_error -= branches_this_whorl - branches_per_whorl;
            for (
              var branch_ind = 0, _pj_b = branches_this_whorl;
              branch_ind < _pj_b;
              branch_ind += 1
            ) {
              branches_array.append(
                this.set_up_branch(
                  turtle,
                  stem,
                  BRANCH_MODE_WHORLED,
                  offset,
                  start_point,
                  end_point,
                  stem_offset,
                  branch_ind,
                  prev_rotation_angle,
                  branches_this_whorl
                )
              );
            }
          }
          prev_rotation_angle[0] += this.param.rotate[d_plus_1];
          console.log("rotated prev_rotation_angle = ", prev_rotation_angle[0]);
        }
      } else {
        for (
          var branch_ind = 0, _pj_a = branches_on_seg;
          branch_ind < _pj_a;
          branch_ind += 1
        ) {
          if (branch_ind % 2 === 0) {
            offset = min(max(0, branch_ind / branches_on_seg), 1);
          } else {
            offset = min(
              max(0, (branch_ind - branch_dist) / branches_on_seg),
              1
            );
          }
          stem_offset = ((seg_ind - 1 + offset) / curve_res) * stem.length;
          if (stem_offset > base_length) {
            branches_array.push(
              this.set_up_branch(
                turtle,
                stem,
                BRANCH_MODE_ALT_OPP,
                offset,
                start_point,
                end_point,
                stem_offset,
                branch_ind,
                prev_rotation_angle
              )
            );
          }
        }
      }
    }

    // make all new branches from branches_array, passing pos_corr_turtle which will be used to
    // set the position of branch_turtle in this call
    if (is_leaves) {
      branches_array.forEach(([pos_tur, dir_tur]) => {
        this.leaves_array.push(
          new Leaf(pos_tur.pos, dir_tur.dir, dir_tur.right)
        );
      });
    } else {
      branches_array.forEach(([pos_tur, dir_tur, rad, b_offset], branchIdx) => {
        const new_spline =
          this.branch_curves[d_plus_1].splines.makeNew("BEZIER");
        new_spline.resolution_u = this.param.curve_res[d_plus_1];
        new_spline.radius_interpolation = "CARDINAL";
        const new_stem = new Stem(d_plus_1, new_spline, stem, b_offset, rad);
        new_stem.name = "depth " + d_plus_1 + " stem, branch nr " + branchIdx;
        this.make_stem(dir_tur, new_stem, 0, 0, 1, 1, pos_tur);
      });
    }
  }
  make_leaves(turtle, stem, seg_ind, leaves_on_seg, prev_rotation_angle) {
    /* Make the required leaves for a segment of the stem */
    this.make_branches(
      turtle,
      stem,
      seg_ind,
      leaves_on_seg,
      prev_rotation_angle,
      true
    );
  }
  set_up_branch(
    turtle,
    stem,
    branch_mode,
    offset,
    start_point,
    end_point,
    stem_offset,
    branch_ind,
    prev_rot_ang,
    branches_in_group = 0
  ) {
    /*Set up a new branch, creating the new direction and position turtle and orienting them
          correctly and adding the required info to the list of branches to be made*/
    var branch_dir_turtle,
      branch_pos_turtle,
      d_angle,
      d_plus_1,
      r_angle,
      radius_limit,
      t_angle;
    d_plus_1 = min(3, stem.depth + 1);
    branch_dir_turtle = make_branch_dir_turtle(
      turtle,
      this.param.curve_v[stem.depth] < 0,
      offset,
      start_point,
      end_point
    );
    if (branch_mode === BRANCH_MODE_FAN) {
      if (branches_in_group === 1) {
        t_angle = 0;
      } else {
        t_angle =
          this.param.rotate[d_plus_1] *
            (branch_ind / (branches_in_group - 1) - 1 / 2) +
          random_uniform(-1, 1) * this.param.rotate_v[d_plus_1];
      }
      branch_dir_turtle.turn_right(t_angle);
      radius_limit = 0;
    } else {
      if (branch_mode === BRANCH_MODE_WHORLED) {
        r_angle =
          prev_rot_ang[0] +
          (360 * branch_ind) / branches_in_group +
          random_uniform(-1, 1) * this.param.rotate_v[d_plus_1];
      } else {
        r_angle = this.calc_rotate_angle(d_plus_1, prev_rot_ang[0]);
        if (this.param.rotate[d_plus_1] >= 0) {
          prev_rot_ang[0] = r_angle;
        } else {
          prev_rot_ang[0] = -prev_rot_ang[0];
        }
      }
      branch_dir_turtle.roll_right(r_angle);
      radius_limit = this.radius_at_offset(stem, stem_offset / stem.length);
    }
    branch_pos_turtle = make_branch_pos_turtle(
      branch_dir_turtle,
      offset,
      start_point,
      end_point,
      radius_limit
    );
    d_angle = this.calc_down_angle(stem, stem_offset);
    branch_dir_turtle.pitch_down(d_angle);
    return [branch_pos_turtle, branch_dir_turtle, radius_limit, stem_offset];
  }
  calc_stem_length(stem) {
    /* Calculate length of this stem as defined in paper */
    var result;
    if (stem.depth === 0) {
      result =
        this.tree_scale *
        (this.param.length[0] + random_uniform(-1, 1) * this.param.length_v[0]);
      this.trunk_length = result;
    } else {
      if (stem.depth === 1) {
        result =
          stem.parent.length *
          stem.parent.length_child_max *
          this.shape_ratio(
            this.param.shape,
            (stem.parent.length - stem.offset) /
              (stem.parent.length - this.base_length)
          );
      } else {
        result =
          stem.parent.length_child_max *
          (stem.parent.length - 0.7 * stem.offset);
      }
    }
    return max(0, result);
  }
  calc_stem_radius(stem) {
    /* Calculate radius of this stem as defined in paper */
    var result;
    if (stem.depth === 0) {
      result = stem.length * this.param.ratio * this.param.radius_mod[0];
    } else {
      result =
        this.param.radius_mod[stem.depth] *
        stem.parent.radius *
        pow(stem.length / stem.parent.length, this.param.ratio_power);
      result = max(0.005, result);
      result = min(stem.radius_limit, result);
    }
    return result;
  }
  calc_curve_angle(depth, seg_ind) {
    /* Calculate curve angle for segment number seg_ind on a stem */
    var curve, curve_angle, curve_back, curve_res, curve_v;
    curve = this.param.curve[depth];
    curve_v = this.param.curve_v[depth];
    curve_back = this.param.curve_back[depth];
    curve_res = Number.parseInt(this.param.curve_res[depth]);
    if (curve_back === 0) {
      curve_angle = curve / curve_res;
    } else {
      if (seg_ind < curve_res / 2.0) {
        curve_angle = curve / (curve_res / 2.0);
      } else {
        curve_angle = curve_back / (curve_res / 2.0);
      }
    }
    curve_angle += random_uniform(-1, 1) * (curve_v / curve_res);
    return curve_angle;
  }
  calc_down_angle(stem, stem_offset) {
    /* calc down angle as defined in paper */
    var d_angle, d_plus_1;
    d_plus_1 = min(stem.depth + 1, 3);
    if (this.param.down_angle_v[d_plus_1] >= 0) {
      d_angle =
        this.param.down_angle[d_plus_1] +
        random_uniform(-1, 1) * this.param.down_angle_v[d_plus_1];
    } else {
      d_angle =
        this.param.down_angle[d_plus_1] +
        this.param.down_angle_v[d_plus_1] *
          (1 -
            2 *
              this.shape_ratio(
                0,
                (stem.length - stem_offset) /
                  (stem.length * (1 - this.param.base_size[stem.depth]))
              ));
      d_angle += random_uniform(-1, 1) * abs(d_angle * 0.1);
    }
    return d_angle;
  }
  calc_rotate_angle(depth, prev_angle) {
    /* calc rotate angle as defined in paper, limit to 0-360 */
    var r_angle;
    if (this.param.rotate[depth] >= 0) {
      r_angle =
        (prev_angle +
          this.param.rotate[depth] +
          random_uniform(-1, 1) * this.param.rotate_v[depth]) %
        360;
    } else {
      r_angle =
        prev_angle *
        (180 +
          this.param.rotate[depth] +
          random_uniform(-1, 1) * this.param.rotate_v[depth]);
    }
    return r_angle;
  }
  calc_leaf_count(stem) {
    /* Calculate leaf count of this stem as defined in paper */
    var leaves, result;
    if (this.param.leaf_blos_num >= 0) {
      leaves =
        (this.param.leaf_blos_num * this.tree_scale) / this.param.g_scale;
      result =
        leaves *
        (stem.length / (stem.parent.length_child_max * stem.parent.length));
    } else {
      return this.param.leaf_blos_num;
    }
    return result;
  }
  calc_branch_count(stem) {
    /* Calculate branch count of this stem as defined in paper */
    var d_p_1, result;
    d_p_1 = min(stem.depth + 1, 3);
    if (stem.depth === 0) {
      result = this.param.branches[d_p_1] * (random_random() * 0.2 + 0.9);
    } else {
      if (this.param.branches[d_p_1] < 0) {
        result = this.param.branches[d_p_1];
      } else {
        if (stem.depth === 1) {
          result =
            this.param.branches[d_p_1] *
            (0.2 +
              (0.8 * (stem.length / stem.parent.length)) /
                stem.parent.length_child_max);
        } else {
          result =
            this.param.branches[d_p_1] *
            (1.0 - (0.5 * stem.offset) / stem.parent.length);
        }
      }
    }
    return result / (1 - this.param.base_size[stem.depth]);
  }
  shape_ratio(shape, ratio) {
    /* Calculate shape ratio as defined in paper */
    var result;
    if (shape === 1) {
      result = 0.2 + 0.8 * sin(pi * ratio);
    } else {
      if (shape === 2) {
        result = 0.2 + 0.8 * sin(0.5 * pi * ratio);
      } else {
        if (shape === 3) {
          result = 1.0;
        } else {
          if (shape === 4) {
            result = 0.5 + 0.5 * ratio;
          } else {
            if (shape === 5) {
              if (ratio <= 0.7) {
                result = ratio / 0.7;
              } else {
                result = (1.0 - ratio) / 0.3;
              }
            } else {
              if (shape === 6) {
                result = 1.0 - 0.8 * ratio;
              } else {
                if (shape === 7) {
                  if (ratio <= 0.7) {
                    result = 0.5 + (0.5 * ratio) / 0.7;
                  } else {
                    result = 0.5 + (0.5 * (1.0 - ratio)) / 0.3;
                  }
                } else {
                  if (shape === 8) {
                    if (ratio < 0 || ratio > 1) {
                      result = 0.0;
                    } else {
                      if (ratio < 1 - this.param.prune_width_peak) {
                        result = pow(
                          ratio / (1 - this.param.prune_width_peak),
                          this.param.prune_power_high
                        );
                      } else {
                        result = pow(
                          (1 - ratio) / (1 - this.param.prune_width_peak),
                          this.param.prune_power_low
                        );
                      }
                    }
                  } else {
                    result = 0.2 + 0.8 * ratio;
                  }
                }
              }
            }
          }
        }
      }
    }
    return result;
  }
  radius_at_offset(stem, z_1) {
    /*  calculate radius of stem at offset z_1 along it  */
    var depth, flare, n_taper, radius, taper, unit_taper, y_val, z_2, z_3;
    n_taper = this.param.taper[stem.depth];
    if (n_taper < 1) {
      unit_taper = n_taper;
    } else {
      if (n_taper < 2) {
        unit_taper = 2 - n_taper;
      } else {
        unit_taper = 0;
      }
    }
    taper = stem.radius * (1 - unit_taper * z_1);
    if (n_taper < 1) {
      radius = taper;
    } else {
      z_2 = (1 - z_1) * stem.length;
      if (n_taper < 2 || z_2 < taper) {
        depth = 1;
      } else {
        depth = n_taper - 2;
      }
      if (n_taper < 2) {
        z_3 = z_2;
      } else {
        z_3 = abs(z_2 - 2 * taper * Number.parseInt(z_2 / (2 * taper) + 0.5));
      }
      if (n_taper < 2 && z_3 >= taper) {
        radius = taper;
      } else {
        radius =
          (1 - depth) * taper +
          depth * sqrt(pow(taper, 2) - pow(z_3 - taper, 2));
      }
    }
    if (stem.depth === 0) {
      y_val = max(0, 1 - 8 * z_1);
      flare = this.param.flare * ((pow(100, y_val) - 1) / 100) + 1;
      radius *= flare;
    }
    return radius;
  }
  increase_bezier_point_res(stem, seg_ind, points_per_seg) {
    return;
    /* add in new points in appropriate positions along curve and modify radius for flare */
    var curr_point,
      curve_res,
      dir_vec_mag,
      end_point,
      offset,
      seg_end_point,
      seg_start_point,
      start_point,
      tangent;
    curve_res = Number.parseInt(this.param.curve_res[stem.depth]);
    seg_end_point = stem.curve.bezier_points[-1];
    // FakeSplinePoint = namedtuple("FakeSplinePoint", ["co", "handle_left", "handle_right"]);
    class FakeSplinePoint {
      constructor(co, handle_left, handle_right) {
        this.co = co;
        this.handle_left = handle_left;
        this.handle_right = handle_right;
      }
    }
    end_point = new FakeSplinePoint(
      seg_end_point.co.clone(),
      seg_end_point.handle_left.clone(),
      seg_end_point.handle_right.clone()
    );
    seg_start_point = stem.curve.bezier_points[-2];

    start_point = new FakeSplinePoint(
      seg_start_point.co.clone(),
      seg_start_point.handle_left.clone(),
      seg_start_point.handle_right.clone()
    );
    for (var k = 0, _pj_a = points_per_seg; k < _pj_a; k += 1) {
      offset = k / (points_per_seg - 1);
      if (k === 0) {
        curr_point = seg_start_point;
      } else {
        if (k === 1) {
          curr_point = seg_end_point;
        } else {
          stem.curve.bezier_points.add(1);
          curr_point = stem.curve.bezier_points[-1];
        }
        if (k === points_per_seg - 1) {
          curr_point.co = end_point.co;
          curr_point.handle_left = end_point.handle_left;
          curr_point.handle_right = end_point.handle_right;
        } else {
          curr_point.co = calc_point_on_bezier(offset, start_point, end_point);
          tangent = calc_tangent_to_bezier(
            offset,
            start_point,
            end_point
          ).normalize();
          dir_vec_mag = end_point.handle_left
            .clone()
            .sub(end_point.co)
            .length();
          //curr_point.handle_left = (curr_point.co - (tangent * dir_vec_mag));
          curr_point.handle_left = curr_point.co
            .clone()
            .addScaledVector(tangent, -1 * dir_vec_mag);
          //curr_point.handle_right = (curr_point.co + (tangent * dir_vec_mag));
          curr_point.handle_right = curr_point.co
            .clone()
            .addScaledVector(tangent, dir_vec_mag);
        }
      }
      curr_point.radius = this.radius_at_offset(
        stem,
        (offset + seg_ind - 1) / curve_res
      );
    }
  }
  point_inside(point) {
    /* Check if point == inside pruning envelope, from WP 4.6 */
    var dist, inside, ratio;
    dist = sqrt(Math.pow(point.x, 2) + Math.pow(point.y, 2));
    ratio =
      (this.tree_scale - point.z) /
      (this.tree_scale * (1 - this.param.base_size[0]));
    inside =
      dist / this.tree_scale <
      this.param.prune_width * this.shape_ratio(8, ratio);
    return inside;
  }
}

/* Apply tropism_vector to turtle direction */
export function apply_tropism(turtle, tropism_vector) {
  const h_cross_t = turtle.dir.clone().cross(tropism_vector);
  const alpha = 10 * h_cross_t.length();
  if (alpha === 0) return;
  h_cross_t.normalize();
  turtle.dir.applyQuaternion(angleQuart(h_cross_t, radians(alpha)));
  turtle.dir.normalize();
  turtle.right.applyQuaternion(angleQuart(h_cross_t, radians(alpha)));
  turtle.right.normalize();
}
