const assert = require('assert');
const path = require('path');
const ynab = require('..');

require('dotenv').config({
  path: path.join(__dirname, '..', '.env')
});

const email = process.env.YNAB_EMAIL;
const password = process.env.YNAB_PASSWORD;
ynab.setDeviceId(process.env.YNAB_DEVICE_ID);
ynab.setBudgetVersionId(process.env.YNAB_BUDGET_VERSION_ID);
const accountId = process.env.YNAB_ACCOUNT_ID;

describe('ynab', function() {

  describe('loginUser', function() {
    it('should return a session id', function() {
      return ynab.loginUser({email, password}).then((response) => {
        assert(response);
        assert(!response.error);
        assert(response['session_token']);
      });
    });
  });

  describe('getInitialUserData', function() {
    it('should still be logged in', function() {
      return ynab.getInitialUserData().then((response) => {
        assert(response);
        assert(!response.error);
        assert.equal(response.user.email, email);
      });
    });
  });

  describe('getTransactions', function() {
    it('should get transactions', function() {
      return ynab.getTransactions().then((transactions) => {
        assert(transactions.length > 0);
        transactions.forEach(transaction => {
          if(transaction.source) {
            console.log(transaction.id);
          }
        });
      });
    });
  });

  let newTransactionId = null;

  describe('addTransaction', function() {
    it('should create a transaction', function() {
      return ynab.addTransaction({
        'entities_account_id': accountId,
        'date': '2017-01-07', // moment('today') ?
        'amount': 123000,
        'memo': 'Importeret',
        // 'cleared': 'Cleared' // Or what?
        'accepted': false, // Or what?
        // 'transfer_account_id': null, // Might help?
        // 'transfer_transaction_id': null, // Might help?
        // 'matched_transaction_id': '123456789', // Might help?
        // 'imported_payee': 'Payee?',
        // 'imported_date': null
      }).then((response) => {
        assert(response);
        assert(!response.error);
        assert.equal(response.changed_entities.be_transactions.length, 1);
        newTransactionId = response.changed_entities.be_transactions[0].id;
        assert(newTransactionId);
      });
    });
  });

  describe('removeTransaction', function() {
    it('should remove a transaction', function() {
      return ynab.removeTransaction(newTransactionId)
      .then((response) => {
        assert(response);
        assert(!response.error);
      });
    });
  });
});
