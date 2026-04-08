const express = require('express');
const fs = require('fs');
const bcrypt = require('bcrypt');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// JSON-файлы
const productsFile = 'products.json';
const usersFile = 'users.json';
const ordersFile = 'orders.json';

const readJSON = (file) => JSON.parse(fs.readFileSync(file, 'utf-8'));
const writeJSON = (file, data) => fs.writeFileSync(file, JSON.stringify(data, null, 2));

// ------------------- AUTH -------------------
app.post('/api/register', async (req,res)=>{
    const {username,password} = req.body;
    const users = readJSON(usersFile);
    if(users.find(u=>u.username===username)) return res.status(400).json({error:"Пользователь существует"});
    const hash = await bcrypt.hash(password,10);
    users.push({username,password:hash,isAdmin:false});
    writeJSON(usersFile,users);
    res.json({message:"Регистрация успешна"});
});

app.post('/api/login', async (req,res)=>{
    const {username,password} = req.body;
    const user = readJSON(usersFile).find(u=>u.username===username);
    if(!user) return res.status(400).json({error:"Неверный логин"});
    const valid = await bcrypt.compare(password,user.password);
    if(!valid) return res.status(400).json({error:"Неверный пароль"});
    res.json({username:user.username,isAdmin:user.isAdmin});
});

// ------------------- PRODUCTS -------------------
app.get('/api/products',(req,res)=>{
    const search = req.query.search?.toLowerCase();
    let list = readJSON(productsFile);
    if(search) list = list.filter(p=>p.name.toLowerCase().includes(search));
    res.json(list);
});

app.post('/api/products',(req,res)=>{
    const {product, admin} = req.body;
    if(!admin) return res.status(403).json({error:"Только для админа"});
    const list = readJSON(productsFile);
    product.id = list.length ? list[list.length-1].id+1 : 1;
    list.push(product);
    writeJSON(productsFile,list);
    res.json({message:"Товар добавлен"});
});

// ------------------- ORDERS -------------------
app.post('/api/order',(req,res)=>{
    const {username,cart} = req.body;
    const orders = fs.existsSync(ordersFile) ? readJSON(ordersFile) : [];
    orders.push({username,cart,date:new Date().toISOString()});
    writeJSON(ordersFile,orders);
    res.json({message:"Заказ оформлен"});
});

app.get('/api/orders',(req,res)=>{
    const {username,admin} = req.query;
    const orders = fs.existsSync(ordersFile) ? readJSON(ordersFile) : [];
    if(admin) return res.json(orders);
    res.json(orders.filter(o=>o.username===username));
});

// ------------------- SERVER -------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT,()=>console.log(`Server running on http://localhost:${PORT}`));