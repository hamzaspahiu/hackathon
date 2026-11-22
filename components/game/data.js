import { Clock3, Flag, Pencil, RotateCw, Shield } from "lucide-react";

export const countries = [
  { name: "Japan", code: "jp", difficulty: "easy" },
  { name: "Brazil", code: "br", difficulty: "easy" },
  { name: "France", code: "fr", difficulty: "easy" },
  { name: "United States", code: "us", difficulty: "easy" },
  { name: "Canada", code: "ca", difficulty: "easy" },
  { name: "Italy", code: "it", difficulty: "easy" },
  { name: "Germany", code: "de", difficulty: "easy" },
  { name: "India", code: "in", difficulty: "easy" },
  { name: "South Korea", code: "kr", difficulty: "medium" },
  { name: "Mexico", code: "mx", difficulty: "medium" },
  { name: "Sweden", code: "se", difficulty: "medium" },
  { name: "Greece", code: "gr", difficulty: "medium" },
  { name: "Turkey", code: "tr", difficulty: "medium" },
  { name: "Argentina", code: "ar", difficulty: "medium" },
  { name: "South Africa", code: "za", difficulty: "medium" },
  { name: "Thailand", code: "th", difficulty: "medium" },
  { name: "Albania", code: "al", difficulty: "hard" },
  { name: "Bhutan", code: "bt", difficulty: "hard" },
  { name: "Nepal", code: "np", difficulty: "hard" },
  { name: "Mozambique", code: "mz", difficulty: "hard" },
  { name: "Seychelles", code: "sc", difficulty: "hard" },
  { name: "Eswatini", code: "sz", difficulty: "hard" },
  { name: "Kazakhstan", code: "kz", difficulty: "hard" },
  { name: "Kyrgyzstan", code: "kg", difficulty: "hard" },
  { name: "Sri Lanka", code: "lk", difficulty: "hard" },
  { name: "Papua New Guinea", code: "pg", difficulty: "hard" },
  { name: "Iceland", code: "is", difficulty: "medium" },
  { name: "Denmark", code: "dk", difficulty: "easy" },
  { name: "Norway", code: "no", difficulty: "medium" },
  { name: "Portugal", code: "pt", difficulty: "medium" },
  { name: "China", code: "cn", difficulty: "easy" },
  { name: "Switzerland", code: "ch", difficulty: "medium" },
  { name: "Jamaica", code: "jm", difficulty: "hard" },
  { name: "Ukraine", code: "ua", difficulty: "easy" },
  { name: "Poland", code: "pl", difficulty: "easy" },
  { name: "Finland", code: "fi", difficulty: "medium" },
];
export const modes = [
  {
    id: "classic",
    name: "Classic quiz",
    detail: "10 flags. One perfect round.",
    tag: "10 QUESTIONS",
    icon: Flag,
    color: "coral",
  },
  {
    id: "time",
    name: "Time attack",
    detail: "How many can you name in 60 seconds?",
    tag: "60 SECONDS",
    icon: Clock3,
    color: "lime",
  },
  {
    id: "endless",
    name: "Endless",
    detail: "One wrong answer ends the run.",
    tag: "UNTIL YOU MISS",
    icon: RotateCw,
    color: "blue",
  },
  {
    id: "hard",
    name: "Hard mode",
    detail: "Closer calls. Less time. Bigger points.",
    tag: "EXPERT",
    icon: Shield,
    color: "gold",
  },
  {
    id: "draw",
    name: "Draw the flag",
    detail: "Recreate a flag from memory.",
    tag: "CREATIVE",
    icon: Pencil,
    color: "violet",
  },
];
export const defaultStats = {
  games: 0,
  questions: 0,
  correct: 0,
  best: 0,
  streak: 0,
  timeBest: 0,
  drawBest: 0,
};
export const flagSrc = (code) => `https://flagcdn.com/${code}.svg`;
export const pick = (items) => items[Math.floor(Math.random() * items.length)];
export const shuffle = (items) => {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};
