import antfu from '@antfu/eslint-config'

export default antfu({
  type: 'lib',

  markdown: false,
  formatters: {
    markdown: true,
  },

  rules: {
    'ts/ban-ts-comment': 'off',
    'ts/no-namespace': 'off',
  },
})
