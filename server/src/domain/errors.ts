import { LoadStatus } from "@tp/types";

export class DomainError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "DomainError";
    this.status = status;
    this.code = code;
  }
}

export function illegalTransition(from: LoadStatus, to: LoadStatus): DomainError {
  return new DomainError(409, "ILLEGAL_TRANSITION", `No se puede pasar de ${from} a ${to}.`);
}

export function mapPostgresError(err: { code?: string; message?: string }): DomainError | null {
  if (err.code === "23505" && (err.message ?? "").includes("one_active_load_per_driver")) {
    return new DomainError(409, "DRIVER_HAS_ACTIVE_LOAD", "El conductor ya tiene una carga activa.");
  }
  return null;
}
