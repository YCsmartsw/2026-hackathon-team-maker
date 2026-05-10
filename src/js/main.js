$(async function () {
  var data = window.HACKATHON_DATA;

  // 참가자 풀 초기화
  Animator.initPool(data.people);

  // 시드 카운터 시작
  SeedManager.start();
  $("#seed-value").addClass("seed-live");
  $("#seed-status").html('<span class="dot-live"></span> 실시간 갱신 중');

  // 추첨 버튼
  $("#btn-draw").on("click", async function () {
    $(this).prop("disabled", true).text("추첨 중…");

    var seed = SeedManager.stop();
    $("#seed-value").removeClass("seed-live").addClass("seed-frozen");
    $("#seed-status").html('<span class="dot-frozen"></span> 시드 고정됨');

    // 잠깐의 계산 딜레이 후 애니메이션 시작
    var teams = await FairDraw.assignTeams(seed);

    setTimeout(function () {
      Animator.runDeal(teams, seed);
    }, 300);
  });
});
