const startTime = new Date();

export function exit(code = 0): void {
  const duration = (
    (new Date().valueOf() - startTime.valueOf()) /
    1000
  ).toFixed(2);
  console.log(`Ran in ${duration}s`);
  process.exit(code);
}
