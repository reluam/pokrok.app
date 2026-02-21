export type LeadStatus = "novy" | "uvodni_call" | "nabidka" | "spoluprace" | "neaktivni";

export type Lead = {
  id: string;
  email: string;
  name: string | null;
  source: string | null;
  status: LeadStatus;
  notes: string | null;
  created_at: string;
  project_id?: string | null;
};

