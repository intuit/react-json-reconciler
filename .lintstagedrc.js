module.exports = {
  "*.{js,json,css,md,ts,tsx,jsx}": (filenames) => {
    const files = filenames.join(" ");
    return [`prettier --write ${files}`];
  },
  "*.{js,ts,tsx,jsx}": (filenames) => {
    return [`eslint ${filenames.join(" ")}`];
  },
};
