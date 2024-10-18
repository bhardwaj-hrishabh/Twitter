import bcrypt from 'bcryptjs';
import User from "../models/user-model.js";
import { generateTokenAndSetCookie } from "../lib/utils/generateToken.js";


// Signup function to handle user registration
export const signup = async (req,res) => {
    try {
        // Destructuring user data from the request body
        const {fullName, username, email, password} = req.body;

        // Email format validation using regex
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if(!emailRegex.test(email)){
            return res.status(400).json({error: "Invalid email format"});
        }

        // Check if the username already exists in the database
        const existingUser = await User.findOne({username});
        if(existingUser){
            return res.status(400).json({error: "Username is already taken"});
        }

        // Check if the email is already in use
        const existingEmail = await User.findOne({email});
        if(existingEmail){
            return res.status(400).json({error: "Email is already in use"});
        }

        if(password.length < 6){
            return res.status(400).json({error: "Password must be at least 6 characters long"});
        }
        // Hash the password for security
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            fullName,
            username,
            email,
            password: hashedPassword
        })
        
        // Check if the new user instance was created successfully
        if(newUser){
            generateTokenAndSetCookie(newUser._id, res)
            await newUser.save();

            return res.status(201).json({
                message: "User Created Successfully",
                _id: newUser._id,
                fullName: newUser.fullName,
                username: newUser.username,
                email: newUser.email,
                followers: newUser.followers,
                following: newUser.following,
                profileImg: newUser.profileImg,
                coverImg: newUser.coverImg,
            })
        }
        else{
            console.log("Error in Signup Controller");
            return res.status(400).json({error:"Invalid user data"})
        }


    } 
    catch (error) {
        console.log("Eroor :- ", error);
        return res.status(500).json({error: "Internal Server Error"})
    }
}


// Login function to handle user authentication
export const login = async (req,res) => {
    try {
        const {username, password} = req.body;

        // Find user by username
        const user = await User.findOne({username});
        
        // compare password(if user exists)
        const isPasswordCorrect = await bcrypt.compare(password, user?.password || "");

        // If user not found or password is incorrect, send 401 and return to stop further execution
        if(!user || !isPasswordCorrect){
            return res.status(401).json({error: "Invalid username or password"})
        }

        // Generate token and set cookie
        generateTokenAndSetCookie(user._id, res);

        return res.status(201).json({
            message: "User Loged In Successfully",
            _id: user._id,
            fullName: user.fullName,
            username: user.username,
            email: user.email,
            followers: user.followers,
            following: user.following,
            profileImg: user.profileImg,
            coverImg: user.coverImg,
        })

    } 
    catch (error) {
        console.log("Error in login controller ",error.message);
        return res.status(500).json({error: "Internal Server Error"})

    }
}

// Logout function to handle user logout
export const logout = async (req,res) => {
    try {
        // Clear the JWT cookie by setting it to an empty string and max age to 0
        res.cookie("jwt", "",  {maxAge: 0});

        // Send a success response back to the client
        return res.status(200).json({message: "User logged out successfully"})

    } 
    catch (error) {
        console.log("Error in logout controller ",error.message);
        return res.status(500).json({error: "Internal Server Error"})
    }
}

// Function to retrieve the currently logged-in user's information
export const getMe = async (req, res) => {
    try{
        // Find the user by their ID from the request object, excluding the password field
        const user = await User.findById(req.user._id).select("-password");
        res.status(200).json(user);
    }
    catch(error){
        console.log("Error in getMe Controller ", error.message);
        res.status(500).json({error: "Internal Server Error"});
    }
}