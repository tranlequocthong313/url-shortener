const { Schema, model } = require('mongoose');

const shortUrlSchema = new Schema({
    url: { type: String, required: true },
    shortId: { type: String, required: true }
}, {
    timestamps: true
});

module.exports = model('shortUrl', shortUrlSchema)

