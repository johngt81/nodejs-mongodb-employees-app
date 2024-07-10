const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { nextTick } = require('process');

const app = express();
const port = 3000;

const directoryPath = 'uploads/';

const storage = multer.diskStorage({
    destination: function(req, file, cb){
        cb(null, directoryPath); //Specify the upload directory
    },
    filename: function(req, file, cb) {
        cb(null, file.originalname); //Use the original file name
    }
});

const upload = multer({storage: storage});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file){
        return next(new Error('No file uploaded'))
    }

    const uploadedFile = req.file;
    console.log('Uploaded file: ', uploadedFile);
    fs.readdir(directoryPath, (err, files) => {
        if (err){
            return res.status(500).send('Error reading directory')
        }

        let strfilenames = `<a href='/'>Home</a><br/>`;
        
        files.forEach((file) => {
            strfilenames = `${strfilenames} <a target='_blank' href='file/${file}'>${file}</a><br />`
        });

        res.send(strfilenames);

    });

});
//Serve uploaded files
app.use('/file', express.static('uploads'));

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

