$(async function () {
  var COLORS = Animator.TEAM_COLORS;

  async function runVerify(seedStr) {
    var seed = parseInt(seedStr, 10);
    if (!seedStr || isNaN(seed) || seed <= 0) {
      $("#seed-error").text("유효한 시드값(양의 정수)을 입력해주세요.").show();
      return;
    }
    $("#seed-error").hide();
    $("#verify-btn").prop("disabled", true).text("계산 중…");

    var teams = await FairDraw.assignTeams(seed);

    $("#result-banner")
      .html(
        "시드 <code style=\"font-family:'JetBrains Mono',monospace;color:#C30034\">" +
          seed +
          "</code> 로 재현된 결과입니다. " +
          '해시 입력값: <code style="font-family:\'JetBrains Mono\',monospace;font-size:0.8em;color:#5FA3BF">"연암공대2026해커톤" + ' +
          seed +
          " + 이름 + 학번</code>",
      )
      .show();

    var $grid = $("#verify-grid");
    $grid.empty();

    teams.forEach(function (team, idx) {
      var color = COLORS[idx];

      var memberRows = team.members
        .map(function (m) {
          return (
            '<div class="v-member">' +
            '<div class="v-minfo">' +
            '<span class="v-name">' +
            m.name +
            "</span>" +
            '<span class="v-id">' +
            m.id +
            "</span>" +
            "</div>" +
            '<details class="v-hash-wrap">' +
            '<summary class="v-hash-toggle">SHA-256 해시</summary>' +
            '<span class="v-hash-val">' +
            m.hash +
            "</span>" +
            "</details>" +
            "</div>"
          );
        })
        .join("");

      $grid.append(
        '<div class="v-card" style="border-left-color:' +
          color +
          '">' +
          '<div class="v-header">' +
          '<span class="v-num" style="color:' +
          color +
          '">팀 ' +
          team.id +
          "</span>" +
          '<span class="v-count">' +
          (team.members.length + 1) +
          "인</span>" +
          "</div>" +
          '<div class="v-leader">' +
          '👑 <span class="v-name">' +
          team.leader.name +
          "</span>" +
          '<span class="v-id">' +
          team.leader.id +
          "</span>" +
          "</div>" +
          memberRows +
          "</div>",
      );
    });

    $("#result-section").show();
    $("#verify-btn").prop("disabled", false).text("검증하기");
  }

  // URL 파라미터 자동 입력
  var urlSeed = new URLSearchParams(window.location.search).get("seed");
  if (urlSeed) {
    $("#seed-input").val(urlSeed);
    runVerify(urlSeed);
  }

  $("#verify-form").on("submit", function (e) {
    e.preventDefault();
    runVerify($("#seed-input").val().trim());
  });
});
