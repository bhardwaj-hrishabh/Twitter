import jwt from 'jsonwebtoken'; 

// Function to generate a JWT token and set it as a cookie in the response
export const generateTokenAndSetCookie = (userId, res) => {
    const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
        expiresIn: '15d' 
    });

    // Setting the token as a cookie in the response
    res.cookie("jwt", token, {
        maxAge: 15 * 24 * 60 * 60 * 1000, 
        httpOnly: true, // Prevents client-side JavaScript from accessing the cookie (mitigates XSS attacks)
        sameSite: "strict", // Restricts cookie to first-party or same-site context (mitigates CSRF attacks)
        secure: process.env.NODE_ENV !== "development", // Secure cookie flag; only send cookie over HTTPS in production
    });
};