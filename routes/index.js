const { response } = require('express');
var express = require('express');
const req = require('express/lib/request');
const { resolve } = require('promise');
var productHelpers = require('../helpers/product-helpers');
const { doLogin } = require('../helpers/user-helpers');
var userHelpers = require('../helpers/user-helpers')
var router = express.Router();

/* GET home page. */
const loggedSuccess = (req, res, next) => {
  if (req.session.userLoggedIn) {
    next();
  } else {
    res.redirect('/login');
  }
}


router.get('/', async function (req, res, next) {
  let user = req.session.user
  let cartCount = null;
  if (user) {
    cartCount = await productHelpers.getCartCount(req.session.user._id)
  }
  productHelpers.getAllProducts().then((products) => {
    res.render('index', { products, user, cartCount, admin: false });
  })

});
router.get('/login', (req, res) => {
  if (req.session.userLoggedIn) {
    res.redirect('/')
  } else {
    res.render('user/login', { loginErr: req.session.userLoginErr })
  }
  req.session.userLoginErr = false
})

router.get('/signup', (req, res) => {
  res.render('user/signup')

})
router.post('/signup', (req, res) => {
  userHelpers.doSignup(req.body).then((response) => {
    console.log(response);
    res.redirect('/login');
  })
})
router.post('/login', (req, res) => {
  userHelpers.doLogin(req.body).then((response) => {
    if (response.status) {
      req.session.userLoggedIn = true
      req.session.user = response.user
      console.log(response.user)
      res.redirect('/')
    } else {
      req.session.userLoginErr = "Invalid username or password"
      res.redirect('/login')
    }
  })
})
router.get('/logout', (req, res) => {
  req.session.user=null;
  req.session.userLoggedIn=null;
  res.redirect('/')
    
})
//////cart setup////////
router.get('/cart', loggedSuccess, async (req, res) => {
  let products = await productHelpers.getCart(req.session.user._id)
  if (products[0]) {
    let total = await productHelpers.getTotal(req.session.user._id)
    res.render('user/cart', { user: req.session.user, products, total })
  }
  else {
    res.render('user/nocart', { user: req.session.user })
  }
})

router.get("/addtocart/:id", (req, res) => {
  if(req.session.user){
  productHelpers.addToCart(req.params.id, req.session.user._id).then((response) => {
  res.json({status:true })
    })
  }
  else{
    res.json({status:false})
  } 
})
router.get('/cartdelete/:proId',loggedSuccess, (req, res) => {
  productHelpers.cartDelete(req.session.user._id, req.params.proId).then((response) => {
    res.redirect('/cart')
  })

})
router.post("/change-product-quantity",loggedSuccess, (req, res) => {
  productHelpers.changeProductQuantity(req.body).then((response) => {
    console.log(response)
    res.json(response)

  })
})

/////orders/////
router.get('/orders', loggedSuccess, async (req, res) => {
  let orders = await productHelpers.getOrders(req.session.user._id)
  res.render('user/orders', { user: req.session.user, orders })
})
router.get('/place-order', loggedSuccess, async (req, res) => {
  let total = await productHelpers.getTotal(req.session.user._id)
  res.render('user/place-order', { total, user: req.session.user })
})

router.post("/place-order", loggedSuccess, async (req, res) => {
  let products = await productHelpers.getCart(req.session.user._id)
  if (products[0]) {
  let products = await productHelpers.getProductsList(req.body.userId)
  let total = await productHelpers.getTotal(req.body.userId) 
  productHelpers.placeOrder(req.body, products, total).then((orderId) => {
    if (req.body['payment'] == "online") {
      productHelpers.generateRazorpay(orderId, total).then((response) => {
        res.json(response);
      })
    } 
    else {
      res.json({ codSuccess: true })
    }
  })
}
else{
  console.log("your cart is empthy")
}
})
router.get("/order-success",loggedSuccess, (req, res) => {
  res.render("user/order-success", { user: req.session.user })
})
router.get('/view-orders/:id',loggedSuccess, async (req, res) => {
  let orderItems = await productHelpers.viewOrders(req.params.id)
  res.render("user/view-orders", { orderItems })
})
router.post("/verify-payment",loggedSuccess, (req,res)=>{
 productHelpers.verifyPayment(req.body).then(()=>{
  productHelpers.updateStatus(req.body['order[receipt]']).then(()=>{
    console.log('payment success');
    res.json({status:true});
  })

 }).catch((err)=>{
   console.log(err)
    res.json({status:false})
   
 })
}) 

module.exports = router;
