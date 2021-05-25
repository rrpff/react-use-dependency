import React from 'react'
import { renderHook } from '@testing-library/react-hooks'
import { dedent } from 'ts-dedent'
import { DependencyProvider, useDependency, useHook, useComponent } from './'

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

  expect(result.error).toEqual(new Error(dedent`
    \`useDependency\` was called with a dependency key which is not set: "${key}"

    To fix, pass a dependency for the key "${key}" into the DependencyProvider
    higher order component in your app setup. For example:

    \`\`\`
    import React from 'react'
    import ReactDOM from 'react-dom'
    import { DependencyProvider } from 'react-use-dependency'

    const dependencies = {
      ${key}: /* something */
    }

    ReactDOM.render(
      <React.StrictMode>
        <DependencyProvider value={dependencies}>
          <App />
        </DependencyProvider>
      </React.StrictMode>,
      document.getElementById('root')
    )
    \`\`\`
  `))
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

  expect(result.error).toEqual(Error(dedent`
    \`useHook\` was called with a dependency key which is not set: "${key}"

    To fix, pass a dependency for the key "${key}" into the DependencyProvider
    higher order component in your app setup. For example:

    \`\`\`
    import React from 'react'
    import ReactDOM from 'react-dom'
    import { DependencyProvider } from 'react-use-dependency'

    const dependencies = {
      ${key}: /* something */
    }

    ReactDOM.render(
      <React.StrictMode>
        <DependencyProvider value={dependencies}>
          <App />
        </DependencyProvider>
      </React.StrictMode>,
      document.getElementById('root')
    )
    \`\`\`
  `))
})

test('useComponent should return the dependency if it is set', () => {
  const ExampleComponent = () => <span>Hello world</span>
  const wrapper = createWrapper({ Example: ExampleComponent })

  const { result } = renderHook(() => useComponent<React.FC>('Example'), { wrapper })

  expect(result.current).toEqual(ExampleComponent)
})

test.each(TEST_KEY_NAMES)('useComponent should throw an error if it is not set', key => {
  const wrapper = createWrapper({})

  const { result } = renderHook(() => useComponent<React.FC>(key), { wrapper })

  expect(result.error).toEqual(new Error(dedent`
    \`useComponent\` was called with a dependency key which is not set: "${key}"

    To fix, pass a dependency for the key "${key}" into the DependencyProvider
    higher order component in your app setup. For example:

    \`\`\`
    import React from 'react'
    import ReactDOM from 'react-dom'
    import { DependencyProvider } from 'react-use-dependency'

    const dependencies = {
      ${key}: /* something */
    }

    ReactDOM.render(
      <React.StrictMode>
        <DependencyProvider value={dependencies}>
          <App />
        </DependencyProvider>
      </React.StrictMode>,
      document.getElementById('root')
    )
    \`\`\`
  `))
})

describe('with lazy dependencies', () => {
  test('useDependency should call the load function', async () => {
    const random = Math.random()
    const wrapper = createWrapper({
      rng: {
        load: () => random
      },
    })

    const { result } = renderHook(() => useDependency<number>('rng'), { wrapper })

    expect(result.current).toEqual(random)
  })

  test('useDependency should only call the dependencies which are used', async () => {
    const loadDep1 = jest.fn(() => Math.random())
    const loadDep2 = jest.fn(() => Math.random())

    const wrapper = createWrapper({
      one: { load: loadDep1 },
      two: { load: loadDep2 },
    })

    renderHook(() => useDependency<number>('two'), { wrapper })

    expect(loadDep1).not.toHaveBeenCalled()
    expect(loadDep2).toHaveBeenCalled()
  })
})

describe('with async dependencies', () => {
  test('useDependency should return the default value of the async dependency at first', async () => {
    const random1 = Math.random()
    const random2 = Math.random()
    const wrapper = createWrapper({
      rng: {
        load: async () => random2,
        default: random1,
      },
    })

    const { result, waitForNextUpdate } = renderHook(() => useDependency<number>('rng'), { wrapper })

    expect(result.current).toEqual(random1)
    await waitForNextUpdate()
  })

  test('useDependency should return the resolved value of the async dependency eventually', async () => {
    const random1 = Math.random()
    const random2 = Math.random()
    const wrapper = createWrapper({
      rng: {
        load: async () => random2,
        default: random1,
      },
    })

    const { result, waitForNextUpdate } = renderHook(() => useDependency<number>('rng'), { wrapper })

    await waitForNextUpdate()

    expect(result.all).toEqual([random1, random2])
  })

  test('useDependency should default to a null value if no default is given', async () => {
    const wrapper = createWrapper({
      rng: {
        load: async () => Math.random(),
      },
    })

    const { result, waitForNextUpdate } = renderHook(() => useDependency<number>('rng'), { wrapper })

    expect(result.current).toEqual(null)
    await waitForNextUpdate()
  })

  test('useDependency should special case async import functions', async () => {
    const wrapper = createWrapper({
      react: {
        load: () => import('react'),
      },
    })

    const { result, waitForNextUpdate } = renderHook(() => useDependency<any>('react'), { wrapper })

    await waitForNextUpdate()

    expect(result.current).toEqual(React)
  })

  test.each(TEST_KEY_NAMES)('useHook should throw an error if no default value is given', async key => {
    const wrapper = createWrapper({
      [key]: {
        load: async () => () => Math.random(),
      },
    })

    const { result } = renderHook(() => useHook(key), { wrapper })

    expect(result.error).toEqual(new Error(dedent`
      \`useHook\` resolved a dependency which has no \`default\` value.

      This causes an error because it's generally easier to specify a default value
      in the dependency configuration than it is to handle unexpected \`null\` values
      in components.

      To fix, specify a \`default\` value for the dependency. For example:

      \`\`\`
      const dependencies = {
        ${key}: {
          load: async () => import('./hooks/example'),
          default: () => ({ loading: true }),
        }
      }
      \`\`\`
    `))
  })

  test.each(TEST_KEY_NAMES)('useComponent should return a null component initially if no default value is given', async key => {
    const Component = () => <span>Hello World</span>
    const wrapper = createWrapper({
      [key]: {
        load: async () => ({ default: Component }),
      },
    })

    const { result, waitForNextUpdate } = renderHook(() => useComponent<any>(key), { wrapper })

    expect(result.current()).toEqual(null)
    await waitForNextUpdate()
  })

  test.each(TEST_KEY_NAMES)('useComponent should return the loaded component eventually', async key => {
    const Component = () => () => <span>Hello World</span>
    const wrapper = createWrapper({
      [key]: {
        load: async () => ({ default: Component }),
      },
    })

    const { result, waitForNextUpdate } = renderHook(() => useComponent<any>(key), { wrapper })

    await waitForNextUpdate()

    expect(result.current()).toEqual(<span>Hello World</span>)
  })
})
