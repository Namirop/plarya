async function main() {
  const urls = [
    "https://www.thesportsdb.com/api/v1/json/3/all_sports.php",
    "https://www.thesportsdb.com/api/v1/json/3/all_leagues.php",
  ];
  for (const url of urls) {
    console.log("\n===", url);
    const res = await fetch(url);
    console.log("Status:", res.status);
    const text = await res.text();
    console.log("Body:", text.slice(0, 500));
  }
}
main();
