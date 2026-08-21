const jwt = require('jsonwebtoken');
const UserModel = require('../Model/Usermodel');

const adminAuth = async(req,res,next) => {
    try{
        const authHeader = req.header("Authorization");
        if(!authHeader){
            return res.status(400).json({
                status:"failure",
                message:"Token not found"
            })
        }
        const token = authHeader.split(" ")[1];

        if(!token){
            return res.status(400).json({
                status:"failure",
                message:"Token not found"
            })
        }

        const decoded = jwt.verify(token,"secret_key");
        const user = await UserModel.findById(decoded.id);
        if (!user || user.role !== "admin") {
            return res.status(403).json({
                status:"failure",
                message:"Access denied. Admin only."
            })
        }
        req.user = user;
        next();
    }catch(err){
        res.status(400).json({
            status:"failure",
            message:"Token is invalid"
        })
    }
}

module.exports = adminAuth;