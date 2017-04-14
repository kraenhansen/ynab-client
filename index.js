const _ = require('lodash');
const uuid = require('uuid/v4');
const request = require('request-promise').defaults({
  jar: true
});

const BASE_URL = 'https://app.youneedabudget.com/api/v1';

const ynab = {
  deviceInfo: {
    id: uuid()
  },
  sessionToken: null,
  deviceKnowledge: 0,
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
  loginUser: (data) => {
    const defaults = {
      'remember_me': false,
      'device_info': ynab.deviceInfo
    };
    return ynab.postRequest({
      'operation_name': 'loginUser',
      'request_data': JSON.stringify(_.merge(defaults, data))
    }).then(response => {
      ynab.sessionToken = response['session_token'];
      return response;
    });
  },
  getInitialUserData: (data) => {
    const defaults = {
      'device_info': ynab.deviceInfo
    };
    return ynab.postRequest({
      'operation_name': 'getInitialUserData',
      'request_data': JSON.stringify(_.merge(defaults, data))
    });
  },
  syncBudgetData: (data) => {
    const defaults = {
      'budget_version_id': ynab.budgetVersionId,
      'starting_device_knowledge': ynab.deviceKnowledge,
      'ending_device_knowledge': ynab.deviceKnowledge,
      'device_knowledge_of_server': 0,
      'calculated_entities_included': false,
      'changed_entities': {}
    };
    return ynab.postRequest({
      'operation_name': 'syncBudgetData',
      'request_data': JSON.stringify(_.merge(defaults, data))
    }).then(response => {
      ynab.serverKnowledge = response['current_server_knowledge'];
      // TODO: Consider if this is the right way to increase deviceKnowledge
      ynab.deviceKnowledge = response['server_knowledge_of_device'];
      return response;
    });
  },
  getTransactions: () => {
    return ynab.syncBudgetData().then(response => {
      return response.changed_entities.be_transactions;
    });
  },
  addTransactions: (transactionsData) => {
    const defaults = {
      'id': null,
      'is_tombstone': false,
      'source': null,
      'entities_account_id': null,
      'entities_payee_id': null,
      'entities_subcategory_id': null,
      'entities_scheduled_transaction_id': null,
      'date': null,
      'date_entered_from_schedule': null,
      'amount': null,
      'cash_amount': 0,
      'credit_amount': 0,
      'subcategory_credit_amount_preceding': 0,
      'memo': null,
      'cleared': 'Uncleared',
      'accepted': true,
      'check_number': null,
      'flag': null,
      'transfer_account_id': null,
      'transfer_transaction_id': null,
      'transfer_subtransaction_id': null,
      'matched_transaction_id': null,
      'ynab_id': null,
      'imported_payee': null,
      'imported_date': null
    };
    return ynab.syncBudgetData({
      'budget_version_id': ynab.budgetVersionId,
      'starting_device_knowledge': ynab.deviceKnowledge,
      'ending_device_knowledge': ynab.deviceKnowledge + 1,
      'device_knowledge_of_server': ynab.serverKnowledge,
      'calculated_entities_included': false,
      'changed_entities': {
        'be_transaction_groups': transactionsData.map(data => {
          const id = uuid();
          return {
            'id': id,
            'be_transaction': _.merge(defaults, { id }, data),
            'be_subtransactions': null,
            'be_matched_transaction': null
          };
        })
      }
    });
  },
  addTransaction: (data) => {
    return ynab.addTransactions([data]);
  },
  updateTransactions: (transactionsDatas) => {
    return ynab.syncBudgetData({
      'budget_version_id': ynab.budgetVersionId,
      'starting_device_knowledge': ynab.deviceKnowledge,
      'ending_device_knowledge': ynab.deviceKnowledge + 1,
      'device_knowledge_of_server': ynab.serverKnowledge,
      'calculated_entities_included': false,
      'changed_entities': {
        'be_transaction_groups': transactionsDatas.map(data => {
          return {
            'id': data.id,
            'be_transaction': data,
            'be_subtransactions': null,
            'be_matched_transaction': null
          };
        })
      }
    });
  },
  updateTransaction: (data) => {
    return ynab.updateTransactions([data]);
  },
  removeTransactions: (ids) => {
    // Get all transactions
    return ynab.getTransactions().then(transactions => {
      // Filter out the transactions based on id
      return transactions.filter(transaction => ids.indexOf(transaction.id) > -1);
    }).then(transactions => {
      transactions.forEach(transaction => {
        // Send an update with is_tombstone: true
        transaction['is_tombstone'] = true;
        transaction['source'] = null;
      });
      return ynab.updateTransactions(transactions);
    });
  },
  removeTransaction: (id) => {
    return ynab.removeTransactions([id]);
  }
};

module.exports = ynab;
