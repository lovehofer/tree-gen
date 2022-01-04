const {atan2, pi}  = Math;
import {Vector} from './chturtle';
import {Quaternion} from 'three';
import * as leaf_geom from './leaf_shapes';
import { angleQuart } from './parametric/vector-algebra';
var _pj;
function _pj_snippets(container) {
    function set_properties(cls, props) {
        var desc, value;
        var _pj_a = props;
        for (var p in _pj_a) {
            if (_pj_a.hasOwnProperty(p)) {
                value = props[p];
                if (((((! ((value instanceof Map) || (value instanceof WeakMap))) && (value instanceof Object)) && ("get" in value)) && (value.get instanceof Function))) {
                    desc = value;
                } else {
                    desc = {"value": value, "enumerable": false, "configurable": true, "writable": true};
                }
                Object.defineProperty(cls.prototype, p, desc);
            }
        }
    }
    container["set_properties"] = set_properties;
    return container;
}
_pj = {};
_pj_snippets(_pj);
/* Leaf module shared by L-System and Parametric tree generators */
export class Leaf {
    /* Class to store data for each leaf in the system */
    constructor(pos, direction, right) {
        /* Init method for leaf with position, direction and relative x axis */
        this.position = pos;
        this.direction = direction;
        this.right = right;
    }
    get_shape(cls, leaf_type, g_scale, scale, scale_x) {
        /* returns the base leaf shape mesh */
        var faces, shape, u_v, verts;
        u_v = [];
        if ((leaf_type < 0)) {
            if ((leaf_type < (- 3))) {
                leaf_type = (- 1);
            }
            shape = leaf_geom.blossom(abs((leaf_type + 1)));
        } else {
            if (((leaf_type < 1) || (leaf_type > 10))) {
                leaf_type = 8;
            }
            shape = leaf_geom.leaves((leaf_type - 1));
        }
        verts = shape[0];
        faces = shape[1];
        if ((shape.length === 3)) {
            u_v = shape[2];
        }
        for (var vert, _pj_c = 0, _pj_a = verts, _pj_b = _pj_a.length; (_pj_c < _pj_b); _pj_c += 1) {
            vert = _pj_a[_pj_c];
            vert *= (scale * g_scale);
            vert.x *= scale_x;
        }
        return [verts, faces, u_v];
    }
    get_mesh(bend, base_shape, index) {
        /* produce leaf mesh at position of this leaf given base mesh as input */
        var bend_trf_1, bend_trf_2, faces, n_vertex, right_t, spin_ang, spin_ang_quat, trf, vertices;
        trf = this.direction.to_track_quat("Z", "Y");
        right_t = this.right.rotated(trf.inverted());
        spin_ang = (pi - right_t.angle(new Vector([1, 0, 0])));
        spin_ang_quat = angleQuart(new Vector(0, 0, 1), spin_ang);
        if ((bend > 0)) {
            [bend_trf_1, bend_trf_2] = this.calc_bend_trf(bend);
        } else {
            bend_trf_1 = null;
        }
        vertices = [];
        for (var vertex, _pj_c = 0, _pj_a = base_shape[0], _pj_b = _pj_a.length; (_pj_c < _pj_b); _pj_c += 1) {
            vertex = _pj_a[_pj_c];
            n_vertex = vertex.copy();
            n_vertex.rotate(spin_ang_quat);
            n_vertex.rotate(trf);
            if ((bend > 0)) {
                n_vertex.rotate(bend_trf_1);
            }
            n_vertex += this.position;
            vertices.append(n_vertex);
        }
        index *= vertices.length;
        faces = function () {
    var _pj_a = [], _pj_b = base_shape[1];
    for (var _pj_c = 0, _pj_d = _pj_b.length; (_pj_c < _pj_d); _pj_c += 1) {
        var face = _pj_b[_pj_c];
        _pj_a.push(function () {
    var _pj_e = [], _pj_f = face;
    for (var _pj_g = 0, _pj_h = _pj_f.length; (_pj_g < _pj_h); _pj_g += 1) {
        var elem = _pj_f[_pj_g];
        _pj_e.push((elem + index));
    }
    return _pj_e;
}
.call(this));
    }
    return _pj_a;
}
.call(this);
        return [vertices, faces];
    }
    calc_bend_trf(bend) {
        /* calculate the transformations required to 'bend' the leaf out/up from WP */
        var bend_trf_1, bend_trf_2, normal, phi_bend, theta_bend, theta_pos;
        normal = this.direction.clone().cross(this.right);
        theta_pos = atan2(this.position.y, this.position.x);
        theta_bend = (theta_pos - atan2(normal.y, normal.x));
        bend_trf_1 = angleQuart(new Vector(0, 0, 1), (theta_bend * bend));
        this.direction.rotate(bend_trf_1);
        this.right.rotate(bend_trf_1);
        normal = this.direction.clone().cross(this.right);
        phi_bend = normal.declination();
        if ((phi_bend > (pi / 2))) {
            phi_bend = (phi_bend - pi);
        }
        bend_trf_2 = angleQuart(this.right, (phi_bend * bend));
        return [bend_trf_1, bend_trf_2];
    }
}
_pj.set_properties(Leaf, {"__slots__": ["position", "direction", "right"]});