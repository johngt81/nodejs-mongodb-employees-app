const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const Customers = require('./customer');
const bcrypt = require('bcryptjs');
const saltRounds = 5;
const session = require('express-session');
const uuid = require('uuid');
const Employees = require('./employee');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const secretKey = 'mySecretKey';
let usersDictionary = {};
const winston = require('winston');
const readline = require('node:readline').createInterface({
    input: process.stdin,
    output: process.stdout
});
const { ValidationError, InvalidUserError, AuthenticatedFailed } = require('./errors/CustomError');

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({filename: 'logfile.log'})
    ]
})

const app = express();

const port = 3000;
// const uri = "mongodb://user:pass@localhost:27017";
const uri = "mongodb://user:pass@mongodb:27017";
mongoose.connect(uri, { 'dbName': 'customerDB'});

//Middleware to parse JSON requests
app.use("*", bodyParser.json());
// app.use('/static', express.static(path.join(".", "frontend")));

//Middleware to handle URL-encoded form data
app.use(bodyParser.urlencoded({extended: true}));
app.use(cors());
app.use(session({
    cookie: {maxAge: 120000}, //session expires after 2 minutes
    secret: 'mysecret',
    res: false,
    saveUninitialized: true,
    genid: () => uuid.v4()
}));
//Global Error handler middleware
app.use((err, req, res, next) => {
    //Set default value
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'Error';

    console.log(err.stack);

    res.status(err.statusCode).json({
        status: err.status,
        message: err.message
    })
});
//Handle all nvalid requests that comes to the app
// app.all('*', (req, res, next)=>{
//     const err = new Error('Cannot find url');
//     err.status = "Endpoint failure";
//     err.statusCode = 404;
//     next(err);
// })

//Endpoints
//Sample endpoint with middleware
// app.get('/', verifyToken, (req, res) => {

app.get('/', (req, res, next) => {
    try {
        logger.info('Hello World');
        logger.error('Error thrown');
        logger.warn('This is a warning');
        throw new ValidationError();
        res.send('Heeelello');
    }
    catch (error){
        next(error);
    }
})

app.post('/api/login', async (req, res) => {
    try {
        const data = req.body;
        let username = data['user_name'];
        let password = data['password'];

        const user = usersDictionary[username];
        const passwordMatched = await bcrypt.compare(password, user.hashedpwd);
        if (!user || !passwordMatched){
            res.status(401).send('User information incorrect');
            return;
        }
        res.status(200).send('Login successfully');
    } catch (error){
        res.status(400).json({message: error.message});
    }
    // const documents = await Customers.find({
    //     user_name: user_name
    // });

    // if (documents.length > 0){
    //     const user = documents[0];

    //     const token = jwt.sign({
    //         username: user.user_name 
    //      }, secretKey);
    //      res.json({token});

    //     const storedPassword = documents[0]['password'];

    //     let hashedpwd = bcrypt.hashSync(password, saltRounds);

    //     let result = await bcrypt.compare(hashedpwd, storedPassword);
    //     // let result = await bcrypt.compare(password, storedPassword);
    //     if (result){
    //         const genidValue = req.sessionID;
    //         res.cookie('username', user_name);
    //         res.send('User Logged In');
    //     } else {
    //         res.send("Incorrect");
    //     }
    // } else {
    //     res.send("User information incorrect");
    // }
})

const authenticationToken = (req, res, next) => {
    const token = req.headers['authorization'];

    if (!token){
        res.sendStatus(401);
        return;
    }

    jwt.verify(token, secretKey, (err, user) => {
        if (err){
            res.sendStatus(403);
            return;
        }

        req.user = user;
        next();
    })
}

function verifyToken(req, res, next){
    const token = req.headers['authorization'];
    
    if (typeof token !== 'undefined'){
        jwt.verify(token, secretKey, (err, authData) => {
            if (err){
                res.sendStatus(403);
            } else {
                res.authData = authData;
                next();
            }
        });
    } else {
        res.sendStatus(401);
    }
}

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

app.post('/api/add_customer', async (req, res) => {
    try {
        const data = req.body;
        const username = data['user_name'];

        const documents = await Customers.find({
            user_name: username,
        });

        if (documents.length > 0){
            res.status(409).send('User already exists');
            return;
        }

        const hashedpwd = await bcrypt.hash(data['password'], saltRounds);
        usersDictionary[username] = { hashedpwd };

        //Creating a customer with password hashed
        const customer = new Customers({
            "user_name": username,
            "age": data['age'],
            "password": hashedpwd,
            "email": data['email']
        });

        await customer.save();

        res.status(201).send('Customer added successfully');
    }
    catch (error){
        res.status(500).json({ message: error.message });
    }
})

app.get('/api/employees', async (req, res) => {
    try {
        const documents = await Employees.find();
        res.json(documents);
    } catch (error){
        res.status(500).json({message: error.message});
    }
});

app.post('/api/add_employee', async (req, res)=> {
    try {
        const data = req.body;
        const emp = new Employees({
            "emp_name": data["name"],
            "age": data["age"],
            "location": data["location"],
            "email": data["email"]
        });

        await emp.save();
        res.json({ message: "Employee added." })
    }
    catch (error){
        res.status(500).json({ message: error.message });
    }
})


app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
})

