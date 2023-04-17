const { execSync } = require("node:child_process");
const pixels = require("image-pixels");

const INTENSITY = process.env.INTENSITY
  ? parseInt(process.env.INTENSITY, 10)
  : 69;
const MESSAGES = ["look ma", "solana mobile", "give me a raise", "Im so cool"];

// The first grid in the GitHub contributions grid is the previous Sunday, one year ago.
function getSundaySomeWeeksAgo(numWeeksAgo) {
  const today = new Date(Date.now());
  const someWeeksAgo = new Date(
    new Date(today).setDate(today.getDate() - 7 * numWeeksAgo)
  );
  const sundayOfThatWeek = new Date(
    new Date(someWeeksAgo).setDate(
      someWeeksAgo.getDate() -
        (someWeeksAgo.getDay() === 7 ? 0 : someWeeksAgo.getDay())
    )
  );
  sundayOfThatWeek.setHours(16, 0, 0, 0);
  return new Date(
    Date.UTC(
      sundayOfThatWeek.getFullYear(),
      sundayOfThatWeek.getMonth(),
      sundayOfThatWeek.getDate(),
      sundayOfThatWeek.getHours()
    )
  );
}

(async function () {
  const image = await pixels("graph.png");
  if (image.width !== 52 && image.height !== 7) {
    throw new Error("Input image must be 52x7px");
  }
  const percentages = [];
  image.data.forEach((_, ii, data) => {
    const step = ii % 4;
    if (step === 0) {
      // Average the intensity of each RGB pixel.
      const brightness =
        (data[ii /* red */] +
          data[ii + 1 /* green */] +
          data[ii + 2 /* blue */]) /
        3;
      percentages[Math.floor(ii / 4)] = (255 - brightness) / 255;
    }
  });
  // Reorder in GitHub grid order.
  const sortedPercentages = [];
  percentages.forEach((value, ii) => {
    sortedPercentages[7 * (ii % 52) + Math.floor(ii / 52)] = value;
  });
  // Produce commits.
  for (let ii = 0; ii < 52 /* weeks */; ii++) {
    const numWeeksAgo = 52 - ii;
    const startDate = getSundaySomeWeeksAgo(numWeeksAgo);
    for (let jj = 0; jj < 7; jj++) {
      const pixelBrightness = sortedPercentages[7 * ii + jj];
      if (pixelBrightness === 0) {
        continue;
      }
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + jj);
      const isoDate = date.toISOString();
      for (let kk = 0; kk < Math.floor(INTENSITY * pixelBrightness); kk++) {
        const message = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
        const command =
          `GIT_AUTHOR_DATE=${isoDate} ` +
          `GIT_COMMITTER_DATE=${isoDate} ` +
          "git commit --allow-empty --no-gpg-sign --no-verify " +
          `-m "${message}"`;
        console.log(process.env.DEBUG ? command : message);
        execSync(command);
      }
    }
  }
})();
