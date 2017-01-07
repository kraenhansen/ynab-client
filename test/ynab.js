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

describe('ynab', function() {

  describe('loginUser', function() {
    it('should return a session id', function(done) {
      ynab.loginUser(email, password).then((response) => {
        assert(response);
        assert(!response.error);
        assert(response['session_token']);
        done();
      });
    });
  });

  describe('getInitialUserData', function() {
    it('should still be logged in', function(done) {
      ynab.getInitialUserData().then((response) => {
        assert(response);
        assert(!response.error);
        assert.equal(response.user.email, email);
        done();
      });
    });
  });

  describe('syncBudgetData', function() {
    it('should get transactions', function(done) {
      ynab.syncBudgetData().then((response) => {
        assert(response.changed_entities.be_scheduled_transactions.length > 0);
        done();
      });
    });
  });
});
