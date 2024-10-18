import User from "../models/user-model.js";
import jwt from "jsonwebtoken";

// Middleware function to protect routes by verifying user authentication
export const protectRoute = async (req, res, next) => {
    try{
        // Attempt to retrieve the JWT token from the cookies
        const token = req.cookies.jwt;

        // If no token is found, return an unauthorized response
        if(!token){
            return res.status(401).json({error: "Unauthorized: No Token Provided"});
        }

        // Verify the token using the secret key
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // If the token is invalid or cannot be decoded, return an unauthorized response
        if(!decoded){
            return res.status(401).json({error: "Unauthorized: Invalid Token"});
        }

        // Find the user associated with the decoded token
        const user = await User.findById(decoded.userId).select("-password");

        // If the user is not found, return a not found response
        if(!user){
            return res.status(404).json({error: "User not found"});
        }
        
        // Attach the user object to the request for further use in the route
        req.user = user;
        
        // Call the next middleware or route handler
        next();
    }
    catch(error){
        console.log("Error in Protect Route Middleware ", error.message);
        return res.status(500).json({error: "Internal Server Error"});
    }
};