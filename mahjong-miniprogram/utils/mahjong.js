const SUITS = ["wan", "tiao", "tong"];
const NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const WINDS = ["east", "south", "west", "north"];
const DRAGONS = ["red", "green", "white"];

const tileNameMap = {
  wan: "万",
  tiao: "条",
  tong: "筒",
  east: "东",
  south: "南",
  west: "西",
  north: "北",
  red: "红中",
  green: "发财",
  white: "白板",
};

const createSuitTiles = () => {
  const tiles = [];
  SUITS.forEach((suit) => {
    NUMBERS.forEach((value) => {
      for (let i = 0; i < 4; i += 1) {
        tiles.push({
          id: `${suit}-${value}-${i}`,
          type: suit,
          value,
          label: `${value}${tileNameMap[suit]}`,
        });
      }
    });
  });
  return tiles;
};

const createHonorTiles = () => {
  const tiles = [];
  WINDS.forEach((wind) => {
    for (let i = 0; i < 4; i += 1) {
      tiles.push({
        id: `${wind}-${i}`,
        type: "wind",
        value: wind,
        label: tileNameMap[wind],
      });
    }
  });
  DRAGONS.forEach((dragon) => {
    for (let i = 0; i < 4; i += 1) {
      tiles.push({
        id: `${dragon}-${i}`,
        type: "dragon",
        value: dragon,
        label: tileNameMap[dragon],
      });
    }
  });
  return tiles;
};

const shuffle = (tiles) => {
  const copy = tiles.slice();
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const buildWall = () => shuffle([...createSuitTiles(), ...createHonorTiles()]);

const isLaizi = (tile) => tile && tile.type === "dragon" && tile.value === "red";

const countMatching = (hand, target) =>
  hand.filter((tile) => tile.type === target.type && tile.value === target.value).length;

const countLaizi = (hand) => hand.filter(isLaizi).length;

const canPeng = (hand, discard) => {
  const matchCount = countMatching(hand, discard);
  if (matchCount >= 2) {
    return true;
  }
  return matchCount === 1 && countLaizi(hand) >= 1;
};

const applyPeng = (hand, discard) => {
  const newHand = hand.slice();
  const meld = [discard];
  const takeIndex = newHand.findIndex(
    (tile) => tile.type === discard.type && tile.value === discard.value
  );
  if (takeIndex !== -1) {
    meld.push(newHand.splice(takeIndex, 1)[0]);
  }
  if (meld.length < 3) {
    const laiziIndex = newHand.findIndex(isLaizi);
    if (laiziIndex !== -1) {
      meld.push({
        ...newHand.splice(laiziIndex, 1)[0],
        label: "红中(赖子)",
      });
    }
  }
  const secondIndex = newHand.findIndex(
    (tile) => tile.type === discard.type && tile.value === discard.value
  );
  if (meld.length < 3 && secondIndex !== -1) {
    meld.push(newHand.splice(secondIndex, 1)[0]);
  }
  return { newHand, meld };
};

const drawTile = (wall) => {
  const newWall = wall.slice();
  const tile = newWall.shift();
  return { tile, wall: newWall };
};

const calculateScore = ({ melds, laiziCount, winType }) => {
  let score = 1;
  score += melds.length;
  if (laiziCount > 0) {
    score += laiziCount;
  }
  if (winType === "self") {
    score += 2;
  }
  if (winType === "peng") {
    score += 1;
  }
  return score;
};

module.exports = {
  buildWall,
  drawTile,
  canPeng,
  applyPeng,
  calculateScore,
  isLaizi,
  countLaizi,
};
