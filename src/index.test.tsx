import { renderHook, act } from '@testing-library/react-hooks'
import { DependencyProvider, useDependency, useHook } from './'

const TEST_KEY_NAMES = ['random', 'whatever', Math.random().toString()]
const createWrapper = (dependencies: { [key: string]: any }): React.FC => ({ children }) =>
  <DependencyProvider value={dependencies}>{children}</DependencyProvider>

test.each(TEST_KEY_NAMES)('useDependency should return the dependency if it is set', key => {
  const random = Math.random()
  const wrapper = createWrapper({ [key]: random })

  const { result } = renderHook(() => useDependency<number>(key), { wrapper })

  expect(result.current).toEqual(random)
})

test.each(TEST_KEY_NAMES)('useDependency should throw an error if it is not set', key => {
  const wrapper = createWrapper({})

  const { result } = renderHook(() => useDependency<number>(key), { wrapper })

  expect(result.error).toEqual(Error(`The dependency "${key}" is not set`))
})

test('useHook should call the dependency if it is set', () => {
  type IUseRandom = () => number

  const random = Math.random()
  const useRandom = () => random
  const wrapper = createWrapper({ IUseRandom: useRandom })

  const { result } = renderHook(() => useHook<IUseRandom>('IUseRandom'), { wrapper })

  expect(result.current).toEqual(random)
})

test('useHook should call the dependency with given arguments if it is set', () => {
  type IUseDouble = (num: number) => number

  const random = Math.random()
  const useDouble = (num: number) => num * 2
  const wrapper = createWrapper({ IUseDouble: useDouble })

  const { result } = renderHook(() => useHook<IUseDouble>('IUseDouble', random), { wrapper })

  expect(result.current).toEqual(random * 2)
})

test.each(TEST_KEY_NAMES)('useHook should throw an error if it is not set', key => {
  const wrapper = createWrapper({})

  const { result } = renderHook(() => useHook<() => number>(key), { wrapper })

  expect(result.error).toEqual(Error(`The dependency "${key}" is not set`))
})
