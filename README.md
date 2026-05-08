# 🎲 Hackathon Team Maker

> 2026 연암공과대학교 해커톤 팀 추첨 시스템

SHA-256 해시 기반의 **결정론적(재현 가능한) 팀 추첨** 웹앱입니다.  
추첨 버튼을 누른 순간의 타임스탬프를 시드로 삼아 팀을 배정하며, 동일한 시드를 입력하면 언제 어디서든 동일한 결과가 재현됩니다.

---

## ✨ Features

- **실시간 시드** — `Date.now()` 기반으로 버튼을 누른 밀리초가 시드로 고정됩니다
- **결정론적 추첨** — SHA-256 + 고정 salt로 시드가 같으면 결과가 항상 동일합니다
- **카드 셔플 애니메이션** — 추첨 대상 카드가 화면에서 섞이고 대기 공간에 모인 뒤 팀별로 배치됩니다
- **공정성 검증 페이지** — 시드를 입력해 누구든지 결과를 직접 재현·검증할 수 있습니다

---

## 🔐 Algorithm

추첨은 3단계로 진행됩니다.

```
1. 해시 계산
   hash(p) = SHA-256( "연암공대2026해커톤" + seed + p.name + p.id )
   → WebCrypto API (crypto.subtle.digest) 사용

2. 해시 오름차순 정렬
   members.sort((a, b) => a.hash.localeCompare(b.hash))
   leaders.sort((a, b) => a.hash.localeCompare(b.hash))

3. 라운드로빈 팀 배정
   sorted_members.forEach((m, i) => teams[i % N].push(m))
```

시드 외의 모든 값(이름, 학번, salt)이 고정이므로 같은 시드 → 같은 해시 → 같은 정렬 → **같은 팀 배정**이 수학적으로 보장됩니다.

---

## 📁 Structure

```
.
├── index.html          # 메인 추첨 페이지
├── verify.html         # 결과 검증 페이지
├── css/
│   ├── shared.css      # 공통 스타일 (헤더, 변수 등)
│   ├── index.css       # 추첨 페이지 전용 스타일
│   └── verify.css      # 검증 페이지 전용 스타일
└── js/
    ├── data.js         # 참가자 데이터 (팀장 / 팀원)
    ├── fair.js         # SHA-256 기반 팀 배정 알고리즘
    ├── seed.js         # 실시간 시드 생성 및 고정
    ├── animation.js    # 카드 셔플 & 팀 배치 애니메이션
    ├── main.js         # 추첨 페이지 진입점
    └── verify.js       # 검증 페이지 로직
```

---

## 🚀 Usage

별도의 빌드 없이 브라우저에서 바로 열 수 있습니다.

```bash
# 로컬 서버로 실행 (권장 — WebCrypto는 HTTPS/localhost 필요)
npx serve .
# 또는
python -m http.server 8080
```

이후 `http://localhost:8080`에서 `index.html`을 엽니다.

> **주의** — `file://` 프로토콜에서는 WebCrypto API가 동작하지 않을 수 있습니다.

---

## 🛠️ Customization

`js/data.js`에서 팀장과 팀원 목록을 수정하고, `js/fair.js`의 `% N` 값을 팀 수에 맞게 조정합니다.

```js
// js/fair.js — 팀 수 변경 시
hashed.forEach((member, i) => teams[i % N].push(member));
//                                              ↑ 팀 수
```

---

## 🧰 Tech Stack

| 항목 | 내용 |
|------|------|
| 언어 | Vanilla JS (ES5+) |
| 해시 | WebCrypto API — `crypto.subtle.digest` |
| 스타일 | 순수 CSS (CSS Variables) |
| 폰트 | Noto Sans KR, JetBrains Mono |
| 의존성 | jQuery 3.7.1 (CDN) |

---

## 📄 License

MIT
