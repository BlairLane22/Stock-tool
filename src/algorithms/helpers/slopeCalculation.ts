// Returns the slope over a certain amount of days
function checkSlope(list: number[], days: number): number {
  let sum = 0;
  const num = list.length;
  for (let c = num - days; c < num; c++) {
    if (list[c] > list[c - 1]) {
      sum += list[c] - list[c - 1];
    } else {
      sum -= list[c - 1] - list[c];
    }
  }

  return sum / list.length;
}

export { checkSlope };
