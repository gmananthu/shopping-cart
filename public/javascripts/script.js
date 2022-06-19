
function addToCart(proId) {
    $.ajax({
        url: "/addtocart/"+ proId,
        method: 'get',
        success: (response) => {
                if (response.status) {
                let count = $('#cart-count').html()
                count = parseInt(count) + 1
                    $('#cart-count').html(count)
            }
            else{
                // login msg
                document.getElementById(proId).style.visibility="visible"
            }
         }
     })
    }

function changeQuantity(cartId, proId, count) {
    let itemnum = document.getElementById(proId).innerHTML
    $.ajax({
        url: "/change-product-quantity",
        data: {
            cart: cartId,
            product: proId,
            count: count,
            itemnum: itemnum

        },
        method: 'post',
        success: (response) => {
            if (response.removeproduct) {
             location.reload()
            }
            if(response){
            var newcount= $('#'+proId).html()
            newcount=parseInt(newcount)+parseInt(count)
                $('#'+proId).html(newcount)
            }
                   }

    })

}

$("#paymentForm").submit((e) => {
    e.preventDefault();

    $.ajax({
        url: "/place-order",
        method: "post",
        data: $("#paymentForm").serialize(),
        success: function (response) {
            if (response.codSuccess) {
                location.href = "/order-success"
            }
            else{
                razorpayGenerate(response);
            }
        }
    })
})

function razorpayGenerate(order){
    var options = {
        "key": "rzp_test_FhMeFCb2zTw9wQ", // Enter the Key ID generated from the Dashboard
        "amount": order.total, // Amount is in currency subunits. Default currency is INR. Hence, 50000 refers to 50000 paise
        "currency": "INR",
        "name": "Ananthu",
        "description": "Test Transaction",
        "image": "https://example.com/your_logo",
        "order_id": order.id, //This is a sample Order ID. Pass the `id` obtained in the response of Step 1
        "handler": function (response){ 
            verifyPayment(response,order); 
        },
        "prefill": {
            "name": "Gaurav Kumar",
            "email": "gaurav.kumar@example.com",
            "contact": "9999999999"
        },
        "notes": {
            "address": "Razorpay Corporate Office"
        },
        "theme": {
            "color": "#3399cc"
        }
    };
    var rzp1 = new Razorpay(options);
    rzp1.open();
    
}
function verifyPayment(payment,order){
    $.ajax({
        url:"/verify-payment",
        data:{
            payment,
            order
        },
        method:'post',
        success: function(response){
            if(response.status){
                location.href="/order-success"
            }
            else{
                alert("payment unsuccessful")
            }
               }
            })
        }
       
