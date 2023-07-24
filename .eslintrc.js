module.exports = {
	root: true,
	env: {
		browser: true,
		es2021: true,
		node: true,
		'googleappsscript/googleappsscript': true,
	},
	settings: {
		'import/core-modules': ['google-apps-script'],
	},
	extends: ['eslint:recommended', 'airbnb-base'],
	parserOptions: {
		ecmaVersion: 'latest',
		sourceType: 'module',
	},
	rules: {
		indent: [2, 'tab', { SwitchCase: 1, VariableDeclarator: 1 }],
		'no-tabs': 0,
		'max-len': [
			'error',
			{
				code: 140,
				ignoreComments: true,
				ignoreTrailingComments: true,
				ignoreUrls: true,
				ignoreStrings: true,
				ignoreTemplateLiterals: true,
				ignoreRegExpLiterals: true,
			},
		],
		'no-plusplus': ['error', { allowForLoopAfterthoughts: true }],
	},
	plugins: ['googleappsscript'],
};
