const $ = (sel:string) => document.querySelector(sel);

export default function graph(user:object, repos:any[]) {
  const root = $('#root');
  if (root) {
    root.innerHTML = '';
  }
}