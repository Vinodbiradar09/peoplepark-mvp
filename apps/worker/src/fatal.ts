export function fatal(err: unknown): never {
  console.error("bootstrap failure", err);
  process.exit(1);
}
