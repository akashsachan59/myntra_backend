const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
 
const app = express()
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(cors())

const port = 3000

const Airtable = require('airtable');
const base = new Airtable({apiKey: 'keysVKJT0WBapnQ7a'}).base('applbqSXlfIiMjO7A')

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
app.post('/buy', (req, res) => {
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
            let checkDuplicate = id.find(o => o.id === `${reqId}`) 
            if(checkDuplicate){
                res.send('Already Added to Cart')
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
app.post('/delete_cart', (req, res) => {
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

// Add to wishlist
app.post('/wishlist', (req, res) => {
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
app.post('/delete_wishlist', (req, res) => {
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