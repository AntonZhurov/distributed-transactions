import {
  DISTRIBUTED_TRANSACTION_STEP_STATUS,
  DistributedTransactionBroker,
  DistributedTransactionStep,
} from '../lib/types';
import { EventEmitter } from 'node:events';
import {
  MetaByStep,
  PayloadByStep,
  RollbackMetaByStep,
  RollbackPayloadByStep,
  Steps,
  SuccessResponseByStep,
} from './test-transaction';

interface MessagePayload {
  to: string;
  payload: Record<any, any>;
}

const createStep1Message = (
  step: DistributedTransactionStep<
    Steps,
    DISTRIBUTED_TRANSACTION_STEP_STATUS,
    PayloadByStep[Steps.STEP1],
    MetaByStep[Steps.STEP1],
    SuccessResponseByStep[Steps.STEP1]
  >,
): MessagePayload => {
  return {
    to: 'step_1_execute_command',
    payload: {
      ...step.payload,
      meta: step.meta,
    },
  };
};

const createStep2Message = (
  step: DistributedTransactionStep<
    Steps,
    DISTRIBUTED_TRANSACTION_STEP_STATUS,
    PayloadByStep[Steps.STEP2],
    MetaByStep[Steps.STEP2],
    SuccessResponseByStep[Steps.STEP2],
    RollbackPayloadByStep[Steps.STEP2],
    RollbackMetaByStep[Steps.STEP2]
  >,
): MessagePayload => {
  if (step.status === DISTRIBUTED_TRANSACTION_STEP_STATUS.PROCESSING) {
    return {
      to: 'step_2_execute_command',
      payload: {
        ...step.payload,
        meta: step.meta,
      },
    };
  }
  return {
    to: 'step_2_execute_rollback_command',
    payload: {
      ...step.rollbackPayload,
      meta: step.rollbackMeta,
    },
  };
};

const createStep3Message = (
  step: DistributedTransactionStep<
    Steps,
    DISTRIBUTED_TRANSACTION_STEP_STATUS,
    PayloadByStep[Steps.STEP3],
    MetaByStep[Steps.STEP3],
    SuccessResponseByStep[Steps.STEP3],
    RollbackPayloadByStep[Steps.STEP3],
    RollbackMetaByStep[Steps.STEP3]
  >,
): MessagePayload => {
  if (step.status === DISTRIBUTED_TRANSACTION_STEP_STATUS.PROCESSING) {
    return {
      to: 'step_3_execute_command',
      payload: {
        ...step.payload,
        meta: step.meta,
      },
    };
  }
  return {
    to: 'step_3_execute_rollback_command',
    payload: {
      ...step.rollbackPayload,
      meta: step.rollbackMeta,
    },
  };
};

const createStep4Message = (
  step: DistributedTransactionStep<
    Steps,
    DISTRIBUTED_TRANSACTION_STEP_STATUS,
    PayloadByStep[Steps.STEP4],
    MetaByStep[Steps.STEP4],
    SuccessResponseByStep[Steps.STEP4],
    RollbackPayloadByStep[Steps.STEP4],
    RollbackMetaByStep[Steps.STEP4]
  >,
): MessagePayload => {
  if (step.status === DISTRIBUTED_TRANSACTION_STEP_STATUS.PROCESSING) {
    return {
      to: 'step_4_execute_command',
      payload: {
        ...step.payload,
        meta: step.meta,
      },
    };
  }
  return {
    to: 'step_4_execute_rollback_command',
    payload: {
      ...step.rollbackPayload,
      meta: step.rollbackMeta,
    },
  };
};

const createStep5Message = (
  step: DistributedTransactionStep<
    Steps,
    DISTRIBUTED_TRANSACTION_STEP_STATUS,
    PayloadByStep[Steps.STEP5],
    MetaByStep[Steps.STEP5],
    SuccessResponseByStep[Steps.STEP5],
    RollbackPayloadByStep[Steps.STEP5],
    RollbackMetaByStep[Steps.STEP5]
  >,
): MessagePayload => {
  if (step.status === DISTRIBUTED_TRANSACTION_STEP_STATUS.PROCESSING) {
    return {
      to: 'step_5_execute_command',
      payload: {
        ...step.payload,
        meta: step.meta,
      },
    };
  }
  return {
    to: 'step_5_execute_rollback_command',
    payload: {
      ...step.rollbackPayload,
      meta: step.rollbackMeta,
    },
  };
};

type StepMapper = (step: DistributedTransactionStep) => MessagePayload;

const mappers = {
  [Steps.STEP1]: createStep1Message,
  [Steps.STEP2]: createStep2Message,
  [Steps.STEP3]: createStep3Message,
  [Steps.STEP4]: createStep4Message,
  [Steps.STEP5]: createStep5Message,
};

const createMessage = (
  step: Steps,
  data: DistributedTransactionStep,
): MessagePayload => {
  return mappers[step](data as any);
};

export class Broker
  extends EventEmitter
  implements DistributedTransactionBroker<Steps>
{
  async send(
    step: Steps,
    data: DistributedTransactionStep,
    options?: Record<any, any>,
  ): Promise<void> {
    const message = createMessage(step, data);
    this.emit(message.to, message.payload);
  }
}
