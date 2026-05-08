// Erros de domínio. Cada use case mapeia para HTTP na camada web.

export class DomainError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, message: string, status = 400) {
    super(message);
    this.code = code;
    this.status = status;
    this.name = "DomainError";
  }
}

export class NotFoundError extends DomainError {
  constructor(message = "Recurso não encontrado") {
    super("NOT_FOUND", message, 404);
  }
}

export class ForbiddenError extends DomainError {
  constructor(message = "Acesso negado") {
    super("FORBIDDEN", message, 403);
  }
}

export class UnauthorizedError extends DomainError {
  constructor(message = "Não autenticado") {
    super("UNAUTHORIZED", message, 401);
  }
}

export class ValidationError extends DomainError {
  readonly issues: { path: string; message: string }[];

  constructor(message: string, issues: { path: string; message: string }[] = []) {
    super("VALIDATION_ERROR", message, 422);
    this.issues = issues;
  }
}

export class StateError extends DomainError {
  constructor(message: string) {
    super("STATE_ERROR", message, 409);
  }
}
