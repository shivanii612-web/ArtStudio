const jwt = require('jsonwebtoken');
const UserModel = require('../Model/Usermodel');

const adminAuth = async(req,res,next) => {
    try{
        const authHeader = req.header("Authorization");
        if(!authHeader){
            return res.status(401).json({
                status:"failure",
                message:"Token not found"
            })
        }
        const parts = authHeader.split(" ");
        if (parts.length !== 2 || parts[0] !== "Bearer") {
            return res.status(401).json({
                status:"failure",
                message:"Token not found"
            })
        }
        const token = parts[1];

        if(!token){
            return res.status(401).json({
                status:"failure",
                message:"Token not found"
            })
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret_key");
        const user = await UserModel.findById(decoded.id);
        if (!user) {
            return res.status(401).json({
                status:"failure",
                message:"Token is invalid"
            })
        }
        if (user.role !== "admin") {
            return res.status(403).json({
                status:"failure",
                message:"Access denied. Admin only."
            })
        }
        req.user = user;
        next();
    }catch(err){
        res.status(401).json({
            status:"failure",
            message:"Token is invalid"
        })
    }
}

module.exports = adminAuth;