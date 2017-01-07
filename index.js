const _ = require('lodash');
const request = require('request-promise').defaults({
  jar: true
});

const BASE_URL = 'https://app.youneedabudget.com/api/v1';

const ynab = {
  deviceInfo: {
    id: null
  },
  sessionToken: null,
  setDeviceId: (id) => {
    ynab.deviceInfo.id = id;
  },
  setBudgetVersionId: (id) => {
    ynab.budgetVersionId = id;
  },
  postRequest: (formData) => {
    const headers = {};
    if(ynab.sessionToken) {
      headers['X-Session-Token'] = ynab.sessionToken;
    }
    if(ynab.deviceInfo && ynab.deviceInfo.id) {
      headers['X-YNAB-Device-Id'] = ynab.deviceInfo.id;
    }
    return request.post({
      url: BASE_URL + '/catalog',
      formData,
      headers
    }).then(JSON.parse);
  },
  loginUser: (email, password) => {
    return ynab.postRequest({
      'operation_name': 'loginUser',
      'request_data': JSON.stringify({
        email,
        password,
        'remember_me': false,
        'device_info': ynab.deviceInfo
      })
    }).then(response => {
      ynab.sessionToken = response['session_token'];
      return response;
    });
  },
  getInitialUserData: () => {
    return ynab.postRequest({
      'operation_name': 'getInitialUserData',
      'request_data': JSON.stringify({
        'device_info': ynab.deviceInfo
      })
    });
  },
  syncBudgetData: (data) => {
    const defaults = {
      'budget_version_id': ynab.budgetVersionId,
      'starting_device_knowledge': 0,
      'ending_device_knowledge': 0,
      'device_knowledge_of_server': 0,
      'calculated_entities_included': false,
      'changed_entities': {}
    };
    return ynab.postRequest({
      'operation_name': 'syncBudgetData',
      'request_data': JSON.stringify(_.merge(defaults, data))
    });
  }
};

module.exports = ynab;
