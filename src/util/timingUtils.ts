export async function wait(duration: number) {
  return new Promise(r => setTimeout(r, duration));
}
