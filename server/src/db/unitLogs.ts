import { getServiceClient } from "./client.js";
import { UnitExpenseInput, UnitMaintenanceInput } from "@tp/types";

export async function createUnitExpense(unitId: string, input: UnitExpenseInput) {
  const { data, error } = await getServiceClient()
    .from("unit_expenses")
    .insert({ unit_id: unitId, ...input })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function createUnitMaintenance(unitId: string, input: UnitMaintenanceInput) {
  const { data, error } = await getServiceClient()
    .from("unit_maintenance")
    .insert({ unit_id: unitId, ...input })
    .select()
    .single();
  if (error) throw error;
  return data;
}
