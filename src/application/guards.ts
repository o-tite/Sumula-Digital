import { ForbiddenError, UnauthorizedError } from "@/shared/errors";
import type { UserRole } from "@/shared/types";

export interface SessionUser {
  id: string;
  role: UserRole;
}

export function requireOrganizer(user: SessionUser | null | undefined): asserts user is SessionUser {
  if (!user) throw new UnauthorizedError();
  if (user.role !== "ORGANIZER") throw new ForbiddenError("Apenas organizador");
}

export function requireReferee(user: SessionUser | null | undefined): asserts user is SessionUser {
  if (!user) throw new UnauthorizedError();
  if (user.role !== "REFEREE") throw new ForbiddenError("Apenas mesário");
}

export function requireUser(user: SessionUser | null | undefined): asserts user is SessionUser {
  if (!user) throw new UnauthorizedError();
}
