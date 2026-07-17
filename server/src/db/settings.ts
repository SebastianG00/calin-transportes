import { getServiceClient } from "./client.js";

export interface AppSettings {
  confirm_window_minutes: number;
  reminder_enabled: boolean;
  manual_remind_min_gap_minutes: number;
}

export async function getSettings(): Promise<AppSettings> {
  const { data, error } = await getServiceClient()
    .from("app_settings")
    .select("*")
    .eq("id", 1)
    .single();
  if (error) throw error;
  return data as AppSettings;
}
