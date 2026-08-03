import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'security-orange': '#ff5a1f', // ปรับค่าสีให้ตรงกับธีมของคุณ
        'security-navy': '#111827',  // ปรับค่าสีให้ตรงกับธีมของคุณ
      },
    },
  },
  plugins: [],
}
export default config