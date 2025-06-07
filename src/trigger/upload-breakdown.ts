import { logger, task } from '@trigger.dev/sdk/v3'

export const uploadBreakdownTask = task({
  id: 'upload-breakdown',
  run: async (payload: { uploadId: string }, { ctx }) => {
    logger.log(`Processing upload ${payload.uploadId}...`, { payload, ctx })
  },
})
