import { describe, expect, it } from 'vitest'

import { needsDeliveryRetry, retryActionFor } from '../apps/design-tweak/delivery'

describe('design-tweak delivery state', () => {
  describe('needsDeliveryRetry', () => {
    it('flags a sealed request that was never acknowledged', () => {
      // The stranded case: /send sealed it, the panel died before dispatch.
      expect(needsDeliveryRetry({ deliveredAt: '' })).toBe(true)
      expect(needsDeliveryRetry({})).toBe(true)
    })

    it('leaves an acknowledged request alone', () => {
      expect(needsDeliveryRetry({ deliveredAt: '2026-08-04T20:00:00Z' })).toBe(false)
    })
  })

  describe('retryActionFor', () => {
    it('re-acks — never re-dispatches — when the prompt already reached the agent', () => {
      // THE invariant: dispatch succeeded, only the ack POST failed. Dispatching
      // again would hand the agent a second copy and apply every edit twice.
      const dispatched = new Set(['r1'])
      expect(retryActionFor({ id: 'r1', deliveredAt: '' }, dispatched)).toBe('reack')
    })

    it('re-dispatches when the agent never got the batch', () => {
      expect(retryActionFor({ id: 'r1', deliveredAt: '' }, new Set())).toBe('redispatch')
    })

    it('keys on the request id, not on any request being dispatched', () => {
      // A sibling request having failed its ack must not suppress this one's
      // dispatch — that would strand r2 permanently.
      const dispatched = new Set(['r1'])
      expect(retryActionFor({ id: 'r2', deliveredAt: '' }, dispatched)).toBe('redispatch')
    })
  })
})
