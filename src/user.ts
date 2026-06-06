/** The current user, exposed as `ctx.user`. */

/** The kind of user an invocation runs for. */
export type UserType = 'agent' | 'customer' | 'admin';

/** The user the plugin invocation runs for (`ctx.user`). */
export interface User {
  /** User id. */
  readonly id: string;
  /** Display name. */
  readonly name: string;
  /** User kind. */
  readonly type: UserType;
  /** True when the invocation runs under a service account. */
  readonly isServiceAccount: boolean;
}
