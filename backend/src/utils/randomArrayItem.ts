export default function randomArrayItem(arr: Array<any>) {
  return arr[Math.floor(Math.random() * arr.length)];
}
