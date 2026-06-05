/* ============================================================
   BIT FC - FAKE DATA
   ============================================================ */

const BITFC_DATA = {

  /* ---------- TEAM INFO ---------- */
  team: {
    name: "BIT FC",
    fullName: "Banking IT Football Club",
    slogan: "The Pride of Banking IT",
    founded: 2010,
    stadium: "Sân Bóng Đá Nhân Tạo ABC, Cầu Giấy, Hà Nội",
    coach: "Nguyễn Minh Đức",
    logo: "assets/logoBit.png",
    primaryColor: "#DA291C",
    season: "2024–25"
  },

  /* ---------- SEASON STATS ---------- */
  seasonStats: {
    played:     24,
    won:        16,
    drawn:       0,
    lost:        8,
    goalsFor:   39,
    goalsAgainst: 19,
    points:     48,
    rank:        2,
    winRate:    67,
    cleanSheets: 6,
    avgGoalsPerGame: 1.6
  },

  /* ---------- NEXT MATCH ---------- */
  nextMatch: {
    opponent:    "Dev United",
    date:        "Thứ 7, 07/06/2026",
    time:        "08:00 SA",
    venue:       "Sân Bóng ABC, Cầu Giấy",
    isHome:      true,
    competition: "V.League Nội bộ"
  },

  /* ---------- RECENT FORM (last 5) ---------- */
  recentForm: ["W", "W", "D", "W", "L"],

  /* ---------- DETAILED STATS ---------- */
  teamStats: {
    goalsFor:    39,
    goalsAgainst:19,
    totalShots:  156,
    possession:  54
  },

  /* ---------- GOALS BY MONTH ---------- */
  monthlyGoals: [
    { month: "T1", scored: 2, conceded: 1 },
    { month: "T2", scored: 3, conceded: 2 },
    { month: "T3", scored: 5, conceded: 2 },
    { month: "T4", scored: 7, conceded: 3 },
    { month: "T5", scored: 6, conceded: 2 },
    { month: "T6", scored: 8, conceded: 3 },
    { month: "T7", scored: 5, conceded: 2 },
    { month: "T8", scored: 4, conceded: 1 },
    { month: "T9", scored: 6, conceded: 3 },
    { month: "T10",scored: 7, conceded: 2 },
    { month: "T11",scored: 5, conceded: 2 },
    { month: "T12",scored: 4, conceded: 1 }
  ],

  /* ---------- RECENT MATCHES ---------- */
  recentMatches: [
    { home: "BIT FC",    away: "Backend FC",  homeScore: 3, awayScore: 0, date: "28/05", competition: "Nội bộ",  result: "W" },
    { home: "Dev United",away: "BIT FC",      homeScore: 1, awayScore: 1, date: "21/05", competition: "Giao hữu",result: "D" },
    { home: "BIT FC",    away: "Data Team",   homeScore: 4, awayScore: 1, date: "14/05", competition: "Nội bộ",  result: "W" },
    { home: "Cloud FC",  away: "BIT FC",      homeScore: 2, awayScore: 3, date: "07/05", competition: "Giao hữu",result: "L" }
  ],

  /* ---------- STANDINGS ---------- */
  standings: [
    { rank: 1, name: "Frontend FC",  won: 16, drawn: 2, lost:  6, points: 50, isTeam: false },
    { rank: 2, name: "BIT FC",       won: 16, drawn: 0, lost:  8, points: 48, isTeam: true  },
    { rank: 3, name: "Dev United",   won: 14, drawn: 3, lost:  7, points: 45, isTeam: false },
    { rank: 4, name: "Backend FC",   won: 13, drawn: 4, lost:  7, points: 43, isTeam: false },
    { rank: 5, name: "Cloud FC",     won: 11, drawn: 5, lost:  8, points: 38, isTeam: false },
    { rank: 6, name: "Data Team",    won:  9, drawn: 4, lost: 11, points: 31, isTeam: false }
  ],

  /* ---------- TOP SCORERS ---------- */
  topScorers: [
    { name: "Nguyễn Tuấn",  position: "Tiền đạo",     number: 9,  initials: "NT", goals:   12, color: "#8B0000" },
    { name: "Văn Hùng",     position: "Tiền đạo",     number: 11, initials: "VH", goals:    8, color: "#4A0000" },
    { name: "Trọng Lâm",    position: "Tiền vệ",      number: 8,  initials: "TL", goals:    6, color: "#3a1a1a" },
    { name: "Minh Hiếu",    position: "Tiền vệ",      number: 10, initials: "MH", goals:    5, color: "#1a0808" }
  ],

  /* ---------- TOP ASSISTS ---------- */
  topAssists: [
    { name: "Quang Lịnh",   position: "Tiền vệ trái", number: 7,  initials: "QL", assists:  9, color: "#8B0000" },
    { name: "Thái Nam",     position: "Tiền vệ",      number: 6,  initials: "TN", assists:  7, color: "#4A0000" },
    { name: "Nguyễn Tuấn",  position: "Tiền đạo",     number: 9,  initials: "NT", assists:  5, color: "#8B0000" },
    { name: "Hoàng Bắc",    position: "Hậu vệ phải",  number: 2,  initials: "HB", assists:  4, color: "#3a1a1a" }
  ],

  /* ---------- MEDIA ---------- */
  media: [
    { type: "video", title: "Highlight trận BIT FC 3–0 Backend FC",         date: "28/05/2025", duration: "4:32" },
    { type: "article", title: "BIT FC vươn lên vị trí thứ 2 bảng xếp hạng", date: "25/05/2025", category: "Tin tức" },
    { type: "video", title: "Kỹ năng cá nhân #9 Nguyễn Tuấn – Skills 2025", date: "20/05/2025", duration: "2:47" },
    { type: "article", title: "Phân tích sơ đồ 4-3-3 của HLV Minh Đức",     date: "18/05/2025", category: "Phân tích" }
  ],

  /* ---------- PLAYERS (full squad) ---------- */
  players: [
    { name: "Minh Khoa",    position: "Thủ môn",      number: 1,  initials: "MK", nationality: "Việt Nam", status: "active" },
    { name: "Hoàng Bắc",    position: "Hậu vệ phải",  number: 2,  initials: "HB", nationality: "Việt Nam", status: "active" },
    { name: "Thanh Sơn",    position: "Trung vệ",     number: 4,  initials: "TS", nationality: "Việt Nam", status: "active" },
    { name: "Đức Anh",      position: "Trung vệ",     number: 5,  initials: "ĐA", nationality: "Việt Nam", status: "active" },
    { name: "Văn Phúc",     position: "Hậu vệ trái",  number: 3,  initials: "VP", nationality: "Việt Nam", status: "injured" },
    { name: "Thái Nam",     position: "Tiền vệ",      number: 6,  initials: "TN", nationality: "Việt Nam", status: "active" },
    { name: "Quang Lịnh",   position: "Tiền vệ trái", number: 7,  initials: "QL", nationality: "Việt Nam", status: "active" },
    { name: "Trọng Lâm",    position: "Tiền vệ",      number: 8,  initials: "TL", nationality: "Việt Nam", status: "active" },
    { name: "Nguyễn Tuấn",  position: "Tiền đạo",     number: 9,  initials: "NT", nationality: "Việt Nam", status: "active" },
    { name: "Minh Hiếu",    position: "Tiền vệ",      number: 10, initials: "MH", nationality: "Việt Nam", status: "active" },
    { name: "Văn Hùng",     position: "Tiền đạo",     number: 11, initials: "VH", nationality: "Việt Nam", status: "active" },
    { name: "Quốc Bảo",     position: "Tiền đạo",     number: 14, initials: "QB", nationality: "Việt Nam", status: "active" }
  ],

  /* ---------- STAFF ---------- */
  staff: [
    { name: "Nguyễn Minh Đức", role: "Huấn luyện viên trưởng", initials: "NMĐ" },
    { name: "Trần Hữu Lộc",   role: "Trợ lý HLV",             initials: "THL" },
    { name: "Lê Văn Hải",     role: "Bác sĩ đội",             initials: "LVH" },
    { name: "Phạm Thế Anh",   role: "Quản lý đội",            initials: "PTA" }
  ]
};
