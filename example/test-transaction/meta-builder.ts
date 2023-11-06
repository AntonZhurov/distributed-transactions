import { DistributedTransactionMetaBuilder } from '../../lib/types';
import {
  MetaByStep,
  PayloadByStep,
  RollbackMetaByStep,
  RollbackPayloadByStep,
  Steps,
  TransactionContext,
} from './steps';

export const MetaBuilder: DistributedTransactionMetaBuilder<
  Steps,
  TransactionContext,
  PayloadByStep,
  MetaByStep,
  RollbackPayloadByStep,
  RollbackMetaByStep
> = {
  [Steps.STEP1]: {
    step: (id, type, context, payload) => ({
      transaction: {
        id: id,
        type: type,
      },
      context,
      payload,
      response: {
        success: {
          to: 'step_1_success_response_channel',
        },
        failure: {
          to: 'step_1_failure_response_channel',
        },
      },
    }),
  },
  [Steps.STEP2]: {
    step: (id, type, context, payload) => ({
      transaction: {
        id: id,
        type: type,
      },
      context,
      payload,
      response: {
        success: {
          to: 'step_2_success_response_channel',
        },
        failure: {
          to: 'step_2_failure_response_channel',
        },
      },
    }),
  },
  [Steps.STEP3]: {
    step: (id, type, context, payload) => ({
      transaction: {
        id: id,
        type: type,
      },
      context,
      payload,
      response: {
        success: {
          to: 'step_3_success_response_channel',
        },
        failure: {
          to: 'step_3_failure_response_channel',
        },
      },
    }),
  },
  [Steps.STEP4]: {
    step: (id, type, context, payload) => ({
      transaction: {
        id: id,
        type: type,
      },
      context,
      payload,
      response: {
        success: {
          to: 'step_4_success_response_channel',
        },
        failure: {
          to: 'step_4_failure_response_channel',
        },
      },
    }),
    rollback: (id, type, context, payload) => ({
      transaction: {
        id: id,
        type: type,
      },
      context,
      payload,
      response: {
        success: {
          to: 'step_4_rollback_success_response_channel',
        },
        failure: {
          to: 'step_4_rollback_failure_response_channel',
        },
      },
    }),
  },
  [Steps.STEP5]: {
    step: (id, type, context, payload) => ({
      transaction: {
        id: id,
        type: type,
      },
      context,
      payload,
      response: {
        success: {
          to: 'step_5_success_response_channel',
        },
        failure: {
          to: 'step_5_failure_response_channel',
        },
      },
    }),
  },
};
