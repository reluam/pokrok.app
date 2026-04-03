// Shared constants and types for the manual dashboard

export const WHEEL_AREAS = [
  { key: "kariera", short: "Kariéra" },
  { key: "finance", short: "Finance" },
  { key: "zdravi",  short: "Zdraví" },
  { key: "rodina",  short: "Rodina" },
  { key: "pratele", short: "Přátelé" },
  { key: "rozvoj",  short: "Rozvoj" },
  { key: "volny",   short: "Volný čas" },
  { key: "smysl",   short: "Smysl" },
];

export type CheckinEntry = {
  score: number | null;
  week_start_date: string;
  value_scores?: Record<string, number>;
  area_scores?: Record<string, number>;
};
