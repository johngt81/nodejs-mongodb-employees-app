const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const customerSchema = new Schema({
    user_name: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    age: {
        type: Number,
        required: true
    },
});

const customerModel = mongoose.model('customers', customerSchema);

module.exports = customerModel;