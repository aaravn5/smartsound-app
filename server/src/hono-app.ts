import type { User } from './types.js'

/** Shared Hono generics: `c.get('user')` is available on any route behind `requireAuth`. */
export interface AppEnv {
  Variables: {
    user: User
  }
}
