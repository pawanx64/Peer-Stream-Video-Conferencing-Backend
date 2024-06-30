const express=require('express');
const router=express.Router();
const Auth=require('../Controller/Auth')

router.post('/login',Auth.login);
router.post('/register',Auth.register);
router.get('/user',Auth.getUser);

module.exports=router;
