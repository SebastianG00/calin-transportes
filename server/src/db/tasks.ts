import { getServiceClient } from "./client.js";
import { TaskInput } from "@tp/types";

export async function listTasks() {
  const { data, error } = await getServiceClient().from("tasks").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}
export async function createTask(input: TaskInput) {
  const { data, error } = await getServiceClient().from("tasks").insert(input).select().single();
  if (error) throw error;
  return data;
}
export async function updateTask(id: string, input: Partial<TaskInput>) {
  const { data, error } = await getServiceClient().from("tasks")
    .update({ ...input, updated_at: new Date().toISOString() }).eq("id", id).select().single();
  if (error) throw error;
  return data;
}
export async function deleteTask(id: string) {
  const { error } = await getServiceClient().from("tasks").delete().eq("id", id);
  if (error) throw error;
  return { id };
}
