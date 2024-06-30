const express=require('express');
const router=express.Router();
const Auth=require('../Controller/Auth')

router.post('/register',Auth.register);
router.post('/login',Auth.login);
router.get('/user',Auth.getUser);

module.exports=router;
