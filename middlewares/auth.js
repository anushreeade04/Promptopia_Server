import jwt from 'jsonwebtoken';
import userModel from '../models/userModel.js'; // Ensure correct import

const userAuth = async (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res.status(401).json({ success: false, message: "Not authorized, Login again" });
    }

    try {
        const tokenDecode = jwt.verify(token, process.env.JWT_SECRET);

        if (tokenDecode.id) {
            req.user = { id: tokenDecode.id };  // Attach userId properly
            req.body.userId = tokenDecode.id;  // Ensure userId is in request body
            next();
        } else {
            return res.status(401).json({ success: false, message: 'Not authorized, Login again' });
        }
    } catch (error) {
        res.status(401).json({ success: false, message: error.message });
    }
};


export default userAuth;
