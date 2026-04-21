export type JobHandler = (config?: Record<string, unknown>) => Promise<{ recordsProcessed: number }>;

const registry = new Map<string, JobHandler>();

export function registerJob(jobType: string, handler: JobHandler) {
  registry.set(jobType, handler);
}

export function getJobHandler(jobType: string): JobHandler | undefined {
  return registry.get(jobType);
}

export function listRegisteredJobs(): string[] {
  return Array.from(registry.keys());
}
