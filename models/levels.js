const mongoose = require('mongoose');
// Level Schema
const LevelSchema = new mongoose.Schema({
    chapter_id: { type: mongoose.Schema.Types.ObjectId, ref: "Chapter" },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    phoneme: String,
    score: Number,
    difficulty: String,
});
const Level = mongoose.model("Level", LevelSchema);

module.exports = Level;