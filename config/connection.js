const { Collection } = require('mongodb')

const mongoClient=require('mongodb').MongoClient
const state={
    items:null
}
module.exports.connect=function(done){
    const url='mongodb://192.168.0.112:27017'
    // const dbname='shopping'

    mongoClient.connect(url,(err,data)=>{
        if(err) return done(err)
        state.items=data.db('shopping');
         done()
    })    
}
module.exports.get=function(){
    return state.items
} 
