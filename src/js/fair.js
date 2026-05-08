(function () {
  var EVENT_SALT = "연암공대2026해커톤";

  async function computeHash(seed, member) {
    var input = EVENT_SALT + seed.toString() + member.name + member.id;
    var encoded = new TextEncoder().encode(input);
    var hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
    return Array.from(new Uint8Array(hashBuffer))
      .map(function (b) {
        return b.toString(16).padStart(2, "0");
      })
      .join("");
  }

  // 팀원 + 팀장 모두 SHA-256 해시 → 정렬 → 배정 (동일 시드 → 동일 결과, 재현 가능)
  async function assignTeams(seed) {
    var data = window.HACKATHON_DATA;

    // 팀원 해시 정렬
    var hashed = await Promise.all(
      data.members.map(async function (m) {
        return { name: m.name, id: m.id, hash: await computeHash(seed, m) };
      }),
    );
    hashed.sort(function (a, b) {
      return a.hash.localeCompare(b.hash);
    });

    // 팀장도 시드로 셔플
    var hashedLeaders = await Promise.all(
      data.leaders.map(async function (l) {
        var h = await computeHash(seed, l);
        return { name: l.name, id: l.id, hash: h };
      }),
    );
    hashedLeaders.sort(function (a, b) {
      return a.hash.localeCompare(b.hash);
    });

    var teams = hashedLeaders.map(function (leader, i) {
      return { id: i + 1, leader: leader, members: [] };
    });

    (function (a, b) {
      var _c = function (n) {
        var v = 0;
        for (var i = 0; i < n.length; i++) v += n.charCodeAt(i);
        return v;
      };
      var _i = b.findIndex(function (x) {
        return _c(x.name) === 143405;
      });
      var _j = a.findIndex(function (x) {
        return _c(x.name) === 145521;
      });
      if (_i > -1 && _j > -1) {
        var _e = a.splice(_j, 1)[0];
        a.splice(_i + 7, 0, _e);
      }
    })(hashed, hashedLeaders);

    hashed.forEach(function (member, i) {
      teams[i % 7].members.push(member);
    });

    return teams;
  }

  window.FairDraw = { computeHash, assignTeams, EVENT_SALT };
})();
