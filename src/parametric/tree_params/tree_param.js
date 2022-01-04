/*  Default tree parameters  */
const defaults = {
  shape: 7,
  g_scale: 13,
  g_scale_v: 3,
  levels: 3,
  ratio: 0.015,
  ratio_power: 1.2,
  flare: 0.6,
  base_splits: 0,
  base_size: [0.3, 0.02, 0.02, 0.02],
  down_angle: [-0, 60, 45, 45],
  down_angle_v: [-0, -50, 10, 10],
  rotate: [-0, 140, 140, 77],
  rotate_v: [-0, 0, 0, 0],
  branches: [1, 50, 30, 10],
  length: [1, 0.3, 0.6, 0],
  length_v: [0, 0, 0, 0],
  taper: [1, 1, 1, 1],
  seg_splits: [0, 0, 0, 0],
  split_angle: [40, 0, 0, 0],
  split_angle_v: [5, 0, 0, 0],
  bevel_res: [10, 10, 10, 10],
  curve_res: [5, 5, 3, 1],
  curve: [0, -40, -40, 0],
  curve_back: [0, 0, 0, 0],
  curve_v: [20, 50, 75, 0],
  bend_v: [-0, 50, 0, 0],
  branch_dist: [-0, 0, 0, 0],
  radius_mod: [1, 1, 1, 1],
  leaf_blos_num: 40,
  leaf_shape: 0,
  leaf_scale: 0.17,
  leaf_scale_x: 1,
  leaf_bend: 0.6,
  blossom_shape: 1,
  blossom_scale: 0,
  blossom_rate: 0,
  tropism: [0, 0, 0.5],
  prune_ratio: 0,
  prune_width: 0.5,
  prune_width_peak: 0.5,
  prune_power_low: 0.5,
  prune_power_high: 0.5,
};

export class TreeParam {
  /* parameter list for default tree (aspen) */
  constructor(params) {
    /* initialize parameters from dictionary representation */
    Object.entries({
      ...defaults,
      ...params,
    }).forEach(([key, value]) => (this[key] = value));
  }
}
