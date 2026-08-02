export interface ScheduleItem {
  date: string;
  startTime: string;
  endTime: string;
  title: string;
  note?: string;
  [key: string]: any;
}

export interface MealItem {
  type: string; // 아침, 점심, 저녁, 야식
  time: string; // e.g. "08:00 - 09:00"
  menu: string; // e.g. "제육볶음, 계란말이..."
  highlight?: string; // e.g. "웰컴 바비큐 정식"
}

export interface MealDay {
  date: string; // e.g. "2026-08-16"
  dayLabel: string; // e.g. "1일차 (일)"
  items: MealItem[];
}

export interface AdminReply {
  id: string;
  author: string; // e.g. "임원진", "사역팀"
  content: string;
  createdAt: string;
}

export interface ComplaintItem {
  id: string;
  title: string;
  content: string;
  author?: string; // 작성자 닉네임
  isPrivate: boolean; // 비공개 여부
  passcode?: string; // 비공개 시 4자리 숫자 암호
  createdAt: string;
  status: "pending" | "resolved"; // 답변 대기 / 처리 완료
  replies?: AdminReply[];
}

export interface LectureQaItem {
  id: string;
  question: string;
  author?: string;
  lectureTitle?: string; // 특강명 / 설교명
  likes: number;
  createdAt: string;
  pastorAnswer?: string; // 목사님/강사님 답변 기록
  answeredAt?: string;
}
