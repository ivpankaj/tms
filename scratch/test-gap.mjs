async function check() {
  const res = await fetch('http://localhost:3000/settings');
  const html = await res.text();
  const cssMatches = [...html.matchAll(/href="([^"]+\.css[^"]*)"/g)].map(m => m[1]);
  console.log('CSS links:', cssMatches);
  for (const url of cssMatches) {
    const fullUrl = url.startsWith('http') ? url : `http://localhost:3000${url}`;
    const cssRes = await fetch(fullUrl);
    const css = await cssRes.text();
    console.log(`Checking ${url}: length = ${css.length}`);
    const hasHidden = css.includes('[hidden]');
    console.log(`Has [hidden] rule?`, hasHidden);
    if (hasHidden) {
      const match = css.match(/\[hidden\][^{]*\{[^}]+\}/g);
      console.log('Matches:', match);
    }
  }
}
check();
