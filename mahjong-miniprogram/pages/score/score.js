Page({
  data: {
    score: 0,
    melds: [],
    hand: [],
    meldCount: 0,
  },

  onShow() {
    const data = wx.getStorageSync("mahjongScore") || {};
    this.setData({
      score: data.score || 0,
      melds: data.melds || [],
      hand: data.hand || [],
      meldCount: (data.melds || []).length,
    });
  },

  backToHome() {
    wx.reLaunch({
      url: "/pages/index/index",
    });
  },
});
