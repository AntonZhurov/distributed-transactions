export enum DISTRIBUTED_TRANSACTION_STATUS {
  PENDING = 'pending',
  PROCESSING = 'processing',
  PROCESSING_ROLLBACK = 'processing_rollback',
  COMPLETED = 'completed',
  ROLLBACK_FAILED = 'rollback_failed',
  FAILED = 'failed',
}

export enum DISTRIBUTED_TRANSACTION_STEP_STATUS {
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum DISTRIBUTED_TRANSACTION_STEP_ROLLBACK_STATUS {
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}
