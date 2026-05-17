# ⚾ 홈런픽 (HomeRun Pick) - KBO 승부예측 토스 미니앱

> **토스 인앱(Apps in Toss) 환경에서 동작하는 프리미엄 KBO 승부예측 하이브리드 미니앱입니다.**  
> 토스 고유의 미니멀리즘 디자인 가이드를 준수하며, 24시간 실시간 크롤링 백엔드를 통해 야구 팬들에게 가장 깔끔하고 빠른 승부예측 서비스를 제공합니다.

---

## 🌟 주요 특징 (Key Features)

* **실시간 KBO 데이터 연동**: 백엔드 크롤러가 KBO 공식 데이터를 실시간으로 파싱하여 진행 중인 경기의 이닝/점수 및 팀 순위를 실시간으로 반영합니다.
* **Toss TDS(Toss Design System) 디자인 가이드 적용**:
  * 부드러운 타이포그래피 네비게이션 탭 바 (액티브 인디케이터 장착)
  * 디바이스 깨짐 없는 **100% 네이티브 벡터 그래픽 배지** (진행 중, 예정, 종료 상태 서클 적용)
  * 모던한 Toss Action Blue 컬러 팔레트 구성
* **상세 통계 및 랭킹 시스템**:
  * 최근 내 예측 결과를 분석한 **나의 전체 적중률 막대 그래프**
  * 이번 시즌 승부예측 결과를 뽐낼 수 있는 **금빛 랭킹 시상대(Podium) 화면**

---

## 📁 프로젝트 구조 (Repository Structure)

본 프로젝트는 프론트엔드와 백엔드가 하나의 저장소에서 관리되는 **모노레포(Monorepo)** 구조입니다.

```text
├── src/                    # Granite 토스 미니앱 프론트엔드 소스코드
│   ├── pages/
│   │   └── index.tsx       # 메인 승부예측 앱 전체 코드 (TDS 디자인 컴포넌트 포함)
│   └── ...
├── server/                 # Express.js 크롤링 백엔드 API 서버
│   ├── index.js            # 실시간 KBO 크롤러 및 API 엔드포인트 구현체
│   ├── package.json
│   └── ...
├── granite.config.ts       # Granite 빌드 및 미니앱 설정 파일
├── homerun-pick.ait        # 토스 플랫폼 업로드용 최종 빌드 산출물
└── package.json
```

---

## 🚀 로컬 실행 방법 (Getting Started)

### 1. 백엔드 크롤링 서버 실행
```bash
# server 폴더로 이동 및 패키지 설치
cd server
npm install

# 크롤링 서버 실행 (기본 3001번 포트)
npm run dev
```

### 2. 프론트엔드 Granite 앱 실행
```bash
# 프로젝트 루트 폴더에서 패키지 설치
npm install

# Vite & Granite 로컬 개발 서버 실행
npm run dev
```
* 로컬 실행 후 제공되는 QR 코드 혹은 개발자 URL을 통해 토스 개발자 도구(Toss Sandbox)에서 실행하실 수 있습니다.

---

## ☁️ 배포 가이드 (Deployment Guide)

### 백엔드 (Render.com 무료 배포 추천)
토스 미니앱은 실서버에 등록할 때 **보안 HTTPS 연결**이 필수입니다. [Render](https://render.com/)를 사용하여 24시간 돌아가는 무료 HTTPS 백엔드를 올리는 것을 권장합니다.

1. 본 깃허브 저장소를 **Render** 서비스에 연결합니다.
2. 서비스 종류로 **`Web Service`**를 만듭니다.
3. 설정을 다음과 같이 지정합니다:
   * **Root Directory**: `server`
   * **Build Command**: `npm install`
   * **Start Command**: `npm start`
   * **Instance Type**: `Free` (무료 등급)
4. 배포 성공 후 발급된 `https://your-service.onrender.com` 주소를 복사하여 `src/pages/index.tsx` 파일의 `API_BASE_URL` 변수에 입력해 줍니다.
5. `npm run build`를 통해 빌드된 최종 `.ait` 아티팩트를 토스 개발자 콘솔에 업로드합니다.

---

## 📄 라이선스 (License)

본 프로젝트는 개인 토이 및 테스트 프로젝트용으로 개발되었습니다.
