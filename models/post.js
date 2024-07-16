const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const { format, isToday, differenceInDays } = require('date-fns');

const PostSchema = new Schema(
  {
    text: { type: String, required: true, trim: true, maxLength: 500 },
    user: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
  },
  {
    timestamps: true,
  }
);

PostSchema.virtual('createdAtFormatted').get(function () {
  const now = new Date();
  const createdAtDate = new Date(this.createdAt);

  if (differenceInDays(now, createdAtDate) >= 1) {
    // If the createdAt date is more than 24 hours old
    return format(createdAtDate, 'MM/dd/yyyy');
  } else {
    // If the createdAt date is within the last 24 hours
    return format(createdAtDate, 'HH:mm:ss');
  }
});

module.exports = mongoose.model('Post', PostSchema);
