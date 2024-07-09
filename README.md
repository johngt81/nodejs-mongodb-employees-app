# nodejs-mongodb-employees-app


Command for MongoDB

To connect to mongo with an authenticated user

mongosh --username user --password pass

use my_db
db.createCollection("my_collection")
db.my_collection.insertOne({});
db.my_collection.find();

https://www.mongodb.com/docs/mongodb-shell/


Deployment:
docker build . -t customerapp
docker compose up