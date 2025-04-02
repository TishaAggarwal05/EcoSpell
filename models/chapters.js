const mongoose = require('mongoose');
const ChapterSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  phoneme: String,
  levels: [{ type: mongoose.Schema.Types.ObjectId, ref: "Level" }]
});
const Chapter = mongoose.model("Chapter", ChapterSchema);
module.exports = Chapter;