import { Quaternion } from "three";
import { CHTurtle } from "../chturtle";
import { angleQuart, calc_point_on_bezier, calc_tangent_to_bezier } from "./vector-algebra";
const degrees = function radians_to_degrees(input_radians)
{
  return input_radians * (180/Math.PI);
}
const radians = function degrees_to_radians(input_degrees)
{
  return input_degrees * (Math.PI/180);
}

/*Create and setup the turtle for the position of a new branch, also returning the radius
    of the parent to use as a limit for the child*/
export function make_branch_pos_turtle(dir_turtle, offset, start_point, end_point, radius_limit) {
    var branch_pos_turtle;
    dir_turtle.pos = calc_point_on_bezier(offset, start_point, end_point);
    branch_pos_turtle = new CHTurtle(dir_turtle);
    branch_pos_turtle.pitch_down(90);
    branch_pos_turtle.move(radius_limit);
    return branch_pos_turtle;
}

/* Create and setup the turtle for the direction of a new branch */
export function make_branch_dir_turtle(turtle, helix, offset, start_point, end_point) {
    var branch_dir_turtle, tan_d, tangent;
    branch_dir_turtle = new CHTurtle();
    tangent = calc_tangent_to_bezier(offset, start_point, end_point);
    
    tangent.normalize();
    if(tangent.length() === 0) {
        debugger;
    }
    branch_dir_turtle.dir = tangent;
    if (helix) {
        tan_d = calc_tangent_to_bezier((offset + 0.0001), start_point, end_point).normalize();
        branch_dir_turtle.right = branch_dir_turtle.dir.clone().cross(tan_d);
    } else {
        branch_dir_turtle.right = turtle.dir.clone().cross(turtle.right).cross(branch_dir_turtle.dir);
    }
    return branch_dir_turtle;
}

/* Apply tropism_vector to turtle direction */
export  function apply_tropism(turtle, tropism_vector) {
    var alpha, h_cross_t;
    h_cross_t = turtle.dir.clone().cross(tropism_vector);
    alpha = (10 * h_cross_t.length());
    if(alpha===0) return;
    h_cross_t.normalize();    
    turtle.dir.applyQuaternion(angleQuart(h_cross_t, radians(alpha)));
    turtle.dir.normalize();
    turtle.right.applyQuaternion(angleQuart(h_cross_t, radians(alpha)));
    turtle.right.normalize();
}