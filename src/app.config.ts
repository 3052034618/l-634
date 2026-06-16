export default defineAppConfig({
  pages: [
    'pages/home/index',
    'pages/record/index',
    'pages/report/index',
    'pages/asset/index',
    'pages/profile/index',
    'pages/add-transaction/index',
    'pages/transfer/index',
    'pages/transaction-detail/index',
    'pages/add-account/index',
    'pages/account-detail/index',
    'pages/account-list/index',
    'pages/budget/index',
    'pages/budget-detail/index',
    'pages/credit/index',
    'pages/goal-list/index',
    'pages/goal-detail/index',
    'pages/export/index',
    'pages/category-manage/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#ffffff',
    navigationBarTitleText: '个人记账',
    navigationBarTextStyle: 'black',
    backgroundColor: '#f8fafc'
  },
  tabBar: {
    color: '#94a3b8',
    selectedColor: '#10b981',
    backgroundColor: '#ffffff',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/home/index',
        text: '首页'
      },
      {
        pagePath: 'pages/record/index',
        text: '记账'
      },
      {
        pagePath: 'pages/report/index',
        text: '报表'
      },
      {
        pagePath: 'pages/asset/index',
        text: '资产'
      },
      {
        pagePath: 'pages/profile/index',
        text: '我的'
      }
    ]
  }
})
