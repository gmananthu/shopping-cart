var db = require("../config/connection");
var collection = require("../config/collection");
var Promise = require('promise');
var bcrypt = require('bcrypt');

module.exports = {
    doAdminLogin: (adminData) => {
        return new Promise(async (resolve, reject) => {
            let adminStatus = false;
            let response = {}
            let admin = await db.get().collection(collection.ADMIN_COLLECTION).findOne({ email: adminData.email })
            if (admin) {
                console.log(admin)
                bcrypt.compare(adminData.password,admin.password).then((status) => {
                    if (status) {
                        console.log('admin login success');
                        response.admin = admin;
                        response.adminStatus = true;
                        resolve(response)
                    }
                    else {
                        console.log(adminData.password)
                        console.log('login fail')
                        resolve({ adminStatus: false })
                    }

                })
            } else {
                console.log('login fail');
                resolve({ adminStatus: false })
            }

        })
    }
    //  doSignup:()=>{
    //     async function pass(){
    //    let encryptpass=await bcrypt.hash("12345", 10);
    //      let admindetails={
    //          name:"Ananthu",
    //          email:"gmananthu2@gmail.com",
    //          password: encryptpass
    //      }
    //     db.get().collection(collection.ADMIN_COLLECTION).insertOne(admindetails,(err,res)=>{
    //         if(err) throw err;
    //         else{
    //             console.log("admin added")
    //         }
    //     })
    //     }
    //      pass();

    //  }
 
}