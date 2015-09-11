'use strict';

/**
 * This Service exposes the contract with the 'users' collection in the database
 *
 * @author      ritesh
 * @version     1.0.0
 */

/**
 * This Service exposes the contract with the 'users' collection in the database
 *
 * @author      ritesh
 * @version     1.0
 */

var UserSchema = require('../models/User').UserSchema,
  config = require('config'),
  db = require('../datasource').getDb(config.MONGODB_URL, config.POOL_SIZE),
  User = db.model('User', UserSchema);

var async = require('async'),
  jwt = require('jwt-simple'),
  moment = require('moment'),
  httpStatus = require('http-status'),
  _ = require('lodash'),
  helper = require('./Helper'),
  bcrypt = require('bcrypt-nodejs'),
  errors = require('common-errors');

var countryService = require('./CountryService');

/**
 * Helper method to get the user by email address
 * @param  {String}       email           email of the user to find
 * @param  {Function}     callback        callback function
 */
var _findByEmail = function(email, callback) {
  var query = User.where({ email: email });
  query.findOne(callback);
};

/**
 * Register a user
 * @param  {Object}       data            data from client
 * @param  {Function}     callback        callback function
 */
exports.register = function(data, callback) {
  var timestamp = moment().valueOf();
  var entity = _.pick(data, 'firstName', 'lastName', 'email', 'password', 'deviceId', 'deviceType', 'type', 'mobileNumber', 'country');
  async.waterfall([
    function(cb) {
      countryService.validateCountry(entity.country, cb);
    },
    function(cb) {
      _findByEmail(entity.email, function(err, user) {
        if(err) {
          cb(err);
        } else if(user) {
          cb(new errors.ValidationError('Email is already registered', httpStatus.BAD_REQUEST));
        } else {
          cb();
        }
      });
    },
    function(cb) {
      // hash the user password
      helper.generateHash(entity.password, cb);
    },
    function(hash, cb) {
      _.extend(entity, {password: hash});
      helper.randomBytes(config.DEFAULT_TOKEN_LENGTH, cb);
    },
    function(token, cb) {
      var millis = timestamp + config.DEFAULT_TOKEN_EXPIRY;
      _.extend(entity, {verifyAccountToken: token, verifyAccountTokenExpiry: millis});
      User.create(entity, cb);
    },
    function(user, cb) {
      // TODO: Use SQS/SES to send email notification to user
      cb(null, user);
    }
  ], callback);
};

/**
 * Perform authentication.
 * @param  {Object}       credentials         credentials for login, must have username and password
 * @param  {Function}     callback            callback function
 */
exports.authenticate = function(credentials, callback) {
  async.waterfall([
    function(cb) {
      _findByEmail(credentials.email, cb);
    },
    function(user, cb) {
      if(!user) {
        return cb(new errors.NotFoundError('User not found for given email address'));
      } else if(user.verifyAccountToken) {
        return cb(new errors.ValidationError('Kindly verify the account first, then proceed for login'));
      } else {
        cb(null, user);
      }
    },
    function(user, cb) {
      bcrypt.compare(credentials.password, user.password, function(err, result) {
        if(err) {
          cb(err);
        } else if(result) {
          cb(null, user);
        } else {
          cb(new errors.HttpStatusError(httpStatus.UNAUTHORIZED, 'Invalid username or password'));
        }
      });
    },
    function(user, cb) {
      var millis = moment().valueOf() + config.TOKEN_EXPIRATION_IN_MILLIS;
      var token = jwt.encode({
        expiration: millis,
        type: user.type,
        userId: user._id
      }, config.JWT_SECRET);
      cb(null, {token: token});
    }
  ], callback);
};

/**
 * Send forgot password link to email
 * @param  {String}       email           email of the user to find
 * @param  {Function}     callback        callback function
 */
exports.forgotPassword = function(email, callback) {
  // TODO: use SQS/SES to send forgot password email
};

/**
 * Update the user password
 *
 * @param  {Object}       credentials     entity object containing current password and new password to set
 * @param  {[type]}       authUser        current loggedin user context
 * @param  {Function}     callback        callback function
 */
exports.updatePassword = function(credentials, authUser, callback) {
  async.waterfall([
    function(cb) {
      User.findById(authUser.userId, cb);
    },
    function(user, cb) {
      if(!user) {
        // this should never happen
        return cb(new errors.ReferenceError('Something went wrong. Try again'));
      }
      bcrypt.compare(credentials.password, user.password, function(err, result) {
        if(err) {
          cb(err);
        } else if(result) {
          cb(null, user);
        } else {
          cb(new errors.HttpStatusError(httpStatus.UNAUTHORIZED, 'Invalid password'));
        }
      });
    },
    function(user, cb) {
      helper.generateHash(credentials.newPassword, function(err, hash) {
        cb(err, user, hash);
      });
    },
    function(user, hash, cb) {
      _.extend(user, {password: hash});
      user.save(cb);
    }
  ], callback);
};

/**
 * Update the user profile, only first name and last name can be updated using this method
 *
 * @param  {Object}       data            request data from client
 * @param  {[type]}       authUser        current loggedin user context
 * @param  {Function}     callback        callback function
 */
exports.updateProfile = function(data, authUser, callback) {
  var entity = _.pick(data, 'firstName', 'lastName');
  async.waterfall([
    function(cb) {
      User.findById(authUser.userId, cb);
    },
    function(user, cb) {
      if(!user) {
        // this should never happen
        return cb(new errors.ReferenceError('Something went wrong. Try again'));
      }
      _.extend(user, entity);
      user.save(cb);
    }
  ], callback);
};

/**
 * Update the user device
 *
 * @param  {Object}       data            request data from client
 * @param  {[type]}       authUser        current loggedin user context
 * @param  {Function}     callback        callback function
 */
exports.updateDevice = function(data, authUser, callback) {
  var device = _.pick(data, 'deviceId', 'deviceType');
  async.waterfall([
    function(cb) {
      User.findById(authUser.userId, cb);
    },
    function(user, cb) {
      if(!user) {
        // this should never happen
        return cb(new errors.ReferenceError('Something went wrong. Try again'));
      }
      _.extend(user, device);
      user.save(cb);
    }
  ], callback);
};

/**
 * Return current authenticated user profile
 *
 * @param  {[type]}       authUser        current loggedin user context
 * @param  {Function}     callback        callback function
 */
exports.me = function(authUser, callback) {
  User.findById(authUser.userId, callback);
};