const { response } = require('express');
const { promiseCallback } = require('express-fileupload/lib/utilities');
const async = require('hbs/lib/async');
const { resolve } = require('promise');
var collection = require('../config/collection')
var db = require('../config/connection')
var objectId = require('mongodb').ObjectID
const Razorpay = require('razorpay');
var instance = new Razorpay({
    key_id: 'rzp_test_FhMeFCb2zTw9wQ',
    key_secret: 'VRwHnU479fEz0zPOfIn0mnXV',
});

module.exports = {

    generateRazorpay: (orderId, total) => {
        return new Promise((resolve, reject) => {

            instance.orders.create({
                amount: total*100,
                currency: "INR",
                receipt: orderId.toString()
            }, function (err, order) {
                resolve(order);
            }
            )
        })
    },

    addProduct: (product, callback) => {
        product.price = parseInt(product.price);
        db.get().collection('product').insertOne(product).then((data) => {
            callback(data.insertedId);
        })
    },
    getAllProducts: () => {
        return new Promise((resolve, reject) => {
            let products = db.get().collection(collection.PRODUCT_COLLECTION).find().toArray();
            resolve(products)
        })
    },
    deleteProduct: (proId) => {
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collection.PRODUCT_COLLECTION).deleteOne({ _id: objectId(proId) }).then((response) => {
                resolve(response);
            })
        })
    },
    getProductDetails: (proId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: objectId(proId) }).then((product) => {
                resolve(product);
            })
        })
    },
    updateProduct: (proId, body) => {
        body.price = parseInt(body.price);
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collection.PRODUCT_COLLECTION).updateMany({ _id: objectId(proId) }, {

                $set: {
                    name: body.name,
                    price: body.price,
                    category: body.category
                }
            }).then((response) => {
                resolve(response);
            })
        })
    },
    addToCart: (proId, userId) => {
        let proObj = {
            item: objectId(proId),
            quantity: 1
        }
        return new Promise(async (resolve, reject) => {
            let userobj = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })
            if (userobj) {
                let proExist = userobj.products.findIndex(product => product.item == proId);
                console.log(proExist)
                if (proExist !== -1) {
                    db.get().collection(collection.CART_COLLECTION).updateOne({ user: objectId(userId), 'products.item': objectId(proId) },
                        {
                            $inc: { 'products.$.quantity': 1 }
                        }).then(() => {
                            resolve()
                        })
                }
                else {
                    db.get().collection(collection.CART_COLLECTION).updateOne({ user: objectId(userId) }, {
                        $push: {
                            products: proObj
                        }
                    }).then((response) => {
                        resolve();
                    })
                }
            }
            else {
                let cartobj = {
                    user: objectId(userId),
                    products: [proObj]
                }
                db.get().collection(collection.CART_COLLECTION).insertOne(cartobj).then((response) => {
                    resolve();
                })
            }
        })
    },
    getCart: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cartItems = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: {
                        user: objectId(userId)
                    }
                },
                {

                    $unwind: '$products'

                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                }, {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                }

            ]).toArray()

            resolve(cartItems);
        })
    },
    getCartCount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let user = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })
            let count = 0
            if (user) {
                count = user.products.length
            }
            resolve(count)
        })
    },
    changeProductQuantity: (details) => {
        details.count = parseInt(details.count);
        details.itemnum = parseInt(details.itemnum)

        if (details.count == -1 && details.itemnum == 1) {
            return new Promise(async (resolve, reject) => {
                await db.get().collection(collection.CART_COLLECTION).updateOne({ _id: objectId(details.cart) }, {
                    $pull: {
                        products: { item: objectId(details.product) }
                    }
                }).then((response) => {
                    resolve({ removeproduct: true })
                })
            })
        } else {
            return new Promise((resolve, reject) => {
                db.get().collection(collection.CART_COLLECTION).updateOne({ _id: objectId(details.cart), 'products.item': objectId(details.product) },
                    {
                        $inc: { 'products.$.quantity': details.count }
                    }).then((response) => {
                        console.log(response);
                        resolve(response)
                    })

            })
        }
    },
    cartDelete: (userId, proId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CART_COLLECTION).updateOne({ user: objectId(userId) }, {
                $pull: {
                    products: { item: objectId(proId) }
                }
            }).then((response) => {
                resolve(response)
            })
        })

    },
    getTotal: (userId) => {
        return new Promise(async (resolve, reject) => {
            let total = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: {
                        user: objectId(userId)
                    }
                },
                {

                    $unwind: '$products'

                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                }, {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                }, {
                    $group: {

                        _id: null,
                        total: { $sum: { $multiply: ['$quantity', '$product.price'] } }
                    }
                }
            ]).toArray()
            let totalamount = total[0].total
            resolve(totalamount);
        })
    },
    placeOrder: (data, products, total) => {
        return new Promise((resolve, reject) => {
            let status = data.payment === 'COD' ? 'placed' : 'pending'
            let orderObj = {
                orderDetails: {
                    address: data.address,
                    mobile: data.mobile,
                    pincode: data.pincode
                },
                userId: objectId(data.userId),
                paymentMethod: data.payment,
                products: products,
                status: status,
                total: total,
                date: new Date().toUTCString()
            }
            db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response) => {
                db.get().collection(collection.CART_COLLECTION).deleteOne({ user: objectId(data.userId) })
                resolve(response.insertedId)
            })
        })

    },

    getProductsList: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })
            resolve(cart.products);

        })
    },
    viewOrders: (orderId) => {
        return new Promise(async (resolve, reject) => {
            let orderItems = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: {
                        _id: objectId(orderId)
                    }
                },
                {

                    $unwind: '$products'

                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                }, {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                }

            ]).toArray()

            resolve(orderItems);
        })


    },
    getOrders: (userId) => {
        return new Promise(async (resolve, reject) => {
            let orders = await db.get().collection(collection.ORDER_COLLECTION).find({ userId: objectId(userId) }).toArray()
            resolve(orders)
        })

    },
    verifyPayment:(details)=>{
        return new Promise((resolve,reject)=>{
            const key_secret='VRwHnU479fEz0zPOfIn0mnXV'
            const crypto=require('crypto');
            let hmac = crypto.createHmac('sha256',key_secret);
            hmac.update(details['payment[razorpay_order_id]'] + "|" + details['payment[razorpay_payment_id]']);
            const generated_signature = hmac.digest('hex');
            if(generated_signature==details['payment[razorpay_signature]']){
                resolve()
            }else{
                reject()
            }

        })
    }
    ,
    updateStatus:(orderId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.ORDER_COLLECTION).updateOne({_id:objectId(orderId)},{
                $set:{ status:"placed" }
            }
                ).then(()=>{
                    resolve()
                })
                
        })

    }


}