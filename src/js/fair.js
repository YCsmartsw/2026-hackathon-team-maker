(function () {
  var EVENT_SALT = "연암공대2026해커톤";
  var TEAM_COUNT = 7;

  async function computeHash(seed, person) {
    var input = EVENT_SALT + seed.toString() + person.name + person.id;
    var encoded = new TextEncoder().encode(input);
    var hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
    return Array.from(new Uint8Array(hashBuffer))
      .map(function (b) {
        return b.toString(16).padStart(2, "0");
      })
      .join("");
  }

  // 36명 전원 SHA-256 해시 → 정렬 → 7팀 라운드로빈 배정 (동일 시드 → 동일 결과)
  async function assignTeams(seed) {
    var data = window.HACKATHON_DATA;

    var hashed = await Promise.all(
      data.people.map(async function (p) {
        return { name: p.name, id: p.id, hash: await computeHash(seed, p) };
      }),
    );
    hashed.sort(function (a, b) {
      return a.hash.localeCompare(b.hash);
    });

    var teams = [];
    for (var t = 0; t < TEAM_COUNT; t++) {
      teams.push({ id: t + 1, members: [] });
    }
    hashed.forEach(function (member, i) {
      teams[i % TEAM_COUNT].members.push(member);
    });

    return teams;
  }

  window.FairDraw = { computeHash, assignTeams, EVENT_SALT, TEAM_COUNT };
})();
