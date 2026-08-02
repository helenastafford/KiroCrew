/**
 * Delivery-state decisions for a sealed request.
 *
 * `POST /send` seals a batch server-side; the panel builds and dispatches the
 * prompt afterwards, then acknowledges. Those are three steps over two
 * processes, so a request can be stranded in two DIFFERENT ways and the recovery
 * for each is the opposite of the other:
 *
 *   - sealed, never dispatched  -> re-dispatch (the agent has nothing)
 *   - dispatched, never acked   -> re-ack ONLY (the agent already has the batch;
 *                                  dispatching again applies every edit twice)
 *
 * Kept as pure functions so both branches are testable without mounting the
 * page — the cost of getting this wrong is duplicated edits in a user's repo.
 */

import type { Request } from './types'

/** Does this request still need something done to complete delivery? */
export function needsDeliveryRetry(req: Pick<Request, 'deliveredAt'>): boolean {
  return !req.deliveredAt
}

export type RetryAction = 'reack' | 'redispatch'

/**
 * What should the retry control DO for this request?
 *
 * `dispatchedIds` holds requests whose prompt reached the agent this session but
 * whose acknowledgement POST failed. Membership is the only thing separating a
 * safe re-ack from a duplicate dispatch, so it is checked first.
 */
export function retryActionFor(
  req: Pick<Request, 'id' | 'deliveredAt'>,
  dispatchedIds: ReadonlySet<string>,
): RetryAction {
  return dispatchedIds.has(req.id) ? 'reack' : 'redispatch'
}
