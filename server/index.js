import express from 'express';
import cors from 'cors';
import axios from 'axios';
import * as cheerio from 'cheerio';

const app = express();
const PORT = process.env.PORT || 3001;

// CORS 설정: 로컬 개발 시 리액트 앱(5173)과 통신 허용
app.use(cors());
app.use(express.json());

// 날짜 포맷 함수 (YYYY-MM-DD)
const getTodayDateStr = () => {
  const d = new Date();
  d.setHours(d.getHours() + 9); // 한국 시간(KST) 보정
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const d2 = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d2}`;
};

// 한국 시간(KST) 현재 객체 반환 함수
const getKSTNow = () => {
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  return new Date(utc + (3600000 * 9));
};


// 팀명 매핑
const TEAM_MAP = {
  "KIA": "KIA", "기아": "KIA",
  "삼성": "SS", "LG": "LG",
  "두산": "DB", "KT": "KT",
  "SSG": "SSG", "롯데": "LOT",
  "한화": "HH", "NC": "NC",
  "키움": "KIW",
};

function mapTeam(name) {
  for (const [key, val] of Object.entries(TEAM_MAP)) {
    if (name && name.includes(key)) return val;
  }
  return "KIA";
}

// 시간 및 버튼 기반 경기 상태 판별 폴백 함수
function getFallbackStatus(timeStr, cancelReason, targetDate, row) {
  if (cancelReason && cancelReason !== '-') {
    return "canceled";
  }
  const todayDateStr = getTodayDateStr();
  const hasReview = row.some(col => col.Text && (col.Text.includes('btnReview') || col.Text.includes('리뷰')));

  if (targetDate < todayDateStr) {
    return "ended";
  } else if (targetDate > todayDateStr) {
    return "upcoming";
  } else {
    // 오늘 경기인 경우
    if (hasReview) {
      return "ended";
    }
    const timeMatch = timeStr.match(/(\d{2}):(\d{2})/);
    if (timeMatch) {
      const gameHour = parseInt(timeMatch[1], 10);
      const gameMin = parseInt(timeMatch[2], 10);
      const kstNow = getKSTNow();
      const gameStartTime = new Date(kstNow.getFullYear(), kstNow.getMonth(), kstNow.getDate(), gameHour, gameMin, 0);

      if (kstNow >= gameStartTime) {
        return "live";
      }
    }
    return "upcoming";
  }
}

app.get('/api/games/:date', async (req, res) => {
  try {
    const targetDate = req.params.date === 'today' ? getTodayDateStr() : req.params.date;
    console.log(`[API Request] Fetching KBO data for ${targetDate}...`);

    const [year, month, day] = targetDate.split('-');

    // 1. 실시간 라이브 스코어 및 이닝 정보 미리 가져오기
    let liveGamesMap = {};
    try {
      const liveDateStr = targetDate.replace(/-/g, '');
      const liveRes = await axios.post(
        'https://www.koreabaseball.com/ws/Main.asmx/GetKboGameList',
        `leId=1&srId=0&date=${liveDateStr}`,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Referer': 'https://www.koreabaseball.com/',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
          },
          timeout: 4000
        }
      );
      if (liveRes.data && Array.isArray(liveRes.data.game)) {
        for (const g of liveRes.data.game) {
          const awayKey = mapTeam(g.AWAY_NM);
          const homeKey = mapTeam(g.HOME_NM);
          liveGamesMap[`${awayKey}-${homeKey}`] = g;
        }
      }
    } catch (e) {
      console.error("[GetKboGameList] 실시간 스코어 조회 실패:", e.message);
    }

    const response = await axios.post(
      'https://www.koreabaseball.com/ws/Schedule.asmx/GetScheduleList',
      `leId=1&srIdList=0,1,3,4,5,7,9&seasonId=${year}&gameMonth=${month}&teamId=`,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Referer': 'https://www.koreabaseball.com/',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        }
      }
    );

    const data = response.data;
    const games = [];
    let currentDateStr = '';

    if (data.rows && data.rows.length > 0) {
      for (const rowData of data.rows) {
        const row = rowData.row;

        let dateIndex = 0;
        let timeIndex = 1;
        let playIndex = 2;
        let stadiumIndex = 7;

        if (row[0].Class === 'day') {
          currentDateStr = row[0].Text.substring(0, 5).replace('.', ''); // "05.01" -> "0501"
        } else {
          timeIndex = 0;
          playIndex = 1;
          stadiumIndex = 6;
        }

        if (currentDateStr !== month + day) continue;

        const timeHtml = row[timeIndex].Text;
        const playHtml = row[playIndex].Text;
        const stadiumName = row[stadiumIndex].Text;

        const $play = cheerio.load(playHtml);
        const spans = $play('span');

        if (spans.length < 3) continue;

        const awayTeamName = $play(spans[0]).text();
        const homeTeamName = $play(spans[spans.length - 1]).text();

        const awayMapped = mapTeam(awayTeamName);
        const homeMapped = mapTeam(homeTeamName);
        const liveGame = liveGamesMap[`${awayMapped}-${homeMapped}`];

        let homeScore = 0;
        let awayScore = 0;
        let inning = null;

        if (liveGame) {
          awayScore = parseInt(liveGame.T_SCORE_CN, 10) || 0;
          homeScore = parseInt(liveGame.B_SCORE_CN, 10) || 0;
          if (liveGame.GAME_INN_NO) {
            inning = `${liveGame.GAME_INN_NO}회${liveGame.GAME_TB_SC_NM || ''}`;
          }
        } else {
          const em = $play('em');
          if (em.length > 0) {
            const scoreSpans = em.find('span');
            if (scoreSpans.length >= 3) {
              awayScore = parseInt($play(scoreSpans[0]).text()) || 0;
              homeScore = parseInt($play(scoreSpans[2]).text()) || 0;
            }
          }
        }

        const $time = cheerio.load(timeHtml);
        const timeStr = $time.text().trim();

        const cancelReasonIndex = row.length - 1;
        const cancelReason = row[cancelReasonIndex].Text;

        let status = "upcoming";
        if (liveGame) {
          if (liveGame.CANCEL_SC_ID && liveGame.CANCEL_SC_ID !== '0') {
            status = "canceled";
          } else if (liveGame.GAME_STATE_SC === '3') {
            status = "ended";
          } else if (liveGame.GAME_STATE_SC === '2') {
            status = "live";
          } else if (liveGame.GAME_STATE_SC === '1') {
            status = "upcoming";
          } else {
            status = getFallbackStatus(timeStr, cancelReason, targetDate, row);
          }
        } else {
          status = getFallbackStatus(timeStr, cancelReason, targetDate, row);
        }

        games.push({
          id: `${targetDate}-${awayTeamName}-${homeTeamName}`,
          home: homeMapped,
          away: awayMapped,
          time: timeStr,
          stadium: stadiumName,
          status,
          pick: null,
          result: status === "ended" ? (homeScore > awayScore ? "home" : awayScore > homeScore ? "away" : "draw") : null,
          homeOdds: 1.80,
          awayOdds: 1.90,
          homeScore,
          awayScore,
          inning,
        });
      }
    }

    return res.json({ code: "OK", data: games });

  } catch (error) {
    console.error('서버 에러:', error);
    res.status(500).json({ error: "데이터를 가져오는 중 문제가 발생했습니다." });
  }
});

// 순위 API 엔드포인트 추가 (프론트엔드의 /api/standings 요청 처리)
app.get('/api/standings', async (req, res) => {
  try {
    const response = await axios.get('https://www.koreabaseball.com/Record/TeamRank/TeamRankDaily.aspx', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });
    
    const $ = cheerio.load(response.data);
    const rows = $('.tData tbody tr');
    const standings = [];
    
    rows.each((i, row) => {
      const rank = $(row).find('td').eq(0).text().trim();
      const teamName = $(row).find('td').eq(1).text().trim();
      const games = $(row).find('td').eq(2).text().trim();
      const win = $(row).find('td').eq(3).text().trim();
      const lose = $(row).find('td').eq(4).text().trim();
      const draw = $(row).find('td').eq(5).text().trim();
      const winRate = $(row).find('td').eq(6).text().trim();
      
      if (teamName) {
        standings.push({ 
          rank: parseInt(rank) || i + 1, 
          teamName, 
          gamesPlayed: parseInt(games) || 0, 
          wins: parseInt(win) || 0, 
          losses: parseInt(lose) || 0, 
          draws: parseInt(draw) || 0, 
          winRate: parseFloat(winRate) || 0 
        });
      }
    });

    return res.json({ code: "OK", data: standings.slice(0, 10) });
  } catch (error) {
    console.error('순위 데이터 가져오기 실패:', error);
    res.status(500).json({ error: "순위 데이터를 가져오는 중 문제가 발생했습니다." });
  }
});

app.listen(PORT, () => {
  console.log(`⚾ 홈런픽 크롤링 백엔드 서버가 http://localhost:${PORT} 에서 실행 중입니다!`);
});
