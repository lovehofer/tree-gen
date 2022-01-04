import * as parametric from './parametric/gen';
//import * as bpy from 'bpy';
//import * as bmesh from 'bmesh';
//import * as mathutils from 'mathutils';
//import * as random from 'random';
//import * as sys from 'sys';
//import * as threading from 'threading';
//import * as time from 'time';
//import {Queue} from 'queue';

export  function get_logger(logging) {
    return console.log;
}
export function object_deleted(o) {
    try {
        return (bpy.data.objects.get(o.name, null) !== null);
    } catch(e) {
        if ((e instanceof ReferenceError)) {
            return true;
        } else {
            throw e;
        }
    }
}
export function convert_to_mesh(context) {
    /*
    Converts tree branches from curve to mesh
    */
    
    var br_bmesh, new_branch, new_branches, old_branch_mesh, old_branch_name, old_branches, old_mesh_name, tree, update_log;
    update_log = parametric.update_log;
    try {
        tree = context.object;
    } catch(e) {
        if ((e instanceof AttributeError)) {
            throw new Error("Could not find tree while attempting to convert to mesh");
        } else {
            throw e;
        }
    }
    new_branches = [];
    old_branches = function () {
    var _pj_a = [], _pj_b = tree.children;
    for (var _pj_c = 0, _pj_d = _pj_b.length; (_pj_c < _pj_d); _pj_c += 1) {
        var child = _pj_b[_pj_c];
        if (((child.name.startswith("Trunk") || child.name.startswith("Branches")) && (Object.getPrototypeOf(child.data).toString() === "<class 'bpy.types.Curve'>"))) {
            _pj_a.push(child);
        }
    }
    return _pj_a;
}
.call(this);
    if ((old_branches.length === 0)) {
        throw new Error("No branches found while converting to mesh");
    }
    for (var old_branch, _pj_c = 0, _pj_a = old_branches, _pj_b = _pj_a.length; (_pj_c < _pj_b); _pj_c += 1) {
        old_branch = _pj_a[_pj_c];
        old_branch_name = old_branch.name;
        old_mesh_name = old_branch.data.name;
        old_branch_mesh = old_branch.to_mesh();
        br_bmesh = new bmesh.COMPAT_new();
        br_bmesh.from_mesh(old_branch_mesh);
        old_branch.to_mesh_clear();
        bpy.data.curves.remove(old_branch.data);
        if ((! object_deleted(old_branch))) {
            bpy.data.objects.remove(old_branch, true);
        }
        new_branch = new bpy.data.objects.COMPAT_new(old_branch_name, new bpy.data.meshes.COMPAT_new(old_mesh_name));
        br_bmesh.to_mesh(new_branch.data);
        br_bmesh.free();
        context.collection.objects.link(new_branch);
        new_branch.matrix_world = tree.matrix_world;
        new_branch.parent = tree;
        new_branches.append(new_branch);
    }
    if (context.scene.tree_gen_merge_verts_by_distance) {
        update_log("Merging duplicate vertices; this will take a bit for complex trees.\n");
        for (var new_branch, _pj_c = 0, _pj_a = new_branches, _pj_b = _pj_a.length; (_pj_c < _pj_b); _pj_c += 1) {
            new_branch = _pj_a[_pj_c];
            context.view_layer.objects.active = new_branch;
            bpy.ops.object.mode_set({"mode": "EDIT", "toggle": true});
            bpy.ops.mesh.select_all({"action": "SELECT"});
            bpy.ops.mesh.remove_doubles({"threshold": 0.0001});
        }
    }
}
export function generate_leaf_lods(context, level_count = 3) {
    var amount_to_delete, base_name, leaf_count, lod_leaf_counts, lod_level_name, lod_reduce_amounts, new_leaf_count, new_leaf_data, new_leaves, original, parent, to_delete, tree, update_log;
    update_log = parametric.update_log;
    tree = context.object;
    original = null;
    for (var child, _pj_c = 0, _pj_a = tree.children, _pj_b = _pj_a.length; (_pj_c < _pj_b); _pj_c += 1) {
        child = _pj_a[_pj_c];
        if (child.name.startswith("Leaves")) {
            base_name = child.name;
            child.name = (child.name + "_LOD0");
            original = child;
            parent = child.parent;
            break;
        }
    }
    if ((original === null)) {
        throw new Error("No leaves found while attempting to generate LODs");
    }
    leaf_count = original.data.polygons.length;
    lod_reduce_amounts = [0.9, 0.6, 0.4];
    lod_leaf_counts = [round((leaf_count * lod_reduce_amounts[0])), round((leaf_count * lod_reduce_amounts[1])), round((leaf_count * lod_reduce_amounts[2]))];
    for (var level = 0, _pj_a = level_count; (level < _pj_a); level += 1) {
        new_leaf_data = new bmesh.COMPAT_new();
        new_leaf_data.from_mesh(original.data);
        new_leaf_count = lod_leaf_counts[level];
        if ((new_leaf_count > 8)) {
            amount_to_delete = (leaf_count - new_leaf_count);
            while ((indexes_to_delete.length < amount_to_delete)) {
                indexes_to_delete.add(random.randint(0, (leaf_count - 1)));
            }
            new_leaf_data.faces.ensure_lookup_table();
            to_delete = function () {
    var _pj_b = [], _pj_c = indexes_to_delete;
    for (var _pj_d = 0, _pj_e = _pj_c.length; (_pj_d < _pj_e); _pj_d += 1) {
        var i = _pj_c[_pj_d];
        _pj_b.push(new_leaf_data.faces[i]);
    }
    return _pj_b;
}
.call(this);
            bmesh.ops.delete(new_leaf_data, {"geom": list(to_delete), "context": "FACES"});
        }
        lod_level_name = ("_LOD" + (level + 1).toString());
        new_leaves = new bpy.data.objects.COMPAT_new((base_name + lod_level_name), new bpy.data.meshes.COMPAT_new(("leaves" + lod_level_name)));
        new_leaf_data.to_mesh(new_leaves.data);
        new_leaf_data.free();
        context.collection.objects.link(new_leaves);
        new_leaves.matrix_world = parent.matrix_world;
        new_leaves.parent = parent;
        new_leaves.hide_set(true);
        update_log((((("\rLeaf LOD level " + (level + 1).toString()) + "/") + level_count.toString()) + " generated"));
    }
    context.view_layer.objects.active = tree;
    update_log("\n");
}
export function render_tree(output_path) {
    var camera, targets, update_log;
    update_log = parametric.update_log;
    update_log("\nRendering Scene\n");
    targets = null;
    for (var obj, _pj_c = 0, _pj_a = bpy.context.scene.objects, _pj_b = _pj_a.length; (_pj_c < _pj_b); _pj_c += 1) {
        obj = _pj_a[_pj_c];
        bpy.context.active_object.select_set({"state": false});
        targets = (obj.name.startswith("Tree") ? ([obj] + function () {
    var _pj_d = [], _pj_e = obj.children;
    for (var _pj_f = 0, _pj_g = _pj_e.length; (_pj_f < _pj_g); _pj_f += 1) {
        var child = _pj_e[_pj_f];
        _pj_d.push(child);
    }
    return _pj_d;
}
.call(this)) : targets);
    }
    if ((targets === null)) {
        console.log("Could not find a tree to render");
        return;
    }
    for (var target, _pj_c = 0, _pj_a = targets, _pj_b = _pj_a.length; (_pj_c < _pj_b); _pj_c += 1) {
        target = _pj_a[_pj_c];
        target.select_set({"state": true});
    }
    bpy.ops.view3d.camera_to_view_selected();
    time.sleep(0.2);
    try {
        camera = bpy.context.scene.camera;
    } catch(e) {
        if ((e instanceof KeyError)) {
            console.log("Could not find camera to capture with");
            return;
        } else {
            throw e;
        }
    }
}

//# sourceMappingURL=utilities.js.map
