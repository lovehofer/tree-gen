export const random = { seed: () => null };
export const random_random = () => Math.random();
export const random_uniform = (min, max) => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
};
export const random_getstate = () => 1;
export const random_setstate = (s) => null;
export function rand_in_range(lower, upper) {
  /* Generate random number between lower and upper */
  return random_random() * (upper - lower) + lower;
}
