export class BezierPoint {
  //Coordinates of the control point vector3
  co;

  // Coordinates of the first handle vector3
  handle_left;

  // Handle types
  // enum in [‘FREE’, ‘VECTOR’, ‘ALIGNED’, ‘AUTO’], default ‘FREE’
  handle_left_type = "FREE";

  // Coordinates of the second handle vector3
  handle_right;

  // Handle types
  // enum in [‘FREE’, ‘VECTOR’, ‘ALIGNED’, ‘AUTO’], default ‘FREE’
  handle_right_type = "FREE";

  // Radius for beveling (float)
  radius = 0;
}
