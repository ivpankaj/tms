async function test() {
  const res = await fetch('http://localhost:3000/settings');
  const text = await res.text();
  console.log('HTML size:', text.length);
}
test();
