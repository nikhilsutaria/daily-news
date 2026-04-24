type LogLevel = "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  service: string;
  message: string;
  data?: Record<string, unknown>;
  error?: unknown;
}

function formatError(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }
  return { raw: String(error) };
}

function emit(entry: LogEntry) {
  const payload = {
    timestamp: new Date().toISOString(),
    service: entry.service,
    message: entry.message,
    ...(entry.data && { data: entry.data }),
    ...(entry.error != null ? { error: formatError(entry.error) } : {}),
  };

  switch (entry.level) {
    case "error":
      console.error(JSON.stringify(payload));
      break;
    case "warn":
      console.warn(JSON.stringify(payload));
      break;
    default:
      console.log(JSON.stringify(payload));
  }
}

export function createLogger(service: string) {
  return {
    info(message: string, data?: Record<string, unknown>) {
      emit({ level: "info", service, message, data });
    },
    warn(message: string, data?: Record<string, unknown>) {
      emit({ level: "warn", service, message, data });
    },
    error(message: string, error?: unknown, data?: Record<string, unknown>) {
      emit({ level: "error", service, message, error, data });
    },
  };
}
