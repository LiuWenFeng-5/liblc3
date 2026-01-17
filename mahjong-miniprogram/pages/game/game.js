const mahjong = require("../../utils/mahjong");

const buildInitialHand = (wall, count = 13) => {
  let currentWall = wall;
  const hand = [];
  for (let i = 0; i < count; i += 1) {
    const result = mahjong.drawTile(currentWall);
    hand.push(result.tile);
    currentWall = result.wall;
  }
  return { hand, wall: currentWall };
};

Page({
  data: {
    wall: [],
    wallCount: 0,
    hand: [],
    melds: [],
    discard: {},
    canPeng: false,
    score: 0,
  },

  onLoad() {
    this.initGame();
  },

  initGame() {
    const wall = mahjong.buildWall();
    const { hand, wall: newWall } = buildInitialHand(wall);
    this.setData({
      wall: newWall,
      wallCount: newWall.length,
      hand,
      melds: [],
      discard: {},
      canPeng: false,
      score: 0,
    });
  },

  discardTile(event) {
    const { id } = event.currentTarget.dataset;
    const { hand } = this.data;
    const tileIndex = hand.findIndex((tile) => tile.id === id);
    if (tileIndex === -1) {
      return;
    }
    const discard = hand[tileIndex];
    const newHand = hand.slice();
    newHand.splice(tileIndex, 1);
    const canPeng = mahjong.canPeng(newHand, discard);
    this.setData({
      hand: newHand,
      discard,
      canPeng,
    });
  },

  drawFromWall() {
    const { wall, hand } = this.data;
    if (wall.length === 0) {
      wx.showToast({
        title: "牌墙已空",
        icon: "none",
      });
      return;
    }
    const result = mahjong.drawTile(wall);
    this.setData({
      wall: result.wall,
      wallCount: result.wall.length,
      hand: [...hand, result.tile],
    });
  },

  handlePeng() {
    const { canPeng, hand, discard, melds, score } = this.data;
    if (!canPeng) {
      return;
    }
    const { newHand, meld } = mahjong.applyPeng(hand, discard);
    const laiziCount = mahjong.countLaizi(newHand);
    const roundScore = mahjong.calculateScore({
      melds: [...melds, meld],
      laiziCount,
      winType: "peng",
    });
    this.setData({
      hand: newHand,
      melds: [...melds, meld],
      discard: {},
      canPeng: false,
      score: score + roundScore,
    });
  },

  goScore() {
    const { score, melds, hand } = this.data;
    wx.setStorageSync("mahjongScore", {
      score,
      melds,
      hand,
    });
    wx.navigateTo({
      url: "/pages/score/score",
    });
  },
});
