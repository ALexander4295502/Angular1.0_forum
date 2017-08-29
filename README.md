# Angular1.0_forum

### Intro

I intend to construct a forum on which the people can easily establish connections and share their thought with each other. This is my first MEAN project.

### Project Config

Install MongoDB globally
``
$ curl -O https://fastdl.mongodb.org/osx/mongodb-osx-x86_64-3.0.4.tgz
$ mkdir -p mongodb
$ cp -R -n mongodb-osx-x86_64-3.0.4/ mongodb
$ brew install mongodb
$ mkdir -p /data/db
$ mongod --dbpath /data/db
$ chmod 777 /data/db
``

Start MongoDB
``
$ mongod
``

Install dependencies in forum folder
``
$ npm install
``

Then 
``
$ npm start
``
