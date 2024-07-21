module.exports = {
    globals: {
        stateCounter: 'writable',
    },
    env: {
        node: true,
        es2021: true,
    },
    extends: [
        'eslint:recommended',
        'plugin:import/errors',
        'plugin:import/warnings',
    ],
    parserOptions: {
        ecmaVersion: 13,
        sourceType: 'module',
    },
    settings: {
        'import/resolver': {
            alias: {
                map: [['#src', './src']],
                extensions: ['.js', '.jsx', '.json'],
            },
        },
    },
    rules: {
        'no-console': 'off',
        // 'no-console': 'warn',
        'no-undef': 'off',
        'linebreak-style': 'off', 
        'no-unused-vars': 'warn',
        //  'comma-dangle': ['error', 'never'],
        'import/order': 'off',
        semi: ['error', 'never'],
        quotes: ['error', 'single'],
    },
}