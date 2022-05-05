const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
 
const app = express()
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(cors({
    origin: '*'
}))

const port = 3000

const Airtable = require('airtable');
const base = new Airtable({apiKey: 'keysVKJT0WBapnQ7a'}).base('applbqSXlfIiMjO7A')

// login
app.post('/login', (req, res) => {
    console.log("got hit")
    console.log()
    let reqEmail = req.body.email
    let reqPassword = req.body.password
    console.log(reqEmail,reqPassword)
    base('user').select({
        filterByFormula: `{email} = "${reqEmail}"`
    }).firstPage(function (err, records) {
        console.log(records.length)
        if (err) {
            let obj = {
                message: "user not found"
            }
            res.status(404)
            res.send(obj)
            console.error(err)
            return
        }
        if (records.length > 0) {
            let email = records[0].get('email')
            let password = records[0].get('password')
            if (email === reqEmail && password === reqPassword) {
                let obj = {
                    token: records[0].get('user_id'),
                    isloggedin: true
                }
                res.status(200)
                res.send(obj)
            }else{
                let obj = {
                    token: 'wrong password',
                    isloggedin: false
                }
                res.status(404)
                res.send(obj)
            }
        }else{
            let obj = {
                token: 'No user found',
                isloggedin: false
            }
            res.status(404)
            res.send(obj)
        }
    });
})

// signup
app.post('/signup', (req, res) => {
    let reqName = req.body.name
    let reqGender = req.body.gender
    let reqPhone = req.body.phone
    let reqEmail = req.body.email
    let reqPassword = req.body.password
    let reqAddresses = req.body.addresses
    
    base('user').create([
        {
          "fields": {
            "name": `${reqName}`,
            "gender": `${reqGender}`,
            "phone": `${reqPhone}`,
            "email": `${reqEmail}`,
            "password": `${reqPassword}`,
            "addresses": `${reqAddresses}`
          }
        }
      ], function(err, records) {
        if (err) {
          res.status(500)
          res.send('error')  
          console.error(err);
          return;
        }else{
            let obj = {
                user: true,
                msg: "user successfully created"
            }
            res.status(200)
            res.send(obj)
        }
      });

})

// List all products
app.get('/home', (req,res) => {
    base('product').select({
        view: 'Grid view'
    }).firstPage(function(err, records) {
        if (err) { console.error(err); return; }
        let data = []
        records.forEach(function(record) {
            console.log('Retrieved', record.get('name'));
            data.push(record.fields)
        });
        res.status(200).send(data)
    });
})

// show detail product
app.get('/product', (req,res) => {
    base('product').select({
        filterByFormula: `id = "${req.query.id}"`
    }).firstPage(function(err, records) {
        if (err) {
            res.status(404).send('product not found')
            console.error(err)
            return 
        }
        let obj = records[0].fields
        res.status(200).send(obj)
    });
})

// Search all products
app.get('/search', (req, res) => {
    base('product').select({
        view: 'Grid view'
    }).firstPage(function(err, records) {
        if (err) { 
            console.error(err)
            return 
        }
        let data = []
        let searchKey = req.query.search.toLowerCase()
        records.forEach(function(record) {
            data.push(record.fields)    
        })
        const foundData = data.filter((e) => {
            return(e.name.toLowerCase().includes(searchKey))
        })
        
        res.status(200).send(foundData)
        
    });
})

// filter products by category brand color and price
app.get('/filter', (req, res) => {
    base('product').select({
        view: 'Grid view'
    }).firstPage(function(err, records) {
        if (err) { 
            console.error(err)
            return 
        }
        let data = []
        let searchKey = req.query.search.toLowerCase()
        records.forEach(function(record) {
            data.push(record.fields)    
        })
        const foundData = data.filter((e) => {
            return(e.name.toLowerCase().includes(searchKey))
        })
        
        res.status(200).send(foundData)
        
    });
})

// sort by price
app.get('/sort', (req, res) => {
    base('product').select({
        sort: [{field: "price", direction: `${req.query.direction}`}]
    }).firstPage(function(err, records) {
        if (err) { console.error(err); return; }
        records.forEach(function(record) {
            console.log('Retrieved', record.fields);
        });
    });
})

// ADD to cart
app.post('/addToCart', (req, res) => {
    base('user').find(`${req.body.user_id}`, function (err, record) {
        const reqId = req.body.id
        if (err) { 
            res.status(404)
            res.send('user not found')
            console.error(err)
            return
        }
        if (!record.get('cart')) {
            let obj = [{id: reqId}]
            let id = JSON.stringify(obj)
            console.log(id)
            base('user').update([
                {
                    "id": `${req.body.user_id}`,
                    "fields": {
                        "cart": `${id}`
                    }
                }
            ], function (err, records) {
                if (err) {
                    console.error(err);
                    return;
                }else{
                    res.send('Added to cart')
                }

            });
        } else {
            let id = JSON.parse(record.get('cart'))
            let checkDuplicate = id.find(rec => rec.id === `${reqId}`) 
            if(checkDuplicate){
                let obj = {
                    msg: 'product already in cart'
                }
                res.send(obj)
                return
            }
            id.splice(0, 0, {id:reqId})
            id = JSON.stringify(id)
            console.log(id)
            base('user').update([
                {
                    "id": `${req.body.user_id}`,
                    "fields": {
                        "cart": `${id}`
                    }
                }
            ], function (err, records) {
                if (err) {
                    console.error(err);
                    return;
                }else{
                    res.send(records[0].fields.cart)
                }
            });
        }
    });

})

// delete item from cart
app.post('/deleteCart', (req, res) => {
    base('user').find(`${req.body.user_id}`, function (err, record) {
        const reqId = req.body.id
        if (err) {
            res.status(404)
            res.send('user not found')
            console.error(err)
            return
        }
        let id = JSON.parse(record.get('cart'))
        const filteredId = id.filter((item) => item.id !== reqId)
        console.log(filteredId)
        id = JSON.stringify(filteredId)
        console.log(id)
        base('user').update([
            {
              "id": `${req.body.user_id}`,
              "fields": {
                "cart": `${id}`
              }
            }
          ], function(err, records) {
            if (err) {
              console.error(err);
              return;
            }
            records.forEach(function(record) {
              res.send(`Item Removed: ${reqId}`)
            });
          });
    })
})

// get cart items
app.get('/cart', (req, res) => {
    try {
        let data = []
        base('user').select({
            filterByFormula: `user_id = "${req.query.user}"`
        }).firstPage(function (err, records) {
            if (err) {
                console.error(err);
                return;
            }
            let id = JSON.parse(records[0].fields.cart)
            // console.log(id)
            id.forEach(function (record,idx) {
                base('product').select({
                    filterByFormula: `id = "${record.id}"`
                }).firstPage(function (err, records) {
                    if (err) {
                        console.error(err);
                        return;
                    }
                    data.push(records[0].fields)
                    if(idx === id.length-1){
                        res.send(data)
                    }
                })
             })

        });
    } catch (err) {
        console.error(err)
    }
})

// Add to wishlist
app.post('/addToWishlist', (req, res) => {
    base('user').find(`${req.body.user_id}`, function (err, record) {
        const reqId = req.body.id
        if (err) { 
            res.status(404)
            res.send('user not found')
            console.error(err)
            return
        }
        if (!record.get('wishlist')) {
            let obj = [{id: reqId}]
            let id = JSON.stringify(obj)
            console.log(id)
            base('user').update([
                {
                    "id": `${req.body.user_id}`,
                    "fields": {
                        "wishlist": `${id}`
                    }
                }
            ], function (err, records) {
                if (err) {
                    console.error(err);
                    return;
                }else{
                    res.send('Added to wishlist')
                }

            });
        } else {
            let id = JSON.parse(record.get('wishlist'))
            let checkDuplicate = id.find(o => o.id === `${reqId}`) 
            if(checkDuplicate){
                res.send('Already Added to Wishlist')
                return
            }
            id.splice(0, 0, {id:reqId})
            id = JSON.stringify(id)
            console.log(id)
            base('user').update([
                {
                    "id": `${req.body.user_id}`,
                    "fields": {
                        "wishlist": `${id}`
                    }
                }
            ], function (err, records) {
                if (err) {
                    console.error(err);
                    return;
                }else{
                    res.send(records[0].fields.wishlist)
                }
            });
        }
    });

})

// delete item from wishlist
app.post('/deleteWishlist', (req, res) => {
    base('user').find(`${req.body.user_id}`, function (err, record) {
        const reqId = req.body.id
        if (err) {
            res.status(404)
            res.send('user not found')
            console.error(err)
            return
        }
        let id = JSON.parse(record.get('wishlist'))
        const filteredId = id.filter((item) => item.id !== reqId)
        console.log(filteredId)
        id = JSON.stringify(filteredId)
        console.log(id)
        base('user').update([
            {
              "id": `${req.body.user_id}`,
              "fields": {
                "wishlist": `${id}`
              }
            }
          ], function(err, records) {
            if (err) {
              console.error(err);
              return;
            }
            records.forEach(function(record) {
              res.send(`Item Removed: ${reqId}`)
            });
          });
    })
})

app.listen(port, () => {
    console.log(`App listening on port ${port}`)
})