import type { DataRecord, TransformConfig } from "./transform.js";

/**
 * Job status in the scheduler queue.
 */
export type JobStatus = "pending" | "running" | "completed" | "failed";

/**
 * A scheduled pipeline job.
 */
export interface PipelineJob {
  id: string;
  records: DataRecord[];
  config: TransformConfig;
  status: JobStatus;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  error?: string;
}

const jobQueue: PipelineJob[] = [];

/**
 * Enqueue a new pipeline job for processing.
 */
export function enqueueJob(
  records: DataRecord[],
  config: TransformConfig,
): PipelineJob {
  const job: PipelineJob = {
    id: `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    records,
    config,
    status: "pending",
    createdAt: Date.now(),
  };
  jobQueue.push(job);
  return job;
}

/**
 * Get the next pending job from the queue.
 */
export function dequeueJob(): PipelineJob | undefined {
  const idx = jobQueue.findIndex((j) => j.status === "pending");
  if (idx === -1) return undefined;
  const job = jobQueue[idx];
  job.status = "running";
  job.startedAt = Date.now();
  return job;
}

/**
 * Mark a job as completed.
 */
export function completeJob(
  jobId: string,
  processedRecords: DataRecord[],
): void {
  const job = jobQueue.find((j) => j.id === jobId);
  if (!job) return;
  job.status = "completed";
  job.completedAt = Date.now();
  job.records = processedRecords;
}

/**
 * Mark a job as failed with an error message.
 */
export function failJob(jobId: string, error: string): void {
  const job = jobQueue.find((j) => j.id === jobId);
  if (!job) return;
  job.status = "failed";
  job.completedAt = Date.now();
  job.error = error;
}

/**
 * Get all jobs with a specific status.
 */
export function getJobsByStatus(status: JobStatus): PipelineJob[] {
  return jobQueue.filter((j) => j.status === status);
}

/**
 * Retry all failed jobs by resetting them to pending.
 */
export function retryFailedJobs(): number {
  let count = 0;
  for (const job of jobQueue) {
    if (job.status === "failed") {
      job.status = "pending";
      job.startedAt = undefined;
      job.completedAt = undefined;
      job.error = undefined;
      count++;
    }
  }
  return count;
}

/**
 * Purge completed jobs older than the given age in ms.
 */
export function purgeOldJobs(maxAgeMs: number): number {
  const cutoff = Date.now() - maxAgeMs;
  let purged = 0;
  for (let i = jobQueue.length - 1; i >= 0; i--) {
    const job = jobQueue[i];
    if (
      job.status === "completed" &&
      job.completedAt &&
      job.completedAt < cutoff
    ) {
      jobQueue.splice(i, 1);
      purged++;
    }
  }
  return purged;
}
