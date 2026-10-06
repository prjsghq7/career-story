# Kim Geonho Career Story

김건호의 이야기, 기록, 대표작, 경력을 소개하는 정적 포트폴리오 사이트입니다. 저장소 루트가 그대로 공개 사이트가 되며 모든 내부 경로는 GitHub Pages에서 동작하도록 상대경로로 작성했습니다.

## Local preview

```powershell
python -m http.server 4173
```

브라우저에서 `http://127.0.0.1:4173`을 엽니다.

## Structure

- `index.html`: 이야기, 기록 수치, 대표작, 경력, 연락처
- `styles.css`: 반응형 레이아웃과 스크롤 전환
- `app.js`: 스크롤 진행률, 화면 전환, 모바일 메뉴, 공개 데이터 반영
- `data/site-data.json`: 사이트에서 사용하는 공개 기록 데이터
- `documents/`: 사이트에서 여는 대표작 PDF

## Publish checklist

- 다른 사람의 실명과 연락처가 없는지 확인합니다.
- 이메일 외의 주소, 전화번호, 생년월일을 공개하지 않습니다.
- 논문 PDF가 새 시크릿 창에서 열리는지 확인합니다.
- 13번 앱을 완성한 뒤 예약된 대표작 자리를 실제 내용으로 교체합니다.
- GitHub Pages의 HTTPS 주소를 최종 제출 URL로 사용합니다.
