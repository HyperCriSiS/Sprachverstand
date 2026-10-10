// Öffentlicher Typvertrag für die rein diagnostische Videoquelle.
export interface VideoToolResult {
  readonly status: number | null;
  readonly stdout: Buffer | string;
  readonly stderr?: Buffer | string;
  readonly error?: Error;
}

export function createVerified60FpsWebm(
  run?: (
    command: string,
    args: string[],
    options: Record<string, unknown>
  ) => VideoToolResult
): Buffer;
