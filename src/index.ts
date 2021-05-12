import { createContext, useContext } from 'react'

type ArgumentTypes<F extends Function> = F extends (...args: infer A) => any ? A : never;
export type DependencyMap = { [key: string]: any }

const context = createContext({} as DependencyMap)

export const DependencyProvider = context.Provider

export function useDependency<T>(name: string): T {
  const dependencies = useContext(context)

  if (name in dependencies) return dependencies[name] as T

  throw new Error(`The dependency "${name}" is not set`)
}

export function useHook<T extends (...args: any) => any>(name: string, ...args: ArgumentTypes<T>): ReturnType<T> {
  const dependency = useDependency<T>(name)
  return dependency(...args)
}
