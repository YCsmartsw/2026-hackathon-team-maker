(function () {
  var TEAM_COLORS = [
    "#06B6D4",
    "#8B5CF6",
    "#10B981",
    "#F43F5E",
    "#F59E0B",
    "#0EA5E9",
    "#84CC16",
    "#EC4899",
  ];

  function runDeal(teams, frozenSeed) {
    // ── 1. 시드 바 업데이트 ──
    document.getElementById("frozen-seed").textContent = frozenSeed;
    document.getElementById("verify-link").href =
      "verify.html?seed=" + frozenSeed;

    document.getElementById("btn-copy").onclick = function () {
      navigator.clipboard.writeText(String(frozenSeed)).then(function () {
        var btn = document.getElementById("btn-copy");
        btn.textContent = "복사됨";
        btn.style.color = "#10B981";
        setTimeout(function () {
          btn.textContent = "복사";
          btn.style.color = "";
        }, 1600);
      });
    };

    document.getElementById("btn-copy-announce").onclick = function () {
      var lines = [];
      teams.forEach(function (team) {
        lines.push("[팀 " + team.id + "]");
        lines.push(team.members.map(function (m) { return m.name; }).join(", "));
        lines.push("");
      });
      var verifyUrl = location.href.replace(/[^\/]*$/, "") + "verify.html?seed=" + frozenSeed;
      lines.push("시드: " + frozenSeed);
      lines.push("검증: " + verifyUrl);

      navigator.clipboard.writeText(lines.join("\n")).then(function () {
        var btn = document.getElementById("btn-copy-announce");
        btn.textContent = "복사됨";
        setTimeout(function () {
          btn.textContent = "공지용 복사";
        }, 1600);
      });
    };

    // ── 2. 팀 결과 그리드 준비 ──
    _buildResultGrid(teams);

    // ── 3. 멤버 칩 원래 위치 캡처 + 풀 영역 캡처 ──
    var chips = Array.from(document.querySelectorAll(".member-chip"));
    var sourceRects = chips.map(function (el) {
      return el.getBoundingClientRect();
    });
    var poolRect = document
      .getElementById("member-pool")
      .getBoundingClientRect();

    // ── 4. 결과 그리드 숨긴 채 렌더 → 목적지 위치·크기 캡처 ──
    var resultSection = document.getElementById("result-section");
    resultSection.style.visibility = "hidden";
    resultSection.style.display = "flex";

    var slotMap = {};
    document.querySelectorAll(".team-member-slot").forEach(function (slot) {
      slotMap[slot.dataset.name] = slot;
    });

    var targetRects = _captureSlotRects(slotMap);

    resultSection.style.visibility = "";
    resultSection.style.display = "none";

    // ── 5. 칩들을 fixed 포지션 클론으로 분리 ──
    var flyChips = chips.map(function (el, i) {
      var rect = sourceRects[i];
      var name = el.dataset.name;

      var clone = document.createElement("div");
      clone.className = "fly-chip";
      clone.textContent = name;
      clone.style.cssText = [
        "position:fixed",
        "left:" + rect.left + "px",
        "top:" + rect.top + "px",
        "width:" + rect.width + "px",
        "height:" + rect.height + "px",
        "z-index:1000",
        "pointer-events:none",
        "display:flex",
        "align-items:center",
        "justify-content:center",
        "border-radius:8px",
        "font-size:0.9rem",
        "font-weight:700",
        "color:#fff",
        "background:#222",
        "border:1px solid rgba(255,255,255,0.1)",
        "overflow:hidden",
        "will-change:transform,opacity",
        "transition:none",
      ].join(";");

      document.body.appendChild(clone);
      return { el: clone, name: name, rect: rect };
    });

    chips.forEach(function (el) {
      el.style.opacity = "0";
    });

    // ── 6. 셔플 페이즈: 10라운드 (~3.1초) ──
    var ROUND_DURATIONS = [280, 240, 300, 260, 320, 250, 290, 270, 310, 340];
    var ROUND_EASINGS = [
      "cubic-bezier(0.4,0,0.6,1)",
      "cubic-bezier(0.4,0,0.6,1)",
      "cubic-bezier(0.4,0,0.6,1)",
      "cubic-bezier(0.4,0,0.6,1)",
      "cubic-bezier(0.4,0,0.6,1)",
      "cubic-bezier(0.3,0,0.5,1)",
      "cubic-bezier(0.25,0,0.5,1)",
      "cubic-bezier(0.25,0,0.5,1)",
      "cubic-bezier(0.2,0,0.4,1)",
      "cubic-bezier(0.2,0,0.4,1)",
    ];

    function randomPosInPool(w, h) {
      var pad = 6;
      return {
        x:
          poolRect.left +
          pad +
          Math.random() * Math.max(0, poolRect.width - w - pad * 2),
        y:
          poolRect.top +
          pad +
          Math.random() * Math.max(0, poolRect.height - h - pad * 2),
      };
    }

    function shuffleRound(dur, easing) {
      flyChips.forEach(function (c) {
        var pos = randomPosInPool(c.rect.width, c.rect.height);
        var dx = pos.x - c.rect.left;
        var dy = pos.y - c.rect.top;
        var rot = (Math.random() - 0.5) * 28;
        var cardDur = dur + Math.round((Math.random() - 0.5) * 80);

        c.currentDx = dx;
        c.currentDy = dy;
        c.currentRot = rot;

        c.el.style.transition = "transform " + cardDur + "ms " + easing;
        c.el.style.transform =
          "translate(" + dx + "px," + dy + "px) rotate(" + rot + "deg)";
      });
    }

    var GAP = 30;
    var roundStarts = [];
    var acc = 0;
    ROUND_DURATIONS.forEach(function (d) {
      roundStarts.push(acc);
      acc += d + GAP;
    });
    var totalShuffleMs = acc;

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        ROUND_DURATIONS.forEach(function (dur, i) {
          setTimeout(function () {
            shuffleRound(dur, ROUND_EASINGS[i]);
          }, roundStarts[i]);
        });

        setTimeout(function () {
          // 결과 레이아웃 전환 후 덱으로 카드 모으기 → 팀별 배치
          _showResultLayout(resultSection, function () {
            targetRects = _captureSlotRects(slotMap);
            _gatherToDeck(
              flyChips,
              teams.reduce(function (n, t) {
                return n + t.members.length;
              }, 0),
              function () {
                _deployTeamByTeam(teams, flyChips, slotMap, targetRects);
              },
            );
          });
        }, totalShuffleMs + 80);
      });
    });
  }

  // slot들을 scale(1) 기준으로 rect 캡처
  function _captureSlotRects(slotMap) {
    var rects = {};
    Object.keys(slotMap).forEach(function (name) {
      var slot = slotMap[name];
      var saved = slot.style.transform;
      slot.style.transform = "scale(1)";
      rects[name] = slot.getBoundingClientRect();
      slot.style.transform = saved;
    });
    return rects;
  }

  // 셔플된 상태(회전·겹침)를 유지하되, 덱 영역 안에 들어오도록 스프레드 압축
  function _gatherToDeck(flyChips, totalCount, cb) {
    var GATHER_DUR = 500;
    var PAD = 24;

    // result-section(z-index:15) 위로 올려서 덱에 보이게
    flyChips.forEach(function (c) {
      c.el.style.zIndex = "18";
    });

    // 각 카드의 현재 화면 중심 좌표
    var positions = flyChips.map(function (c) {
      return {
        x: c.rect.left + (c.currentDx || 0) + c.rect.width / 2,
        y: c.rect.top + (c.currentDy || 0) + c.rect.height / 2,
      };
    });

    // 그룹 중심
    var avgX =
      positions.reduce(function (s, p) {
        return s + p.x;
      }, 0) / positions.length;
    var avgY =
      positions.reduce(function (s, p) {
        return s + p.y;
      }, 0) / positions.length;

    // 그룹 최대 반경
    var maxDX = positions.reduce(function (m, p) {
      return Math.max(m, Math.abs(p.x - avgX));
    }, 0);
    var maxDY = positions.reduce(function (m, p) {
      return Math.max(m, Math.abs(p.y - avgY));
    }, 0);

    // 덱 영역
    var deckEl = document.getElementById("card-deck");
    var deckRect = deckEl.getBoundingClientRect();
    var deckCX = deckRect.left + deckRect.width / 2;
    var deckCY = deckRect.top + deckRect.height / 2;

    // X/Y 독립 스케일: 가로는 덱 너비 전체 활용, 세로는 추가 압축
    var scaleX =
      maxDX > 0 ? Math.min(1, (deckRect.width / 2 - PAD) / maxDX) : 1;
    var scaleY =
      maxDY > 0 ? Math.min(0.1, (deckRect.height / 2 - PAD) / maxDY) : 1;

    // 각 카드: X/Y 독립적으로 이동 (회전 유지)
    flyChips.forEach(function (c, i) {
      var p = positions[i];
      var newCX = deckCX + (p.x - avgX) * scaleX;
      var newCY = deckCY + (p.y - avgY) * scaleY;
      var newDx = newCX - c.rect.width / 2 - c.rect.left;
      var newDy = newCY - c.rect.height / 2 - c.rect.top;

      c.el.style.transition =
        "transform " + GATHER_DUR + "ms cubic-bezier(0.4,0,0.2,1)";
      c.el.style.transform =
        "translate(" +
        newDx +
        "px," +
        newDy +
        "px) rotate(" +
        (c.currentRot || 0) +
        "deg)";

      c.deckDx = newDx;
      c.deckDy = newDy;
    });

    // 덱 카운트 레이블 업데이트
    var label = deckEl.querySelector(".section-label");
    if (label) label.textContent = "섞인 카드 — " + totalCount + "장 대기 중";

    setTimeout(cb, GATHER_DUR + 100);
  }

  // 팀별 순차 배치 (덱 파일 → 팀 슬롯)
  function _deployTeamByTeam(teams, flyChips, slotMap, targetRects) {
    var INTRA_DELAY = 200;
    var INTER_DELAY = 550;
    var FLY_DURATION = 520;

    var chipByName = {};
    flyChips.forEach(function (c) {
      chipByName[c.name] = c;
    });

    var remaining = flyChips.length;
    var deckLabel = document.querySelector("#card-deck .section-label");

    var teamIdx = 0;

    function deployNext() {
      if (teamIdx >= teams.length) {
        _onAllLanded();
        return;
      }

      var team = teams[teamIdx];
      var color = TEAM_COLORS[teamIdx];
      var members = team.members;
      var cardEl = document.querySelectorAll(".team-card")[teamIdx];
      teamIdx++;

      if (cardEl) {
        cardEl.style.transition = "box-shadow 0.15s";
        cardEl.style.boxShadow = "0 0 0 2px " + color;
        setTimeout(function () {
          cardEl.style.transition = "box-shadow 0.4s";
          cardEl.style.boxShadow = "";
        }, 220);
      }

      members.forEach(function (m, mIdx) {
        setTimeout(function () {
          var c = chipByName[m.name];
          var target = targetRects[m.name];
          if (!c || !target) return;

          remaining--;
          if (deckLabel)
            deckLabel.textContent = "섞인 카드 — " + remaining + "장 대기 중";

          var dx = target.left - c.rect.left;
          var dy = target.top - c.rect.top;

          c.el.style.zIndex = "25";
          c.el.style.transition = [
            "transform " + FLY_DURATION + "ms cubic-bezier(0.34,1.35,0.64,1)",
            "width " + (FLY_DURATION - 100) + "ms 100ms ease-out",
            "height " + (FLY_DURATION - 100) + "ms 100ms ease-out",
          ].join(", ");
          c.el.style.transform =
            "translate(" + dx + "px," + dy + "px) rotate(0deg)";
          c.el.style.width = target.width + "px";
          c.el.style.height = target.height + "px";

          // 착지: chip fade-out + slot bounce pop-in
          setTimeout(function () {
            c.el.style.transition = "opacity 80ms";
            c.el.style.opacity = "0";
            setTimeout(function () {
              c.el.remove();
            }, 80);

            var slot = slotMap[m.name];
            if (slot) {
              slot.style.transition = "none";
              slot.style.opacity = "1";
              slot.style.transform = "scale(0.88)";
              requestAnimationFrame(function () {
                requestAnimationFrame(function () {
                  slot.style.transition =
                    "transform 0.28s cubic-bezier(0.34,1.6,0.64,1)";
                  slot.style.transform = "scale(1)";
                });
              });
            }
          }, FLY_DURATION - 20);
        }, mIdx * INTRA_DELAY);
      });

      var lastStart = (members.length - 1) * INTRA_DELAY;
      setTimeout(deployNext, lastStart + FLY_DURATION + INTER_DELAY);
    }

    deployNext();
  }

  // 팀 그리드 DOM 구성
  function _buildResultGrid(teams) {
    var grid = document.getElementById("team-grid");
    grid.innerHTML = "";

    teams.forEach(function (team, i) {
      var color = TEAM_COLORS[i];
      var card = document.createElement("div");
      card.className = "team-card";
      card.style.borderLeftColor = color;

      var header =
        '<div class="tc-header"><span class="tc-num" style="color:' +
        color +
        '">팀 ' +
        team.id +
        '</span><span class="tc-size">' +
        team.members.length +
        "인</span></div>";

      var memberSlots = team.members
        .map(function (m) {
          return (
            '<div class="team-member-slot" data-name="' +
            m.name +
            '" style="opacity:0;transform:scale(0.85)">' +
            '<span class="tc-name">' +
            m.name +
            "</span>" +
            '<span class="tc-sid">' +
            m.id +
            "</span>" +
            "</div>"
          );
        })
        .join("");

      card.innerHTML =
        header +
        '<div class="tc-members">' +
        memberSlots +
        "</div>";
      grid.appendChild(card);
    });
  }

  // 드로우 섹션 fade-out, 결과 섹션 fade-in
  function _showResultLayout(resultSection, cb) {
    var drawSection = document.getElementById("draw-section");

    drawSection.style.transition = "opacity 0.3s";
    drawSection.style.opacity = "0";

    setTimeout(function () {
      drawSection.style.display = "none";
      resultSection.style.display = "flex";
      resultSection.style.opacity = "0";
      resultSection.style.position = "relative";
      resultSection.style.zIndex = "15";
      resultSection.style.transition = "opacity 0.3s";

      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          resultSection.style.opacity = "1";
          setTimeout(cb, 320);
        });
      });
    }, 300);
  }

  function _onAllLanded() {
    var seedEl = document.getElementById("frozen-seed");
    if (seedEl) {
      seedEl.style.transition = "color 0.4s";
      seedEl.style.color = "#FF4D6D";
      setTimeout(function () {
        seedEl.style.transition = "color 0.8s";
        seedEl.style.color = "";
      }, 700);
    }
  }

  function initPool(members) {
    var pool = document.getElementById("member-pool");
    pool.innerHTML = "";
    members.forEach(function (m) {
      var chip = document.createElement("div");
      chip.className = "member-chip";
      chip.dataset.name = m.name;

      var nameSpan = document.createElement("span");
      nameSpan.className = "chip-name";
      nameSpan.textContent = m.name;

      var idSpan = document.createElement("span");
      idSpan.className = "chip-id";
      idSpan.textContent = m.id;

      chip.appendChild(nameSpan);
      chip.appendChild(idSpan);
      pool.appendChild(chip);
    });
  }

  window.Animator = { initPool, runDeal, TEAM_COLORS };
})();
