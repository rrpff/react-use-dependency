import { createContext, useContext, useEffect, useState } from 'react'
import { dedent } from 'ts-dedent'

type ArgumentTypes<F extends Function> = F extends (...args: infer A) => any ? A : never;

export type DependencyMap = { [key: string]: any }
export type DependencyConfig<T> = {
  load: () => T | Promise<T>
  default?: T
}

const context = createContext({} as DependencyMap)

export const DependencyProvider = context.Provider

export function useDependency<T>(name: string): T | null {
  const dependencies = useContext(context)
  const [loaded, setLoaded] = useState(null as T | null)

  const exists = name in dependencies
  if (!exists) throw new Error(`The dependency "${name}" is not set`)

  const dependency = dependencies[name] as T | DependencyConfig<T>
  const resolved = dependency as T
  const dynamic = dependency as DependencyConfig<T>
  const isDynamic = typeof dependency === 'object'
    && 'load' in dependency

  useEffect(() => {
    if (!isDynamic) return

    const value = dynamic.load()
    if (value instanceof Promise) {
      value.then((result: T) => setLoaded(result))
    } else {
      setLoaded(value)
    }
  }, [dependency])

  if (isDynamic) {
    return loaded || dynamic.default || null
  } else {
    return resolved
  }
}

export function useHook<T extends (...args: any) => any>(name: string, ...args: ArgumentTypes<T>): ReturnType<T> {
  const dependency = useDependency<T>(name)

  if (dependency === null) throw new Error(dedent`
    \`useHook\` was called with a dependency which has no \`default\` value.

    This causes an error because it's generally easier to specify a default value
    in the dependency configuration than it is to handle unexpected \`null\` values
    in components.

    To fix, specify a \`default\` value for the dependency. For example:

    \`\`\`
    const dependencies = {
      ${name}: {
        load: async () => import('./hooks/example'),
        default: { loading: true },
      }
    }
    \`\`\`
  `)

  return dependency(...args)
}
