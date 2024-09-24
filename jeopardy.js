const API_URL = "https://rithm-jeopardy.herokuapp.com/api/"; // The URL of the API.
const NUMBER_OF_CATEGORIES = 6; // The number of categories you will be fetching. You can change this number.
const NUMBER_OF_CLUES_PER_CATEGORY = 5; // The number of clues you will be displaying per category. You can change this number.

let categories = []; // The categories with clues fetched from the API.
let score = 0;

let activeClue = null; // Currently selected clue data.
let activeClueMode = 0; // Controls the flow of #active-clue element while selecting a clue, displaying the question of selected clue, and displaying the answer to the question.

let isPlayButtonClickable = true; // Only clickable when the game haven't started yet or ended. Prevents the button to be clicked during the game.

$("#play").on("click", handleClickOfPlay);

async function handleClickOfPlay() {
  try {
    const ids = await getCategoryIds();
    for (let i = 0; i < ids.length; i++) {
      const cat = await getCategoryData(ids[i]);
      categories.push(cat);
    }
    document.getElementById("play").style.display = "none";

    fillTable(categories);
  } catch (error) {
    alert("Something went wrong - Refresh the page!");
    console.error(error);
  }
}

async function setupTheGame() {}

async function getCategoryIds() {
  const res = await axios.get(
    "https://rithm-jeopardy.herokuapp.com/api/categories?count=100"
  );

  if (res.data && Array.isArray(res.data)) {
    const shuffledIds = _.shuffle(res.data.map((c) => c.id));
    return _.take(shuffledIds, NUMBER_OF_CATEGORIES);
  }

  return [];
}

async function getCategoryData(categoryId) {
  const categoryWithClues = {
    id: categoryId,
    title: undefined, // todo set after fetching
    clues: [], // todo set after fetching
  };

  const res = await axios.get(
    `https://rithm-jeopardy.herokuapp.com/api/category?id=${categoryId}`
  );

  if (res.data) {
    categoryWithClues.title = res.data.title;
    const shuffledClues = _.shuffle(res.data.clues);
    categoryWithClues.clues = _.take(
      shuffledClues,
      NUMBER_OF_CLUES_PER_CATEGORY
    );
  }

  return categoryWithClues;
}

function fillTable(categories) {
  let header = $("thead");
  let body = $("tbody");
  header.empty();
  body.empty();

  let hrow = $("<tr>");

  for (let cat of categories) {
    const newTitle = $("<th>");
    newTitle.text(cat.title.toUpperCase());
    hrow.append(newTitle);
  }
  header.append(hrow);

  for (let i = 0; i < 5; i++) {
    let newRow = $("<tr>");
    for (let c in categories) {
      newTd = $("<td>");
      newTd.addClass("clue");
      newTd.on("click", handleClickOfClue);
      const id = "" + c + i;
      newTd.attr("id", id).text("Click Me");
      newRow.append(newTd);
    }
    body.append(newRow);
  }
}

$(".clue").on("click", handleClickOfClue);

function handleClickOfClue(event) {
  const index = event.target.getAttribute("id");

  const category = categories[index.split("")[0]];
  const clue = categories[index.split("")[0]].clues[index.split("")[1]];

  console.log("Cat", category);
  console.log("Clue", clue);

  // Question part
  const activeClue = document.getElementById("active-clue");
  activeClue.children[0].textContent = clue.question + "?";
  activeClue.children[0].style.display = "block";
  activeClue.children[1].innerHTML = `Question Score is: <span>${clue.value}</span>`;
  activeClue.children[2].textContent = clue.answer;

  activeClue.style.display = "block";

  categories.splice(category, category);

  document.getElementById("answer-form").style.display = "block";

  event.target.textContent = clue.value;
  event.target.style.visibility = "hidden";
}

// For restarting the game
document.getElementById("game-reset").addEventListener("click", () => {
  window.location.reload();
});

$("#active-clue").on("click", handleClickOfActiveClue);

function handleClickOfActiveClue(event) {
  const formAnswer = document.getElementById("answer-form");
  const activeClueBox = document.getElementById("active-clue");
  const scoreBox = document.getElementById("score");
  const continueBtn = document.getElementById("next-question");

  formAnswer.addEventListener("submit", (e) => {
    e.preventDefault();

    const givinAnswer = e.target.children[0].value;
    const correctAnswer = e.target.parentElement.children[2].textContent;

    if (givinAnswer === correctAnswer && activeClueMode === 0) {
      activeClueMode == 1;
      score =
        score +
        parseInt(e.target.parentElement.children[1].children[0].textContent);
      scoreBox.style.display = "block";
      scoreBox.textContent = score;
      activeClueBox.children[0].textContent = `The answer is: ${correctAnswer}`;
      e.target.style.display = "none";
    } else if (givinAnswer !== correctAnswer) {
      activeClueBox.children[0].textContent = `Answer is: ${correctAnswer}`;
      e.target.style.display = "none";
      scoreBox.style.display = "block";
    }
    continueBtn.style.display = "inline";
    continueBtn.addEventListener("click", () => {
      activeClueMode = 2;
      e.target.reset();
    });
  });

  if (activeClueMode === 1) {
    activeClueMode = 2;
    activeClueBox.style.display = "none";
  } else if (activeClueMode === 2) {
    activeClueMode = 0;
    activeClueBox.style.display = "none";

    if (categories.length === 0) {
      isPlayButtonClickable = true;
      $("#play").text("Restart the Game!");
      $("#active-clue").html("The End!");
    }
  }
}
