import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      maxWidth: {
        '219': '13.6875rem',
        '266': '16.625rem',
        '286': '17.875rem',
        '364': '22.8rem',
        '404': '25.25rem',
        '506': '31.625rem',
        '632': '39.5rem',
        '920': '57.5rem',
        '1068': '66.75rem',
        '1170': '73.125rem',
        '1200': '75rem',
      },
      height:{
        '109': '6.8125rem',
        '397': '24.8125rem',
        '687': '42.9375rem',
        '650': '40.625rem',
      },
      width:{
        '109': '6.8125rem',
        '397': '24.8125rem',
        '526': '32.875rem',
        '770': '48.125rem',
        '687': '42.9375rem',
        '1/2': '30%',
        '1/4': '37%',
        '2/3': '63%',
        '2/2': '60%',
      },
      gap: {
        '30': '1.875rem',
        '14': '0.875rem',
        '13': '3.125rem',
      },
      boxShadow: {
        'hero-box': '0px 10px 20px 0px #00000026',
        'round-box': '0px 6px 10px 0px #00000026',
        "darkmd": "rgba(145, 158, 171, 0.2) 0px 0px 2px 0px, rgba(145, 158, 171, 0.12) 0px 12px 24px -4px",
      },
      borderRadius: {
        '14': '0.875rem',
        '22': '1.375rem',
        '166': '10.375rem',
        '182': '11.375rem',
        '214': '13.375rem',
      },
      transitionProperty: {
        'max-height': 'max-height',
        'opacity': 'opacity',
        'transform': 'transform',
        'width' : 'width',
        'all' : 'all',
      },
      transitionDuration: {
        '0': '0ms',          // instant transition
        '0.4s' : '0.4s',
        '2000': '2000ms',    // 2 seconds
      },
      transitionTimingFunction: {
        'ease-in-out': 'cubic-bezier(0.4, 0, 0.2, 1);', 
        'out-expo': 'cubic-bezier(0.19, 1, 0.22, 1)',
      },
      transform: {
        '-translate-y-4': '-translate-y-1rem', // adjust the value as needed
      },
      zIndex: {
        '1': '1',
        '3': '3',
      },      
      colors: {
        primary: "#2F73F2",
        secondary: "#102C46",
        SereneSky: "#8FACC6",
        ElectricAqua: "#46C4FF",
        RegalBlue: "#13439B",
        LightYellow: "#FFE15A",
        IcyBreeze: "#EFFBFF",
        PaleCyan: "#CFF4FF",
        Aquamarine: "#7DF9C2",
        MidnightNavyText: "#102D47",
        SlateBlueText : "#547593",
        PaleSkyBlu: "#E0F7FF",
        MistyTealText: "#6F9DAC",
        OliveDrab: "#73713C",
        CadetBlue: "#879AAC",
        Dandelion: "#F2EC1D",
        SkyBlueMist: "#C0D5FB",
        LightSkyBlue: "#B2D5EA",
        Salem: "#1C7C52",
        YellowRating: "#FAB446",
        PaleCerulean: "#A3BBD1",
        PeriwinkleBorder:"#C0D5FB",
        LightBlueBorder: "#4F8BFB",
        OceanDepthsDarkBorder: "#224767",
        PowderBlueBorder: "#E1F1F6",
        darkLineColor: "#24497c",
        darkmode: "#011120",
        darklight: "#0d1a2c",
        darktext: "#7F8487",
        dark_border: "#224767",
        dark_input: "#1B2430",
      },
      fontSize: {
        58: [
          "3.625rem",
          {
            lineHeight: "5.375rem",
          },
        ],
        53: [
          "3.3125rem",
          {
            lineHeight: "3.875rem",
          },
        ],
        40: [
          "2.5rem",
          {
            lineHeight: "3.4375rem",
          },
        ],
        48: [
          "3rem",
          {
            lineHeight: "3.39rem",
          },
        ],
        36: [
          "2.25rem",
          {
            lineHeight: "2.625rem",
          },
        ],
        34: [
          "2.125rem",
          {
            lineHeight: "2.7669rem",
          },
        ],
        32: [
          "2rem",
          {
            lineHeight: "2.5rem",
          },
        ],
        28: [
          "1.75rem",
          {
            lineHeight: "2.25rem",
          },
        ],
        26: [
          "1.625rem",
          {
            lineHeight: "2.1156rem",
          },
        ],
        24: [
          "1.5rem",
          {
            lineHeight: "2rem",
          },
        ],
        22: [
          "1.375rem",
          {
            lineHeight: "2rem",
          },
        ],
        20: [
          "1.25rem",
          {
            lineHeight: "2.125rem",
          },
        ],
        19: [
          "1.1875rem",
          {
            lineHeight: "1.625rem",
          },
        ],
        17: [
          "1.0625rem",
          {
            lineHeight: "1.4875rem",
          },
        ],
        16: [
          "1rem",
          {
            lineHeight: "1.6875rem",
          },
        ],
        15: [
          "0.9375rem",
          {
            lineHeight: "1.4375rem",
          },
        ],
        14: [
          "0.875rem",
          {
            lineHeight: "1.225rem",
          },
        ],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
};
export default config;
