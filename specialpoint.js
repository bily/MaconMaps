var mongoose = require('mongoose'),
  mongoose_auth = require('mongoose-auth'),
  Schema = mongoose.Schema;

var SpecialPointSchema = new Schema({
  status: String,
  tablematch: String,
  ll: Array,
  created: {type: Date, default: Date.now},
  name: String,
  description: String
});

SpecialPointSchema.index({
  ll: "2d"
});

var SpecialPoint = mongoose.model('SpecialPoint', SpecialPointSchema);

exports.SpecialPoint = SpecialPoint;
