'use strict';

/**
 * Helper module for canvara-sqs library
 *
 * @author      ritesh
 * @version     1.0.0
 */

var instances = {};
var CanvaraSqs = require('@canvara/canvara-sqs');

/**
 * Get a canvara sqs instance corresponding to a particular region
 *
 * @param  {String}     region          one of the valid AWS SQS regions
 * @param  {Array}      queues          list of queues corresponding to region
 */
exports.getInstance = function(region, queues) {
  if(!instances[region]) {
    instances[region] = new CanvaraSqs({region: region, queues: queues});
  }
  return instances[region];
};