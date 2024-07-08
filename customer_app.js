const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const Customers = require('./customer');
const bcrypt = require('bcrypt');
const saltRounds = 5;
const session = require('express-session');
const uuid = require('uuid');

const app = express();

const port = 3000;
const uri = "mongodb://user:pass@localhost:27017";
mongoose.connect(uri, { 'dbName': 'customerDB'});

//Middleware to parse JSON requests
app.use("*", bodyParser.json());
// app.use('/static', express.static(path.join(".", "frontend")));

//Middleware to handle URL-encoded form data
app.use(bodyParser.urlencoded({extended: true}));

app.use(session({
    cookie: {maxAge: 120000}, //session expires after 2 minutes
    secret: 'mysecret',
    res: false,
    saveUninitialized: true,
    genid: () => uuid.v4()
}));

//Endpoints
app.get('/', (req, res) => {
    res.send('Heeelello')
})

app.post('api/login', async (req, res) => {
    const data = req.body;
    let user_name = data['user_name'];
    let password = data['password'];

    const documents = await Customers.find({
        user_name: user_name,
        password: password
    });

    if (documents.length > 0){
        const storedPassword = documents[0]['password'];
        let result = await bcrypt.compare(password, storedPassword);
        if (result){
            const genidValue = req.sessionID;
            res.cookie('username', user_name);
            res.send('User Logged In');
        } else {
            res.send("Incorrect");
        }
    } else {
        res.send("User information incorrect");
    }
})

app.get('/api/logout', async (req, res) => {
    req.session.destroy((err) => {
        if (err){
            console.error(err);
        } else {
            res.cookie('username', '', { expires: new Date(0)});
            res.redirect('/');
        }
    })
});

app.post('api/add_customer', async (req, res) => {
    const data = req.body;

    const documents = await Customers.find({
        user_name: data['user_name'],
    });

    if (documents.length > 0){
        res.send('User already exists');
    }

    let hashedpwd = bcrypt.hashSync(data['password'], saltRounds);
    const customer = new Customers({
        "user_name": data['user_name'],
        "age": data['age'],
        "password": hashedpwd,
        // "password": data['password'],
        "email": data['email']
    });

    await customer.save();
    res.send('Customer added successfully');
})



app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
})

