# AutoData Insight MVP

React + Vite 프론트엔드와 Vercel Python Serverless(`api/*.py`)로 구성된 자동 EDA·차트·GPT 인사이트 데모입니다.

## 요구 사항

- Node 20+
- Python 3.12 (Vercel과 맞추는 것을 권장)
- OpenAI API 키 (`OPENAI_API_KEY`)

## 로컬 실행

### 1) 프론트만

```bash
cd autodata-insight
npm install
npm run dev
```

프론트는 `http://localhost:8752` (Vite `server.port`). API는 `vite.config.ts`의 프록시로 `http://localhost:3010`에 전달됩니다.

### 2) API 포함 (권장)

터미널 A:

```bash
cd autodata-insight
npm install
python3 api/local_dev_server.py
```

터미널 B:

```bash
cd autodata-insight
npm run dev
```

`.env.local` 또는 shell 환경에 `OPENAI_API_KEY`를 설정하면 `/api/insights`가 동작합니다.

## Vercel 프로덕션 배포

1. Git 저장소를 Vercel에 연결합니다. Root 디렉터리를 본 패키지(`autodata-insight`)로 설정합니다.
2. **Environment Variables**: `OPENAI_API_KEY`
3. Optional: `OPENAI_MODEL`(기본 `gpt-5-mini`), `EDA_MAX_COLUMNS`(기본 `80`), `MAX_UPLOAD_BYTES`(기본 Vercel 제한 근처)
4. 배포 후 동일 도메인에서 `/`는 SPA, `/api/*`는 Python 함수로 제공됩니다.

## 제약

- 서버 요청 본문 제한 때문에 **실용적인 CSV 크기 상한은 약 4MB 근처**입니다(UTF-8 기준 바이트).
- 초고차원 테이블(예: 컬럼 수백)은 서버에서 `EDA_MAX_COLUMNS`로 부분 선택합니다.

## 폴더

- `api/` — 프로파일, EDA 집계, 인사이트 LLM 호출
- `src/` — 업로드, 대시보드, Recharts
- `.env.example` — 환경 변수 템플릿
