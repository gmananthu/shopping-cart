var express = require('express');
const productHelpers = require('../helpers/product-helpers');
const adminHelpers = require('../helpers/admin-helpers');
const { response } = require('express');
var router = express.Router();

/* GET users listing. */
const verifyLogin= (req,res,next)=>{
  if(req.session.adminLoggedIn){
    next();
  }
  else{
    res.redirect("/admin/login")
  }
}
router.get('/',verifyLogin, function (req, res, next) {
  
  productHelpers.getAllProducts().then((products) => {
    res.render('admin/view-products', { products, admin: true,admindata:req.session.admin })
  })
});
router.get('/login', (req, res) => {
if(req.session.adminLoggedIn){
  res.redirect('/admin')
  }
  else res.render("admin/adminlogin",{admin:true})
})
router.post("/login", (req, res) => {
  adminHelpers.doAdminLogin(req.body).then((response) => {
    if(response.adminStatus) {
      req.session.adminLoggedIn = true
      req.session.admin = response.admin;
      res.redirect('/admin');
    } else {
      req.session.adminLoginErr = "Invalid username or password"
      res.redirect('admin/login');
    }
  })
})
router.get('/admin-logout',verifyLogin, (req, res) => {
  req.session.admin=null;
  req.session.adminLoggedIn=null;
    res.redirect('/admin');
  })

// router.get('/signup',(req,res)=>{
//   adminHelpers.doSignup()
// })

router.get('/add-products',verifyLogin, function (req, res) {
  res.render('admin/add-products', { admin: true, admindata:req.session.admin })
})

router.post('/add-products',verifyLogin, (req, res) => {
  console.log(req.body)
  console.log(req.files.image)

  productHelpers.addProduct(req.body, (id) => {
    let image = req.files.image
    console.log(id);
    image.mv('./public/product-images/' + id + '.jpg', (err, done) => {
      if (!err) {
        res.render('admin/add-products')
      }
      else {
        console.log(err);
      }
    })
  })
});
router.get('/delete-products/:id',verifyLogin, (req, res) => {
  var proId = req.params.id;
  productHelpers.deleteProduct(proId).then((response) => {
    res.redirect('/admin');
  })
})
router.get('/edit-products/:id',verifyLogin, async (req, res) => {
  let products = await productHelpers.getProductDetails(req.params.id).then((product) => {
    console.log(product);
    res.render('admin/edit-products', { product ,admin:true, admindata:req.session.admin })
  })
})
router.post('/edit-products/:id',verifyLogin, (req, res) => {
  productHelpers.updateProduct(req.params.id, req.body).then((response) => {
    res.redirect('/admin');
  }
  )
})
router.get('/orders',verifyLogin, async(req,res)=>{
  let orders =await adminHelpers.getOrders()
  res.render('admin/view-orders',{orders,admin:true, admindata:req.session.admin})
})

module.exports = router; 
