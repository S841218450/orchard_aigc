export interface Message {
  id: string;
  role: "user" | "ai";
  status: "pending" | "success" | "error";
  content: string;
  timestamp: Date;
}
