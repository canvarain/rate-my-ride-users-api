'use strict';

var countryData = require('country-data');
var errors = require('common-errors');

/**
 * Get all the countries list
 * @param  {Function}     callback        callback function
 */
exports.getAll = function(callback) {
  var countries = countryData.countries;
  callback(null, countries);
};

exports.validateCountry = function(country, callback) {
  var lookup = countryData.lookup;
  var countries = lookup.countries(country);
  if(!countries || countries.length === 0) {
    return callback(new errors.ValidationError('Invalid country'));
  }
  callback();
};