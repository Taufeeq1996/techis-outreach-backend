const mongoose = require("mongoose");
const { Schema } = mongoose;

const openedEmailSchema = new Schema({
    address: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    openedTimestamps: [{
        type: Date,
        default: Date.now
    }]
});

const emailBatchSchema = new Schema({
    _id: {
        type: String,
        required: true
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',  
        required: true
    },
    emailCredentialId: {  
        type: Schema.Types.ObjectId,
        ref: 'GmailCredentials',  
        required: true
    },
    emailTemplateId: {  
        type: Schema.Types.ObjectId,
        ref: 'GmailTemplate',  
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    emailCount: {
        type: Number,
        required: true
    },
    openedEmail: [openedEmailSchema]
});

const EmailBatch = mongoose.model("EmailBatch", emailBatchSchema);

module.exports = EmailBatch;
