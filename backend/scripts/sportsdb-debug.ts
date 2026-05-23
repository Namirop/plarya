async function main() {
  const url = "https://www.thesportsdb.com/api/v1/json/3/search_all_leagues.php?s=Tennis";
  const res = await fetch(url);
  console.log("Status:", res.status);
  const text = await res.text();
  console.log("Body (first 800 chars):", text.slice(0, 800));
}
main();
