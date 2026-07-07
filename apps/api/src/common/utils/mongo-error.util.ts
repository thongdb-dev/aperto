export interface MongoServerError extends Error {
  code?: number;
}

export function isMongoServerError(err: unknown): err is MongoServerError {
  return err instanceof Error && 'code' in err;
}
