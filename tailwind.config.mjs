/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
	theme: {
		fontFamily: {
			"body": "Source Sans Pro"
		},
		extend: {
			animation:{
				fall: "fall 2s linear 1"
			},
			keyframes:{
				fall: {
					'0%': {
					  transform: 'translateY(-25%)',
					  animationTimingFunction: 'ease',
					  opacity: "0%",
					  "letter-spacing": "0.1em"
					},
					'80%': {
					  animationTimingFunction: 'ease-in',
					  opacity: "100%"
					},
					'100%': {
					  transform: 'none',
					  animationTimingFunction: 'ease-out',
					  "letter-spacing": "-0.075em"
					}
				  },
			},
			colors: {
				'ebony-clay': {
					'50': '#f5f5f6',
					'100': '#cecfd3',
					'200': '#cecfd3',
					'300': '#acadb4',
					'400': '#82848e',
					'500': '#676873',
					'600': '#585962',
					'700': '#4b4b53',
					'800': '#424348',
					'900': '#3a3a3f',
					'950': '#0a0a0b',
				},
			}
		},
	},
	plugins: [],
}
