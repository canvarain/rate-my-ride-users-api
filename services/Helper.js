'use strict';

/**
 * Utility helper class.
 *
 * @author      ritesh
 * @version     1.0.0
 */

var bcrypt = require('bcrypt-nodejs'),
  async = require('async'),
  crypto = require('crypto'),
  config = require('config');

/**
 * Generate a hash of the given plainText string
 *
 * @param  {String}       plainText        plainText string
 * @param  {Function}     callback         callback function
 */
exports.generateHash = function(plainText, callback) {
  async.waterfall([
    function(cb) {
      bcrypt.genSalt(config.SALT_WORK_FACTOR, cb);
    },
    function(salt, cb) {
      bcrypt.hash(plainText, salt, null, cb);
    }
  ], callback);
};

/**
 * Generate random bytes of given length
 *
 * @param  {Number}       length           length in bytes
 * @param  {Function}     callback         callback function
 */
exports.randomBytes = function(length, callback) {
  crypto.randomBytes(length, function(err, buff) {
    if(err) {
      return callback(err);
    }
    callback(null, buff.toString('hex'));
  });
};