import antfu from '@antfu/eslint-config'

export default antfu({
  type: 'lib',

  rules: {
    'ts/ban-ts-comment': 'off',
  },
})
