const mongoose = require("mongoose");
const { Schema } = mongoose;

const kixieBatchSchema = new Schema({
    _id: {
        type: String,
        required: true
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',  
        required: true
    },
    kixieCredentialId: {  
        type: Schema.Types.ObjectId,
        ref: 'GmailCredentials',  
        required: true
    },
    kixieTemplateId: {  
        type: Schema.Types.ObjectId,
        ref: 'GmailTemplate',  
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    smsCount: {
        type: Number,
        required: true
    },
});

const kixieBatch = mongoose.model("kixieBatch", kixieBatchSchema);

module.exports = kixieBatch;
