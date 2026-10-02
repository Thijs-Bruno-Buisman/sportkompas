export class StorageError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = "StorageError";
  }
}

export class QuotaExceededError extends StorageError {
  constructor(
    message: string = "Lokale opslagcapaciteit van de browser is bijna vol of overschreden."
  ) {
    super(message);
    this.name = "QuotaExceededError";
  }
}

export class EntityNotFoundError extends StorageError {
  constructor(entityName: string, id: string) {
    super(`Entiteit ${entityName} met ID '${id}' niet gevonden in IndexedDB.`);
    this.name = "EntityNotFoundError";
  }
}

export class ValidationError extends StorageError {
  constructor(message: string, public readonly validationErrors?: unknown) {
    super(message);
    this.name = "ValidationError";
  }
}
