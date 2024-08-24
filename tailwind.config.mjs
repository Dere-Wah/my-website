/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
	theme: {
		fontFamily: {
			"body": "Source Sans Pro"
		},
		colors: {
			'ebony-clay': {
				'50': '#f2f6fc',
				'100': '#e1ebf8',
				'200': '#cbdcf2',
				'300': '#a6c6ea',
				'400': '#7ca8de',
				'500': '#5d8ad4',
				'600': '#4971c7',
				'700': '#3f5eb6',
				'800': '#394e94',
				'900': '#324476',
				'950': '#1f2742',
			},
		},
		extend: {},
	},
	plugins: [],
}
