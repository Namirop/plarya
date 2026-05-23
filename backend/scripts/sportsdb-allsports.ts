async function main() {
  const url = "https://www.thesportsdb.com/api/v1/json/3/all_sports.php";
  const res = await fetch(url);
  const data = (await res.json()) as { sports: Array<{ strSport: string; strFormat: string }> };
  for (const s of data.sports) {
    console.log(`${s.strSport.padEnd(25)} (${s.strFormat})`);
  }
}
main();
