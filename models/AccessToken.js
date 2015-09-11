'use strict';

/**
 * Represent a social network access token in the system
 *
 * @author      ritesh
 * @version     1.0.0
 */

var mongoose = require('../datasource').getMongoose(),
  Schema = mongoose.Schema;

var AccessTokenSchema = new Schema({
  accessToken: {type: String, required: true},
  refreshToken: {type: String, required: false},
  socialNetwork: {type: String, required: true}
});

// module exports
module.exports = {
  AccessTokenSchema: AccessTokenSchema
};