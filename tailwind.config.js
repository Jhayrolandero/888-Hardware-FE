/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        mainGreen: "#2A5C66",
        mainGray: "#8D8D8D",
        mainRed: "#8C4848",
        mainBlueB: "#5DCDE3",
        formBorder: "#AAAAAA",
        formText: "#4D4D4D",
        mainBlue: "#EFFAFC"
      },
      fontFamily: {
        DMSans: ["DM Sans"], 
        Roboto: ["Roboto"],
      },
      screens: {
        mobileS: "320px",
        mobileM: "375px",
        mobileL: "500px",
        tablet: "768px",
        laptop: "1024px", 
        desktop: "1280px",
        laptopL: "1440px",
        fourk: "2560px",
      },
      boxShadow: {
        main: "0px 4px 4px 0px rgba(0, 0, 0, 0.25)",
      },
    },
  },
  plugins: [],
}