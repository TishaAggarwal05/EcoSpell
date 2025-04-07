const mongoose = require('mongoose');
// Unplay Schema
const UnplaySchema = new mongoose.Schema({
    chapter_id: { type: mongoose.Schema.Types.ObjectId, ref: "Chapter" },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    phoneme: String,
    difficulty: String,
});
const Unplay = mongoose.model("Unplay", UnplaySchema);

module.exports = Unplay;