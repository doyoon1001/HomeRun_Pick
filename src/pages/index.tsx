import { createRoute } from '@granite-js/react-native';
import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';

// ── 팀 데이터 ─────────────────────────────────────────────
const TEAMS: Record<string, { name: string; short: string; color: string; bg: string; logo: string }> = {
  KIA: { name: "KIA 타이거즈", short: "KIA", color: "#C8102E", bg: "#FFF0F0", logo: "https://6ptotvmi5753.edge.naverncp.com/KBO_IMAGE/emblem/regular/fixed/emblem_HT.png" },
  SS: { name: "삼성 라이온즈", short: "삼성", color: "#1428A0", bg: "#F0F0FF", logo: "https://6ptotvmi5753.edge.naverncp.com/KBO_IMAGE/emblem/regular/fixed/emblem_SS.png" },
  LG: { name: "LG 트윈스", short: "LG", color: "#C40D2E", bg: "#FFF0F0", logo: "https://6ptotvmi5753.edge.naverncp.com/KBO_IMAGE/emblem/regular/fixed/emblem_LG.png" },
  DB: { name: "두산 베어스", short: "두산", color: "#131230", bg: "#F0F0F5", logo: "https://6ptotvmi5753.edge.naverncp.com/KBO_IMAGE/emblem/regular/fixed/emblem_OB.png" },
  KT: { name: "KT 위즈", short: "KT", color: "#000000", bg: "#F5F5F5", logo: "https://6ptotvmi5753.edge.naverncp.com/KBO_IMAGE/emblem/regular/fixed/emblem_KT.png" },
  SSG: { name: "SSG 랜더스", short: "SSG", color: "#CE0E2D", bg: "#FFF0F0", logo: "https://6ptotvmi5753.edge.naverncp.com/KBO_IMAGE/emblem/regular/fixed/emblem_SK.png" },
  LOT: { name: "롯데 자이언츠", short: "롯데", color: "#002561", bg: "#F0F0FF", logo: "https://6ptotvmi5753.edge.naverncp.com/KBO_IMAGE/emblem/regular/fixed/emblem_LT.png" },
  HH: { name: "한화 이글스", short: "한화", color: "#F0501B", bg: "#FFF4F0", logo: "https://6ptotvmi5753.edge.naverncp.com/KBO_IMAGE/emblem/regular/fixed/emblem_HH.png" },
  NC: { name: "NC 다이노스", short: "NC", color: "#1D5B9E", bg: "#F0F5FF", logo: "https://6ptotvmi5753.edge.naverncp.com/KBO_IMAGE/emblem/regular/fixed/emblem_NC.png" },
  KIW: { name: "키움 히어로즈", short: "키움", color: "#820024", bg: "#FFF0F3", logo: "https://6ptotvmi5753.edge.naverncp.com/KBO_IMAGE/emblem/regular/fixed/emblem_WO.png" },
};

// ── 게임 데이터 ───────────────────────────────────────────
const TODAY = new Date();
const fmt = (h: number, m: number) => `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;

const INITIAL_GAMES = [
  {
    id: 1, home: "KIA", away: "NC",
    time: fmt(18, 30), stadium: "광주-기아 챔피언스 필드",
    status: "upcoming", pick: null, result: null,
    homeOdds: 1.65, awayOdds: 2.10, homeScore: 0, awayScore: 0,
  },
  {
    id: 2, home: "DB", away: "SSG",
    time: fmt(18, 30), stadium: "잠실야구장",
    status: "upcoming", pick: null, result: null,
    homeOdds: 1.80, awayOdds: 1.90, homeScore: 0, awayScore: 0,
  },
  {
    id: 3, home: "KIW", away: "LG",
    time: fmt(18, 30), stadium: "고척 스카이돔",
    status: "upcoming", pick: null, result: null,
    homeOdds: 1.70, awayOdds: 2.00, homeScore: 0, awayScore: 0,
  },
  {
    id: 4, home: "SS", away: "HH",
    time: fmt(18, 30), stadium: "대구 삼성 라이온즈 파크",
    status: "upcoming", pick: null, result: null,
    homeOdds: 1.55, awayOdds: 2.30, homeScore: 0, awayScore: 0,
  },
  {
    id: 5, home: "KT", away: "LOT",
    time: fmt(18, 30), stadium: "수원 KT 위즈 파크",
    status: "upcoming", pick: null, result: null,
    homeOdds: 1.60, awayOdds: 2.20, homeScore: 0, awayScore: 0,
  },
];

// 크롤링 백엔드 서버 URL 설정 (Render 실서버 배포 주소)
const API_BASE_URL = "https://homerun-pick.onrender.com";
const GAME_SCHEDULE_API_URL = `${API_BASE_URL}/api/games`;

// kbo-scraper의 전체 팀 이름을 홈런픽의 고유 ID로 변환합니다.
const getTeamId = (fullName: string) => {
  if (!fullName) return "KIA";
  if (fullName.includes("KIA") || fullName.includes("기아")) return "KIA";
  if (fullName.includes("삼성")) return "SS";
  if (fullName.includes("LG")) return "LG";
  if (fullName.includes("두산")) return "DB";
  if (fullName.includes("KT") || fullName.includes("kt")) return "KT";
  if (fullName.includes("SSG")) return "SSG";
  if (fullName.includes("롯데")) return "LOT";
  if (fullName.includes("한화")) return "HH";
  if (fullName.includes("NC") || fullName.includes("nc")) return "NC";
  if (fullName.includes("키움")) return "KIW";
  return "KIA"; // fallback
};

// ── 하이브리드 로컬스토리지 헬퍼 (Web-view 및 Native 안전) ──
const safeLocalStorage = {
  getItem: (key: string) => {
    try {
      const _global = global as any;
      if (typeof _global.window !== 'undefined' && _global.window.localStorage) {
        return _global.window.localStorage.getItem(key);
      }
    } catch (e) {
      console.warn("localStorage getItem 실패:", e);
    }
    return null;
  },
  setItem: (key: string, value: string) => {
    try {
      const _global = global as any;
      if (typeof _global.window !== 'undefined' && _global.window.localStorage) {
        _global.window.localStorage.setItem(key, value);
      }
    } catch (e) {
      console.warn("localStorage setItem 실패:", e);
    }
  }
};

const LS_PICKS_KEY = (d: string) => `hrpick_picks_${d}`;
const LS_HISTORY_KEY = "hrpick_history";
const LS_USER_KEY = "hrpick_userid";

const getTodayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const getUserId = () => {
  let id = safeLocalStorage.getItem(LS_USER_KEY);
  if (!id) {
    id = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    safeLocalStorage.setItem(LS_USER_KEY, id);
  }
  return id;
};

const savePicks = (games: any[]) => {
  const picks: any = {};
  games.forEach(g => { if (g.pick) picks[g.id] = g.pick; });
  safeLocalStorage.setItem(LS_PICKS_KEY(getTodayKey()), JSON.stringify(picks));
};

const loadTodayPicks = () => {
  try { return JSON.parse(safeLocalStorage.getItem(LS_PICKS_KEY(getTodayKey())) || "{}"); }
  catch { return {}; }
};

const saveHistory = (game: any) => {
  try {
    const history = JSON.parse(safeLocalStorage.getItem(LS_HISTORY_KEY) || "[]");
    const exists = history.find((h: any) => h.gameId === game.id && h.date === getTodayKey());
    if (!exists && game.pick && game.result) {
      history.unshift({
        gameId: game.id,
        date: getTodayKey(),
        home: game.home,
        away: game.away,
        pick: game.pick,
        result: game.result,
        pickedTeam: game.pick === "home" ? game.home : game.away,
        win: game.pick === game.result,
        homeScore: game.homeScore,
        awayScore: game.awayScore,
      });
      safeLocalStorage.setItem(LS_HISTORY_KEY, JSON.stringify(history.slice(0, 200)));
      return true;
    }
  } catch (e) { console.error("히스토리 저장 에러:", e); }
  return false;
};

const loadHistory = () => {
  try { return JSON.parse(safeLocalStorage.getItem(LS_HISTORY_KEY) || "[]"); }
  catch { return []; }
};

// ── 유틸 ─────────────────────────────────────────────────
const pct = (a: number, b: number) => b === 0 ? 0 : Math.round((a / b) * 100);
const dateStr = () => {
  const d = TODAY;
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${days[d.getDay()]})`;
};

// ── 색상 ─────────────────────────────────────────────────
const C = {
  navy: "#0E1E45",
  red: "#E8231A",
  gold: "#F5A623",
  silver: "#9B9B9B",
  bronze: "#CD7F32",
  bg: "#F4F6FA",
  card: "#FFFFFF",
  text: "#1A1A2E",
  sub: "#6B7280",
  border: "#E5E7EB",
  green: "#22C55E",
};

// ── KBO 정규시즌 시간 규정 ───────────────────────────────
const getFirstGameStartTime = (d = new Date()) => {
  const month = d.getMonth() + 1;
  const date = d.getDate();
  const day = d.getDay(); // 0: Sun, 1: Mon, ..., 6: Sat

  if (month === 5 && date === 1) return { h: 17, m: 0 }; // 노동절
  if (day >= 1 && day <= 5) return { h: 18, m: 30 }; // 평일
  if (month === 6) return { h: 17, m: 0 }; // 6월 주말
  if (month === 7 || month === 8) return { h: 18, m: 0 }; // 7-8월 주말

  // 3~5월, 9~10월 주말
  if (day === 6) return { h: 17, m: 0 }; // 토
  if (day === 0) return { h: 14, m: 0 }; // 일

  return { h: 18, m: 30 };
};

const isPredictionLocked = (gameTimeStr: string) => {
  if (!gameTimeStr) return false;
  const [h, m] = gameTimeStr.split(":").map(Number);
  const now = new Date();
  const gameTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0);
  const lockTime = new Date(gameTime.getTime() - 30 * 60 * 1000); // 30분 전
  return now >= lockTime;
};

// Granite 라우트 설정
export const Route = createRoute('/', {
  component: Page,
});

function Page() {
  const [tab, setTab] = useState("home");
  const [games, setGames] = useState<any[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [animPick, setAnimPick] = useState<string | null>(null);
  const [isOffTime, setIsOffTime] = useState(false);
  const [userRankings, setUserRankings] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [teamRecords, setTeamRecords] = useState<any[]>([
    { rank: 1, teamName: "KT", wins: 23, draws: 1, losses: 12, winRate: 0.657, gamesPlayed: 36 },
    { rank: 2, teamName: "LG", wins: 22, draws: 0, losses: 14, winRate: 0.611, gamesPlayed: 36 },
    { rank: 3, teamName: "삼성", wins: 21, draws: 1, losses: 14, winRate: 0.600, gamesPlayed: 36 },
    { rank: 4, teamName: "SSG", wins: 19, draws: 1, losses: 16, winRate: 0.543, gamesPlayed: 36 },
    { rank: 5, teamName: "KIA", wins: 17, draws: 1, losses: 19, winRate: 0.472, gamesPlayed: 37 },
    { rank: 5, teamName: "두산", wins: 17, draws: 1, losses: 19, winRate: 0.472, gamesPlayed: 37 },
    { rank: 7, teamName: "한화", wins: 16, draws: 0, losses: 20, winRate: 0.444, gamesPlayed: 36 },
    { rank: 8, teamName: "NC", wins: 15, draws: 1, losses: 20, winRate: 0.429, gamesPlayed: 36 },
    { rank: 9, teamName: "롯데", wins: 14, draws: 1, losses: 20, winRate: 0.412, gamesPlayed: 35 },
    { rank: 10, teamName: "키움", wins: 13, draws: 1, losses: 23, winRate: 0.361, gamesPlayed: 37 },
  ]);
  const [yesterdayGames, setYesterdayGames] = useState<any[]>([]);

  // 초기 히스토리 로딩 및 유저 세팅
  useEffect(() => {
    setHistory(loadHistory());
    getUserId();
  }, []);

  const totalWins = history.filter(h => h.win).length;
  const total = history.length;

  let streak = 0;
  for (const h of history) {
    if (h.win) streak++;
    else break;
  }

  // 실시간 랭킹 모의 생성 및 unused compile 방지
  useEffect(() => {
    setUserRankings([]);
  }, [totalWins, total, streak]);

  // 시간 체크 (오전 12시 ~ 경기 시작 1시간 전까지 오프타임 적용)
  useEffect(() => {
    const checkTime = () => {
      const now = new Date();
      const firstGame = getFirstGameStartTime(now);
      const firstGameDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), firstGame.h, firstGame.m, 0);
      const wakeupTime = new Date(firstGameDate.getTime() - 1 * 60 * 60 * 1000); // 1시간 전

      setIsOffTime(now.getHours() >= 0 && now < wakeupTime);
    };
    checkTime();
    const timer = setInterval(checkTime, 30000); // 30초마다 체크
    return () => clearInterval(timer);
  }, []);

  // 백엔드 API 연동: 실시간 데이터 가져오기
  useEffect(() => {
    const fetchGames = async () => {
      try {
        const d = new Date();
        const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

        const res = await fetch(`${GAME_SCHEDULE_API_URL}/${todayStr}`);
        const responseData = (await res.json()) as any;

        if (responseData.code === "OK" && responseData.data && responseData.data.length > 0) {
          const mappedData = responseData.data;
          const savedPicks = loadTodayPicks();

          setGames(prev => {
            if (prev.length === 0 || prev[0].id === 1) {
              return mappedData.map((g: any) => ({ ...g, pick: savedPicks[g.id] || null }));
            }

            let isChanged = false;
            const updated = mappedData.map((newGame: any) => {
              const oldGame = prev.find(g => g.id === newGame.id);
              if (!oldGame) {
                isChanged = true;
                return { ...newGame, pick: savedPicks[newGame.id] || null };
              }
              if (
                oldGame.status !== newGame.status ||
                oldGame.homeScore !== newGame.homeScore ||
                oldGame.awayScore !== newGame.awayScore
              ) {
                isChanged = true;
              }
              return { ...newGame, pick: oldGame.pick };
            });

            return isChanged ? updated : prev;
          });
        }
      } catch (e) {
        console.warn("서버 데이터 불러오기 실패. 기본 데이터 표시.", e);
        setGames(prev => {
          if (prev.length === 0) return INITIAL_GAMES;
          let isChanged = false;
          const updated = prev.map(g => {
            if (g.status !== "live") return g;
            if (Math.random() < 0.1) {
              isChanged = true;
              const isHomeScore = Math.random() > 0.5;
              return {
                ...g,
                homeScore: isHomeScore ? g.homeScore + 1 : g.homeScore,
                awayScore: !isHomeScore ? g.awayScore + 1 : g.awayScore,
              };
            }
            return g;
          });
          return isChanged ? updated : prev;
        });
      }
    };

    fetchGames();
    const timer = setInterval(fetchGames, 5000); // 5초 폴링

    const fetchTeamRecords = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/standings`);
        const responseData = (await res.json()) as any;
        if (responseData.code === "OK" && responseData.data && responseData.data.length > 0) {
          setTeamRecords(prev => {
            if (JSON.stringify(prev) === JSON.stringify(responseData.data)) return prev;
            return responseData.data;
          });
        }
      } catch (e) {
        console.warn("팀 순위 가져오기 실패:", e);
      }
    };
    fetchTeamRecords();
    const standingsTimer = setInterval(fetchTeamRecords, 300000); // 5분마다 갱신

    const fetchYesterday = async () => {
      try {
        const yesterday = new Date(Date.now() - 86400000);
        const yStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`;
        const res = await fetch(`${GAME_SCHEDULE_API_URL}/${yStr}`);
        const responseData = (await res.json()) as any;
        if (responseData.code === "OK" && responseData.data && responseData.data.length > 0) {
          setYesterdayGames(responseData.data);
        } else {
          setYesterdayGames([
            { id: "y1", home: "DB", away: "SSG", status: "ended", homeScore: 3, awayScore: 1, time: "14:00", stadium: "잠실" },
            { id: "y2", home: "LOT", away: "KIA", status: "ended", homeScore: 7, awayScore: 3, time: "14:00", stadium: "부산" },
            { id: "y3", home: "NC", away: "SS", status: "ended", homeScore: 1, awayScore: 11, time: "14:00", stadium: "창원" },
            { id: "y4", home: "KIW", away: "KT", status: "ended", homeScore: 5, awayScore: 1, time: "14:00", stadium: "고척" },
            { id: "y5", home: "HH", away: "LG", status: "ended", homeScore: 9, awayScore: 3, time: "14:00", stadium: "대전" },
          ]);
        }
      } catch (e) {
        console.warn("어제 경기 데이터 로딩 실패. 기본값 적용.", e);
        setYesterdayGames([
          { id: "y1", home: "DB", away: "SSG", status: "ended", homeScore: 3, awayScore: 1, time: "14:00", stadium: "잠실" },
          { id: "y2", home: "LOT", away: "KIA", status: "ended", homeScore: 7, awayScore: 3, time: "14:00", stadium: "부산" },
          { id: "y3", home: "NC", away: "SS", status: "ended", homeScore: 1, awayScore: 11, time: "14:00", stadium: "창원" },
          { id: "y4", home: "KIW", away: "KT", status: "ended", homeScore: 5, awayScore: 1, time: "14:00", stadium: "고척" },
          { id: "y5", home: "HH", away: "LG", status: "ended", homeScore: 9, awayScore: 3, time: "14:00", stadium: "대전" },
        ]);
      }
    };
    fetchYesterday();

    return () => {
      clearInterval(timer);
      clearInterval(standingsTimer);
    };
  }, []);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }, []);

  const handlePick = useCallback((gameId: any, side: "home" | "away") => {
    const g = games.find(g => g.id === gameId);
    if (!g) return;

    if (isPredictionLocked(g.time)) {
      showToast("경기 시작 30분 전 마감되었습니다.");
      return;
    }

    setGames(prev => {
      const updated = prev.map(g => {
        if (g.id !== gameId) return g;
        if (g.pick === side) return { ...g, pick: null };
        return { ...g, pick: side };
      });
      savePicks(updated);
      return updated;
    });

    setAnimPick(`${gameId}-${side}`);
    setTimeout(() => setAnimPick(null), 500);

    const t = TEAMS[side === "home" ? g.home : g.away];
    if (t) {
      showToast(`${t.short} 승리 예측!`);
    }
  }, [games, showToast]);

  // 종료된 예측 히스토리에 로컬 자동 백업
  useEffect(() => {
    let updated = false;
    games.forEach(g => {
      if (g.status === "ended" && g.pick && g.result) {
        if (saveHistory(g)) updated = true;
      }
    });
    if (updated) {
      setHistory(loadHistory());
    }
  }, [games]);

  return (
    <SafeAreaView style={styles.container}>
      {/* 상단 헤더 */}
      <Header />

      {/* 메인 탭 전환 영역 */}
      <View style={{ flex: 1, position: 'relative' }}>
        {tab === "home" && (
          isOffTime ? (
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 100 }}>
              <OffTimePopup yesterdayGames={yesterdayGames} />
            </ScrollView>
          ) : (
            <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContainer}>
              <HomeTab games={games} yesterdayGames={yesterdayGames} onPick={handlePick} animPick={animPick} />
            </ScrollView>
          )
        )}
        {tab === "league" && (
          <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContainer}>
            <LeagueTab records={teamRecords} />
          </ScrollView>
        )}
        {tab === "stats" && (
          <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContainer}>
            <StatsTab totalWins={totalWins} total={total} streak={streak} history={history} />
          </ScrollView>
        )}
        {tab === "ranking" && (
          <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContainer}>
            <RankingTab rankings={userRankings} />
          </ScrollView>
        )}
      </View>

      {/* 하단 네비게이션 탭 바 */}
      <BottomNav tab={tab} setTab={setTab} />

      {/* 커스텀 토스트 */}
      {toast && <Toast msg={toast} />}
    </SafeAreaView>
  );
}

// ── 헤더 컴포넌트 ──────────────────────────────────────────
function Header() {
  return (
    <View style={styles.header}>
      <View>
        <View style={styles.headerTitleRow}>
          <Text style={styles.headerTitle}>홈런픽</Text>
          <View style={styles.alphaBadge}>
            <Text style={styles.alphaText}>ALPHA</Text>
          </View>
        </View>
        <Text style={styles.headerSubtitle}>{dateStr()} · KBO 승부예측</Text>
      </View>
      <View style={[styles.headerIcon, { backgroundColor: '#3182F6', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4, height: 'auto', width: 'auto' }]}>
        <Text style={{ fontSize: 11, color: '#FFFFFF', fontWeight: 'bold' }}>KBO</Text>
      </View>
    </View>
  );
}

// ── 오프타임 화면 ──────────────────────────────────────────
function OffTimePopup({ yesterdayGames }: { yesterdayGames: any[] }) {
  return (
    <View style={styles.offTimeContainer}>
      <View style={styles.offTimeBox}>
        <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
          <View style={{ width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: '#3182F6', alignItems: 'center', justifyContent: 'center' }}>
            <View style={{ width: 2, height: 6, backgroundColor: '#3182F6', position: 'absolute', top: 2 }} />
            <View style={{ width: 4, height: 2, backgroundColor: '#3182F6', position: 'absolute', right: 2, top: 6 }} />
          </View>
        </View>
        <Text style={styles.offTimeTitle}>지금은 경기 시간이 아니에요</Text>
        <Text style={styles.offTimeDesc}>
          정확한 예측을 위해 경기 시작{"\n"}
          <Text style={styles.offTimeHighlight}>1시간 전</Text>에 다시 찾아올게요!
        </Text>
      </View>

      <Text style={styles.offTimeHeader}>이전 경기 결과</Text>
      <View style={{ width: '100%' }}>
        {yesterdayGames && yesterdayGames.length > 0 ? (
          yesterdayGames.map(g => <GameCard key={g.id} game={g} />)
        ) : (
          <EmptyCard msg="이전 경기 결과가 없습니다." />
        )}
      </View>
    </View>
  );
}

// ── 홈 탭 ─────────────────────────────────────────────────
function HomeTab({ games, yesterdayGames, onPick, animPick }: any) {
  const live = games.filter((g: any) => g.status === "live");
  const upcoming = games.filter((g: any) => g.status === "upcoming");
  const ended = games.filter((g: any) => g.status === "ended");
  const pickedCount = upcoming.filter((g: any) => g.pick).length;

  return (
    <View style={{ flex: 1 }}>
      {/* 오늘 예측 현황 배너 */}
      <View style={styles.summaryBanner}>
        <View>
          <Text style={styles.summaryLabel}>오늘의 예측 현황</Text>
          <Text style={styles.summaryCount}>
            {pickedCount} <Text style={styles.summaryTotal}>/ {upcoming.length}경기 예측 완료</Text>
          </Text>
        </View>
        <View style={[
          styles.summaryBadge,
          { borderColor: pickedCount === upcoming.length && upcoming.length > 0 ? C.green : C.red }
        ]}>
          <Text style={[
            styles.summaryBadgeText,
            { color: pickedCount === upcoming.length && upcoming.length > 0 ? C.green : C.red }
          ]}>
            {upcoming.length === 0 ? "완료" : `${pickedCount}/${upcoming.length}`}
          </Text>
        </View>
      </View>

      {/* 진행 중 경기 */}
      {live.length > 0 && (
        <Section title="진행 중" type="live">
          {live.map((g: any) => <GameCard key={g.id} game={g} onPick={onPick} animPick={animPick} />)}
        </Section>
      )}

      {/* 오늘 경기 예측 */}
      {upcoming.length > 0 && (
        <Section title={`오늘 예정된 경기 (${upcoming.length})`} type="upcoming">
          {upcoming.map((g: any) => <GameCard key={g.id} game={g} onPick={onPick} animPick={animPick} />)}
        </Section>
      )}

      {/* 오늘 종료된 경기 */}
      {ended.length > 0 && (
        <Section title={`오늘 종료된 경기 (${ended.length})`} type="ended">
          {ended.map((g: any) => <GameCard key={g.id} game={g} onPick={onPick} animPick={animPick} />)}
        </Section>
      )}

      {/* 어제 경기 결과 */}
      {yesterdayGames && yesterdayGames.length > 0 && (
        <View style={{ marginTop: 12 }}>
          <Section title="이전 경기 결과" type="ended">
            {yesterdayGames.map((g: any) => <GameCard key={g.id} game={g} />)}
          </Section>
        </View>
      )}
    </View>
  );
}

function Section({ title, type, children }: any) {
  return (
    <View style={styles.sectionContainer}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        {type === "live" && (
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: C.red, marginRight: 6 }} />
        )}
        {type === "upcoming" && (
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#3182F6', marginRight: 6 }} />
        )}
        {type === "ended" && (
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: C.green, marginRight: 6 }} />
        )}
        <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

// ── 경기 카드 ─────────────────────────────────────────────
function GameCard({ game, onPick, animPick }: any) {
  const home = TEAMS[game.home] || TEAMS.KIA;
  const away = TEAMS[game.away] || TEAMS.KIA;
  const isEnded = game.status === "ended";
  const homeWon = game.result === "home" || (isEnded && game.homeScore > game.awayScore);
  const awayWon = game.result === "away" || (isEnded && game.awayScore > game.homeScore);
  const pickHome = game.pick === "home";
  const pickAway = game.pick === "away";

  const actualResult = game.result || (game.homeScore > game.awayScore ? "home" : game.awayScore > game.homeScore ? "away" : "draw");
  const correct = game.pick && game.pick === actualResult;
  const wrong = game.pick && actualResult && game.pick !== actualResult;

  const animH = animPick === `${game.id}-home`;
  const animA = animPick === `${game.id}-away`;

  const isDraw = isEnded && game.homeScore === game.awayScore;

  return (
    <View style={[
      styles.gameCard,
      { borderColor: correct ? "#22C55E33" : wrong ? "#EF444433" : C.border }
    ]}>
      {/* 경기 탑바 */}
      <View style={styles.cardHeader}>
        <Text style={styles.cardStadium}>{game.stadium}</Text>
        <View style={styles.cardStatusRow}>
          {isEnded && (
            <Text style={[
              styles.statusBadge,
              {
                backgroundColor: correct ? "#DCFCE7" : wrong ? "#FEE2E2" : "#F3F4F6",
                color: correct ? "#16A34A" : wrong ? "#DC2626" : C.sub
              }
            ]}>
              {correct ? "적중" : wrong ? "실패" : "종료"}
            </Text>
          )}
          {isEnded ? (
            <Text style={[styles.statusText, { color: C.sub }]}>경기 종료</Text>
          ) : game.status === "live" ? (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: C.red, marginRight: 4 }} />
              <Text style={{ color: C.red, fontSize: 11, fontWeight: '700' }}>LIVE</Text>
            </View>
          ) : (
            <Text style={styles.statusText}>{game.time}</Text>
          )}
        </View>
      </View>

      {/* 매치업 */}
      <View style={styles.cardBody}>
        {/* 원정팀 */}
        <TeamButton
          team={away} side="away" game={game}
          picked={pickAway} won={awayWon} isDraw={isDraw} isEnded={isEnded}
          anim={animA} onPick={onPick}
          odds={game.awayOdds}
        />

        {/* 득점 정보 */}
        <View style={styles.vsContainer}>
          {isEnded || game.status === "live" ? (
            <View style={{ alignItems: 'center' }}>
              <Text style={[
                styles.scoreText,
                { color: game.status === "live" ? C.red : C.text }
              ]}>
                {game.awayScore} : {game.homeScore}
              </Text>
              <Text style={[
                styles.inningText,
                { color: game.status === "live" ? C.red : C.sub }
              ]}>
                {game.status === "live" ? (game.inning || "진행중") : "최종"}
              </Text>
            </View>
          ) : (
            <View style={{ alignItems: 'center' }}>
              <Text style={styles.vsText}>VS</Text>
              <Text style={styles.vsSub}>원정 · 홈</Text>
            </View>
          )}
        </View>

        {/* 홈팀 */}
        <TeamButton
          team={home} side="home" game={game}
          picked={pickHome} won={homeWon} isDraw={isDraw} isEnded={isEnded}
          anim={animH} onPick={onPick}
          odds={game.homeOdds}
          isHome
        />
      </View>
    </View>
  );
}

function TeamButton({ team, side, game, picked, won, isDraw, isEnded, anim, onPick, odds }: any) {
  const correct = picked && won;
  const wrong = picked && isEnded && !won;

  const handlePress = () => {
    if (!isEnded && onPick) {
      onPick(game.id, side);
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={isEnded ? 1.0 : 0.7}
      onPress={handlePress}
      style={[
        styles.teamButton,
        {
          backgroundColor: correct ? "#DCFCE7"
            : wrong ? "#FEE2E2"
              : picked ? `${team.color}15`
                : isEnded && won ? "#F0F9FF"
                  : "rgba(255,255,255,0.4)",
          borderColor: correct ? "#86EFAC"
            : wrong ? "#FCA5A5"
              : picked ? team.color
                : isEnded && won ? "#BAE6FD"
                  : "transparent",
          transform: [{ scale: anim ? 0.95 : 1.0 }]
        }
      ]}
    >
      <View style={styles.logoContainer}>
        <Image
          source={{ uri: team.logo }}
          style={[
            styles.teamLogo,
            { transform: team.short === "두산" ? [{ scale: 1.15 }] : [] }
          ]}
          resizeMode="contain"
        />
      </View>
      <Text style={styles.teamShort}>{team.short}</Text>
      {!isEnded && (
        <Text style={[styles.oddsText, { color: picked ? team.color : C.sub }]}>
          {picked ? "✓ 선택됨" : `배율 ${odds}`}
        </Text>
      )}
      {isEnded && isDraw && (
        <Text style={{ fontSize: 10, color: C.sub, fontWeight: '600' }}>무승부</Text>
      )}
      {isEnded && !isDraw && won && (
        <Text style={{ fontSize: 10, color: "#0284C7", fontWeight: '600' }}>승리</Text>
      )}
      {isEnded && !isDraw && !won && (
        <Text style={{ fontSize: 10, color: C.sub }}>패배</Text>
      )}
    </TouchableOpacity>
  );
}

function EmptyCard({ msg }: { msg: string }) {
  return (
    <View style={styles.historyCard}>
      <Text style={{ padding: 24, textAlign: 'center', color: C.sub, fontSize: 13 }}>
        {msg}
      </Text>
    </View>
  );
}

// ── 리그 순위 탭 ──────────────────────────────────────────
function LeagueTab({ records }: any) {
  if (!records || records.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <ActivityIndicator size="large" color={C.navy} />
        <Text style={{ marginTop: 16, color: C.sub }}>순위 데이터를 불러오는 중...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.leagueCard}>
        <View style={styles.leagueHeader}>
          <Text style={styles.leagueHeaderTitle}>2026 KBO 리그 순위</Text>
          <Text style={styles.leagueHeaderSubtitle}>실시간 업데이트</Text>
        </View>

        {/* 테이블 헤더 */}
        <View style={styles.tableHeader}>
          <Text style={[styles.th, { flex: 0.8 }]}>순위</Text>
          <Text style={[styles.th, { flex: 2, textAlign: 'left', paddingLeft: 10 }]}>팀</Text>
          <Text style={[styles.th, { flex: 1 }]}>경기</Text>
          <Text style={[styles.th, { flex: 0.8 }]}>승</Text>
          <Text style={[styles.th, { flex: 0.8 }]}>무</Text>
          <Text style={[styles.th, { flex: 0.8 }]}>패</Text>
          <Text style={[styles.th, { flex: 1.2 }]}>승률</Text>
        </View>

        {/* 테이블 로우 */}
        {records.map((r: any, idx: number) => {
          const teamId = getTeamId(r.teamName);
          const team = TEAMS[teamId];
          const isTop3 = idx < 3;
          return (
            <View
              key={r.teamName}
              style={[
                styles.tableRow,
                { backgroundColor: isTop3 ? "rgba(14,30,69,0.02)" : "transparent" }
              ]}
            >
              <Text style={[
                styles.td,
                { flex: 0.8, fontWeight: isTop3 ? '800' : '500', color: isTop3 ? C.navy : C.sub }
              ]}>
                {r.rank}
              </Text>

              <View style={[styles.teamCell, { flex: 2 }]}>
                <Image source={{ uri: team?.logo }} style={styles.tableLogo} resizeMode="contain" />
                <Text style={styles.teamNameText}>{team?.short || r.teamName}</Text>
              </View>

              <Text style={[styles.td, { flex: 1, color: C.sub }]}>
                {r.gamesPlayed || (r.wins + r.losses + r.draws)}
              </Text>
              <Text style={[styles.td, { flex: 0.8, fontWeight: '700' }]}>{r.wins}</Text>
              <Text style={[styles.td, { flex: 0.8, color: C.sub }]}>{r.draws}</Text>
              <Text style={[styles.td, { flex: 0.8 }]}>{r.losses}</Text>
              <Text style={[styles.td, { flex: 1.2, fontWeight: '600', color: C.navy }]}>
                {typeof r.winRate === "number" ? r.winRate.toFixed(3).substring(1) : r.winRate}
              </Text>
            </View>
          );
        })}
      </View>
      <Text style={styles.leagueFooter}>
        * KBO 공식 기록실 데이터를 바탕으로 제공됩니다.
      </Text>
    </View>
  );
}

// ── 내 기록 통계 탭 ────────────────────────────────────────
function StatsTab({ totalWins, total, streak, history }: any) {
  if (total === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 24, width: 24, justifyContent: 'space-between' }}>
            <View style={{ width: 4, height: 10, backgroundColor: '#3182F6', borderRadius: 2 }} />
            <View style={{ width: 4, height: 20, backgroundColor: '#3182F6', borderRadius: 2 }} />
            <View style={{ width: 4, height: 14, backgroundColor: '#3182F6', borderRadius: 2 }} />
          </View>
        </View>
        <Text style={styles.emptyTitle}>아직 예측 기록이 없습니다</Text>
        <Text style={styles.emptyDesc}>
          오늘의 경기를 예측하고{"\n"}첫 번째 적중 기록을 만들어보세요!
        </Text>
      </View>
    );
  }

  const rate = pct(totalWins, total);
  const getRateColor = (r: number) => r >= 70 ? "#22C55E" : r >= 50 ? C.gold : C.red;

  return (
    <View style={{ flex: 1 }}>
      {/* 메인 카드 */}
      <View style={styles.statsMainCard}>
        <Text style={styles.statsMainLabel}>나의 전체 적중률</Text>
        <Text style={[styles.statsRateText, { color: getRateColor(rate) }]}>
          {rate}<Text style={styles.statsRatePercent}>%</Text>
        </Text>
        <Text style={styles.statsMainDesc}>총 {total}경기 중 {totalWins}경기 적중</Text>

        {/* 진행률 */}
        <View style={styles.progressBarBg}>
          <View style={[
            styles.progressBarFill,
            { width: `${rate}%`, backgroundColor: getRateColor(rate) }
          ]} />
        </View>
      </View>

      {/* 스탯 상세 */}
      <View style={styles.statsGrid}>
        <View style={styles.statsGridItem}>
          <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
            <View style={{ width: 14, height: 14, borderRadius: 7, borderWidth: 1.5, borderColor: '#3182F6', borderStyle: 'dashed' }} />
          </View>
          <Text style={styles.statsGridValue}>{total}</Text>
          <Text style={styles.statsGridLabel}>총 예측</Text>
        </View>
        <View style={styles.statsGridItem}>
          <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#DCFCE7', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
            <View style={{ width: 10, height: 6, borderWidth: 2, borderColor: '#16A34A', borderTopWidth: 0, borderRightWidth: 0, transform: [{ rotate: '-45deg' }], marginTop: -2 }} />
          </View>
          <Text style={styles.statsGridValue}>{totalWins}</Text>
          <Text style={styles.statsGridLabel}>적중</Text>
        </View>
        <View style={styles.statsGridItem}>
          <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
            <View style={{ width: 8, height: 12, borderRadius: 4, backgroundColor: C.red }} />
          </View>
          <Text style={styles.statsGridValue}>{streak}</Text>
          <Text style={styles.statsGridLabel}>연속 적중</Text>
        </View>
      </View>

      {/* 최근 예측 히스토리 */}
      <View style={styles.historyCard}>
        <View style={styles.historyHeader}>
          <Text style={styles.historyHeaderTitle}>최근 예측 기록</Text>
        </View>
        {history.map((h: any, i: number) => {
          const home = (TEAMS[h.home] || TEAMS.KIA) as { name: string; short: string; color: string; bg: string; logo: string };
          const away = (TEAMS[h.away] || TEAMS.KIA) as { name: string; short: string; color: string; bg: string; logo: string };
          const pickedTeam = (h.pick === "home" ? home : away) as { name: string; short: string; color: string; bg: string; logo: string };
          return (
            <View key={i} style={[
              styles.historyRow,
              { borderBottomWidth: i < history.length - 1 ? 1 : 0 }
            ]}>
              <View style={styles.historyRowLeft}>
                <View style={styles.historyLogoContainer}>
                  <Image source={{ uri: pickedTeam.logo }} style={styles.historyLogo} resizeMode="contain" />
                </View>
                <View>
                  <Text style={styles.historyGameText}>{away.short} vs {home.short}</Text>
                  <Text style={styles.historyDateText}>{h.date} · {pickedTeam.short} 예측</Text>
                </View>
              </View>
              <Text style={[
                styles.historyBadge,
                {
                  backgroundColor: h.win ? "#DCFCE7" : "#FEE2E2",
                  color: h.win ? "#16A34A" : "#DC2626"
                }
              ]}>
                {h.win ? "적중" : "실패"}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ── 유저 랭킹 탭 ──────────────────────────────────────────
function RankingTab({ rankings }: any) {
  const medalColor = (r: number) => r === 1 ? C.gold : r === 2 ? C.silver : r === 3 ? C.bronze : C.sub;

  if (!rankings || rankings.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          <View style={{ width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: C.sub, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: C.sub, marginTop: -1 }}>!</Text>
          </View>
        </View>
        <Text style={styles.emptyTitle}>아직 승부예측을 한 사람이 없습니다</Text>
        <Text style={styles.emptyDesc}>
          오늘 경기의 첫 번째 주인공이 되어보세요!{"\n"}
          승리를 예측하고 랭킹을 올려보세요.
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {/* 1, 2, 3위 포디움 시상대 */}
      {rankings.length >= 3 && (
        <View style={styles.podiumCard}>
          <Text style={styles.podiumTitle}>🏆 이번 시즌 랭킹</Text>
          <View style={styles.podiumRow}>
            {/* 2위 */}
            <View style={styles.podiumCol}>
              <Text style={[styles.podiumMedal, { fontSize: 22 }]}>🥈</Text>
              <Text style={styles.podiumName}>{rankings[1].name}</Text>
              <Text style={styles.podiumRate}>{pct(rankings[1].correct, rankings[1].total)}%</Text>
              <View style={[
                styles.podiumBar,
                { height: 36, backgroundColor: `${C.silver}33`, borderColor: `${C.silver}55` }
              ]} />
            </View>

            {/* 1위 */}
            <View style={styles.podiumCol}>
              <Text style={[styles.podiumMedal, { fontSize: 28 }]}>🥇</Text>
              <Text style={styles.podiumName}>{rankings[0].name}</Text>
              <Text style={styles.podiumRate}>{pct(rankings[0].correct, rankings[0].total)}%</Text>
              <View style={[
                styles.podiumBar,
                { height: 52, backgroundColor: `${C.gold}33`, borderColor: `${C.gold}55` }
              ]} />
            </View>

            {/* 3위 */}
            <View style={styles.podiumCol}>
              <Text style={[styles.podiumMedal, { fontSize: 22 }]}>🥉</Text>
              <Text style={styles.podiumName}>{rankings[2].name}</Text>
              <Text style={styles.podiumRate}>{pct(rankings[2].correct, rankings[2].total)}%</Text>
              <View style={[
                styles.podiumBar,
                { height: 28, backgroundColor: `${C.bronze}33`, borderColor: `${C.bronze}55` }
              ]} />
            </View>
          </View>
        </View>
      )}

      {/* 전체 랭킹 리스트 */}
      <View style={styles.rankingListCard}>
        <View style={styles.rankingListHeader}>
          <Text style={styles.rankingHeaderCol}>순위 · 닉네임</Text>
          <Text style={styles.rankingHeaderCol}>적중률 (적중/총)</Text>
        </View>
        {rankings.map((r: any, i: number) => (
          <View
            key={r.rank}
            style={[
              styles.rankingRow,
              {
                backgroundColor: r.isMe ? "#EFF6FF" : "transparent",
                borderBottomWidth: i < rankings.length - 1 ? 1 : 0
              }
            ]}
          >
            <View style={styles.rankingRowLeft}>
              <Text style={[
                styles.rankText,
                {
                  fontSize: r.rank <= 3 ? 18 : 13,
                  fontWeight: r.rank <= 3 ? '400' : '700',
                  color: medalColor(r.rank)
                }
              ]}>
                {r.rank <= 3 ? (r.rank === 1 ? "🥇" : r.rank === 2 ? "🥈" : "🥉") : r.rank}
              </Text>
              <View>
                <View style={styles.rankingNameRow}>
                  <Text style={[styles.rankingName, { color: r.isMe ? "#1D4ED8" : C.text }]}>{r.name}</Text>
                  {r.isMe && <Text style={styles.meBadge}>나</Text>}
                </View>
                {r.streak > 0 && <Text style={styles.rankingStreak}>🔥 {r.streak}연속 적중</Text>}
              </View>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={[
                styles.rankingRate,
                { color: pct(r.correct, r.total) >= 70 ? C.green : C.text }
              ]}>
                {pct(r.correct, r.total)}%
              </Text>
              <Text style={styles.rankingGames}>{r.correct}/{r.total}경기</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

// ── 하단 탭 바 ────────────────────────────────────────────
function BottomNav({ tab, setTab }: { tab: string; setTab: (t: string) => void }) {
  const tabs = [
    { id: "home", label: "홈" },
    { id: "league", label: "KBO 순위" },
    { id: "stats", label: "내 기록" },
    { id: "ranking", label: "유저" },
  ];

  return (
    <View style={[styles.bottomNav, { paddingBottom: 16, height: 60, alignItems: 'center' }]}>
      {tabs.map(t => {
        const active = tab === t.id;
        return (
          <TouchableOpacity
            key={t.id}
            onPress={() => setTab(t.id)}
            style={[styles.navButton, { height: '100%', justifyContent: 'center' }]}
          >
            <Text style={[
              styles.navLabel,
              {
                fontSize: 13,
                fontWeight: active ? '700' : '500',
                color: active ? '#3182F6' : C.sub,
                textAlign: 'center'
              }
            ]}>
              {t.label}
            </Text>
            {active && (
              <View style={[
                styles.activeIndicator,
                {
                  backgroundColor: '#3182F6',
                  width: 24,
                  height: 3,
                  borderRadius: 1.5,
                  marginTop: 4,
                  alignSelf: 'center'
                }
              ]} />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ── 토스트 알림 ───────────────────────────────────────────
function Toast({ msg }: { msg: string }) {
  return (
    <View style={styles.toastContainer}>
      <Text style={styles.toastText}>⚾ {msg}</Text>
    </View>
  );
}

// ── 스타일 명세 ───────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  header: {
    backgroundColor: C.navy,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -1,
    marginRight: 8,
  },
  alphaBadge: {
    backgroundColor: C.red,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  alphaText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#8899BB',
    marginTop: 2,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Bottom Tab Bar
  bottomNav: {
    backgroundColor: C.card,
    borderTopWidth: 1,
    borderTopColor: C.border,
    flexDirection: 'row',
    paddingVertical: 8,
    paddingBottom: 24, // 아이폰 세이프 에어리어 대비 여백
  },
  navButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navIcon: {
    fontSize: 20,
    marginBottom: 3,
  },
  navLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  activeIndicator: {
    width: 20,
    height: 2.5,
    backgroundColor: C.red,
    borderRadius: 2,
    marginTop: 2,
  },
  // Scrollable layouts
  scrollContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 100, // 하단 탭 바 겹침 방지 여백
  },
  summaryBanner: {
    backgroundColor: C.navy,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 18,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    color: '#8899BB',
    fontSize: 11,
    marginBottom: 4,
  },
  summaryCount: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
  },
  summaryTotal: {
    fontSize: 13,
    fontWeight: '400',
    color: '#8899BB',
  },
  summaryBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: C.sub,
    marginBottom: 8,
    paddingLeft: 2,
  },
  // Game Cards
  gameCard: {
    backgroundColor: C.card,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1.5,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: '#F9FAFB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  cardStadium: {
    fontSize: 11,
    color: C.sub,
  },
  cardStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    fontSize: 10,
    fontWeight: '700',
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardBody: {
    paddingVertical: 14,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  vsContainer: {
    width: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vsText: {
    fontSize: 13,
    fontWeight: '800',
    color: C.sub,
  },
  vsSub: {
    fontSize: 10,
    color: '#CCC',
  },
  scoreText: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -1,
  },
  inningText: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  // Team buttons
  teamButton: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  logoContainer: {
    width: 56,
    height: 56,
    marginBottom: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  teamLogo: {
    width: '100%',
    height: '100%',
  },
  teamShort: {
    fontSize: 11,
    fontWeight: '700',
    color: C.text,
    marginBottom: 1,
  },
  oddsText: {
    fontSize: 10,
  },
  // League table
  leagueCard: {
    backgroundColor: C.card,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  leagueHeader: {
    padding: 16,
    backgroundColor: C.navy,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leagueHeaderTitle: {
    fontWeight: '800',
    fontSize: 15,
    color: '#fff',
  },
  leagueHeaderSubtitle: {
    fontSize: 11,
    color: '#fff',
    opacity: 0.8,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    paddingVertical: 10,
  },
  th: {
    color: C.sub,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    paddingVertical: 12,
    alignItems: 'center',
  },
  td: {
    fontSize: 13,
    color: C.text,
    textAlign: 'center',
  },
  teamCell: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 8,
  },
  tableLogo: {
    width: 24,
    height: 24,
    marginRight: 8,
  },
  teamNameText: {
    fontWeight: '700',
    fontSize: 13,
    color: C.text,
  },
  leagueFooter: {
    marginTop: 12,
    fontSize: 11,
    color: C.sub,
    textAlign: 'center',
  },
  // Empty states
  emptyContainer: {
    paddingVertical: 80,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: C.text,
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 14,
    color: C.sub,
    lineHeight: 20,
    textAlign: 'center',
  },
  // Stats
  statsMainCard: {
    backgroundColor: C.navy,
    borderRadius: 18,
    paddingVertical: 24,
    paddingHorizontal: 20,
    marginBottom: 16,
    alignItems: 'center',
  },
  statsMainLabel: {
    color: '#8899BB',
    fontSize: 12,
    marginBottom: 8,
  },
  statsRateText: {
    fontSize: 64,
    fontWeight: '900',
    lineHeight: 64,
    letterSpacing: -2,
  },
  statsRatePercent: {
    fontSize: 28,
    color: '#8899BB',
  },
  statsMainDesc: {
    color: '#8899BB',
    fontSize: 12,
    marginTop: 8,
  },
  progressBarBg: {
    height: 6,
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    marginTop: 14,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statsGridItem: {
    flex: 1,
    backgroundColor: C.card,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.border,
    marginHorizontal: 4,
  },
  statsGridIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  statsGridValue: {
    fontSize: 22,
    fontWeight: '800',
    color: C.text,
  },
  statsGridLabel: {
    fontSize: 10,
    color: C.sub,
  },
  historyCard: {
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
    marginBottom: 20,
  },
  historyHeader: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  historyHeaderTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: C.text,
  },
  historyRow: {
    paddingVertical: 11,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  historyRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyLogoContainer: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  historyLogo: {
    width: '100%',
    height: '100%',
  },
  historyGameText: {
    fontSize: 12,
    fontWeight: '600',
    color: C.text,
  },
  historyDateText: {
    fontSize: 11,
    color: C.sub,
    marginTop: 2,
  },
  historyBadge: {
    fontSize: 11,
    fontWeight: '700',
    paddingVertical: 3,
    paddingHorizontal: 9,
    borderRadius: 6,
  },
  // Podiums
  podiumCard: {
    backgroundColor: C.navy,
    borderRadius: 18,
    paddingTop: 20,
    paddingHorizontal: 16,
    paddingBottom: 16,
    marginBottom: 16,
  },
  podiumTitle: {
    textAlign: 'center',
    color: '#8899BB',
    fontSize: 11,
    marginBottom: 16,
  },
  podiumRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  podiumCol: {
    alignItems: 'center',
    flex: 1,
  },
  podiumMedal: {
    marginBottom: 4,
  },
  podiumName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 2,
  },
  podiumRate: {
    fontSize: 11,
    color: '#8899BB',
  },
  podiumBar: {
    marginTop: 8,
    width: '80%',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    borderWidth: 1.5,
  },
  // User ranking list
  rankingListCard: {
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
    marginBottom: 20,
  },
  rankingListHeader: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rankingHeaderCol: {
    fontSize: 11,
    color: C.sub,
    fontWeight: '600',
  },
  rankingRow: {
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rankingRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rankText: {
    minWidth: 24,
    textAlign: 'center',
    marginRight: 12,
  },
  rankingNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rankingName: {
    fontSize: 13,
    fontWeight: '600',
  },
  meBadge: {
    fontSize: 9,
    fontWeight: '700',
    paddingVertical: 1,
    paddingHorizontal: 5,
    backgroundColor: '#DBEAFE',
    color: '#1D4ED8',
    borderRadius: 4,
    marginLeft: 6,
  },
  rankingStreak: {
    fontSize: 10,
    color: C.sub,
    marginTop: 2,
  },
  rankingRate: {
    fontSize: 15,
    fontWeight: '800',
  },
  rankingGames: {
    fontSize: 10,
    color: C.sub,
    marginTop: 2,
    textAlign: 'right',
  },
  // Custom Toast
  toastContainer: {
    position: 'absolute',
    top: 74,
    left: '50%',
    transform: [{ translateX: -80 }], // centers the toast roughly
    backgroundColor: C.navy,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 5,
    zIndex: 999,
  },
  toastText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  // OffTime
  offTimeContainer: {
    paddingVertical: 60,
    paddingHorizontal: 24,
    alignItems: 'center',
    backgroundColor: C.bg,
    flex: 1,
  },
  offTimeBox: {
    backgroundColor: '#fff',
    paddingVertical: 44,
    paddingHorizontal: 28,
    borderRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 25 },
    shadowOpacity: 0.05,
    shadowRadius: 50,
    elevation: 4,
    alignItems: 'center',
    maxWidth: 340,
    width: '100%',
    marginBottom: 40,
  },
  offTimeIcon: {
    fontSize: 64,
    marginBottom: 24,
  },
  offTimeTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: C.text,
    marginBottom: 14,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  offTimeDesc: {
    fontSize: 14,
    color: C.sub,
    lineHeight: 24,
    textAlign: 'center',
  },
  offTimeHighlight: {
    color: C.navy,
    fontWeight: '800',
  },
  offTimeHeader: {
    fontSize: 16,
    fontWeight: '800',
    color: C.text,
    marginBottom: 12,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
  },
});
