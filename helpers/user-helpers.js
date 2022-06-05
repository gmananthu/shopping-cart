var collection = require('../config/collection')
var Promise = require('promise')
var db = require('../config/connection')
var bcrypt = require('bcrypt');

const { USER_COLLECTION } = require('../config/collection')
const async = require('hbs/lib/async')
const { response } = require('express');
const { promise } = require('bcrypt/promises');
const { resolve } = require('promise');

module.exports = {
    doSignup: (userData) => {
        return new Promise(async (resolve, reject) => {
            userData.password = await bcrypt.hash(userData.password, 10)
            db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((data) => {
                resolve(data.InsertOneResult);
            })
        })
    },
    doLogin: (userData) => {
        return new Promise(async (resolve, reject) => {
            let status = false;
            let response = {}
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ email: userData.email })
            if (user) {
                bcrypt.compare(userData.password, user.password).then((status) => {
                    if (status) {
                        console.log('login success');
                        response.user = user;
                        response.status = true;
                        resolve(response)
                    }
                    else {
                        console.log('login fail')
                        resolve({ status: false })
                    }

                })
            } else {
                console.log('login fail');
                resolve({ status: false })
            }

        })
    }
}