import {v2 as cloudinary} from 'cloudinary';
import Post from "../models/post-model.js";
import User from "../models/user-model.js";
import Notification from  "../models/notification-model.js";


// Controller to create a post
export const createPost = async (req, res) => {
    try{
        // Extract text and image from the request body
        const {text, img} = req.body;
        const userId = req.user._id.toString(); // Get the ID of the logged-in user

        // Check if the user exists
        const user = await User.findById(userId);
        if(!user){
            return res.status(404).json({error: "User not found"});
        }

        // Ensure that at least text or image is provided
        if(!text && !img){
            return res.status(404).json({error: "Post must have text or image"});
        }

        // If an image is provided, upload it to Cloudinary
        if(img){
            const uploadedResponse = await cloudinary.uploader.upload(img);
            img = uploadedResponse.secure_url;
        }

        // Create a new post instance
        const newPost = new Post({
            user: userId,
            text,
            img,
        })

        // Save the new post to the database
        await newPost.save();

        // Respond with a success message and the newly created post
        return res.status(201).json({
            message: "Post created successfully",
            newPost,
        });
    }
    catch(error){
        console.log(error.message);
        return res.status(500).json({ 
            error: "An error occurred while creating the post"
        });
    }
}


// Controller to delete a post
export const deletePost = async (req, res) => {
    try {
        // Find the post by ID
        const post = await Post.findById(req.params.id);
        if(!post){
            return res.status(404).json({error: "Post not found"});
        }

        // Check if the user is authorized to delete the post
        if(post.user.toString() !== req.user._id.toString()){
            return res.status(403).json({error: "You are not authorized to delete this post"});
        }

         // If the post has an image, delete it from Cloudinary
        if(post.img){
            const imgId = post.img.split("/").pop().split(".")[0];
            await cloudinary.uploader.destroy(imgId);
        }

        // Delete the post from the database
        await Post.findByIdAndDelete(req.params.id);

        return res.status(200).json({
            message: "Post deleted successfully"
        });
        
    } 
    catch (error) {
        console.log("Error in deletePost controller : ",error.message);
        res.status(500).json({
            error: "An error occurred while deleting the post"
        });
    }
}


// Controller to comment on a post
export const commentOnPost = async (req, res) => {
    try {
        const {text} = req.body;
        const postId = req.params.id;
        const userId = req.user._id;

        // Validate the comment text
        if (!text || text.trim().length === 0) {
            return res.status(400).json({
                error: "Text field is required and cannot be empty"
            });
        }

        // Find the post by ID
        const post = await Post.findById(postId);

        if(!post){
            return res.status(404).json({
                error: "Post not found"
            });
        }

        // Create a comment object
        const comment = {user: userId, text};

        // Push the comment into the post's comments array
        post.comments.push(comment);
        await post.save();

        return res.status(200).json({
            message: "Comment added successfully",
            post
        });
    } 
    catch (error) {
        console.log("Erron in commentOnPost controller :- ", error);
        return res.status(500).json({
            error: "An error occurred while adding the comment"
        });
    }
}


// Controller to like or unlike a post
export const likeUnlikePost = async (req, res) => {
    try {
        const userId =  req.user._id;
        const {id: postId} = req.params;

        const post = await Post.findById(postId);

        if(!post){
            return res.status(404).json({
                error: "Post not found"
            });
        }

        // Check if the user has already liked the post
        const userLikedPost = post.likes.includes(userId);

        if(userLikedPost){
            // If user liked the post, unlike it
            await Post.updateOne({_id: postId}, {$pull:  {likes: userId}});
            await User.updateOne({_id: userId}, {$pull: {likedPosts: postId}});
            return res.status(200).json({
                message: "Post unliked successfully"
            });

        }
        else{
            // If user hasn't liked the post, like it
            post.likes.push(userId);            
            await User.updateOne({_id: userId}, {$push: {likedPosts: postId}});

            await post.save();
            
            // Create a notification for the post owner
            const notification = new Notification({
                from: userId,
                to: post.user,
                type: "like"
            });
            await notification.save();

            return res.status(200).json({
                message: "Post liked successfully"
            });
        }
    } 
    catch (error) {
        console.log("Error in likeUnlikePost controller: ", error);
        return res.status(500).json({
            error: "An error occurred while liking/unliking the post"
        });
    }
}


// Controller to get all posts
export const getAllPosts = async (req, res) => {
    try {
        // Find all posts, sort them by creation date, and populate the user and comments details
        const posts = await Post.find().sort({createdAt: -1}).populate({
            path: "user",
            select: "-password"
        })
        .populate({
            path: "comments.user",
            select: "-password"
        });

        if(posts.length == 0){
            return res.status(200).json([]); // Return empty array if no posts found
        }

        return res.status(200).json({
            message: "Posts retrieved successfully",
            posts
        });
    } 
    catch (error) {
        console.log("Error in getAllPosts controller:- ", error);
        return res.status(500).json({
            error: "An error occurred while retrieving posts"
        });
    }
}


// Controller to get all liked posts of a user
export const getLikedPosts = async (req, res) => {
    const userId = req.params.id;

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        
        // Find all posts that the user has liked
        const likedPosts = await Post.find({_id: {$in: {$in: user.likedPosts}}})
        .populate({
            path: "user",
            select: "-password"
        }).populate({
            path: "comments.user",
            select: "-password"
        })

        return res.status(200).json({
            message: "Liked posts retrieved successfully",
            likedPosts
        });
    } 
    catch (error) {
        console.log("Error in getLikedPosts controller: ",error);
        return res.status(500).json({
            error: "An error occurred while retrieving liked posts"
        });
    }
}


// Controller to get posts of users that the logged-in user is following
export const getFollowingPosts = async (req, res) => {
    try{
        const userId = req.user._id;
        const user = await User.findById(userId);
        if(!user){
            return res.status(404).json({
                error: "User not found"
            });
        }

        const following = user.following;

        const feedPosts = await Post.find({user: {$in: following}})
        .sort({createdAt: -1})
        .populate({
            path: "user",
            select: "-password",
        })
        .populate({
            path: "comments.user",
            select: "-password",
        });

        return res.status(200).json({
            message: `Posts from followed users retrieved successfully`,
            feedPosts
        });
    }
    catch(error){
        console.log("Error in getFollwingPosts Controller :- ",error);
        return res.status(500).json({
            error: "An error occurred while retrieving posts from followed users"
        });
    }
}


// Controller to get posts of a specific user by username
export const getUserPosts = async (req, res) => {
    try {
        const {username} = req.params;
        const user = await User.findOne({username});
        if(!user){
            return res.status(404).json({
                error: "User not found"
            });
        }

        // Fetch posts created by the specific user
        const posts = await Post.find({ user:  user._id })
        .sort({createdAt: -1})
        .populate({
            path: "user",
            select: "-password",
        })
        .populate({
            path: "comments.user",
            select: "-password",
        });
        
        return res.status(200).json({
            message: "Posts retrieved successfully for user",
            posts
        });

    } 
    catch (error) {
        console.log("Error in getUserPosts controller:- ",error);
        return res.status(500).json({
            error: "An error occurred while retrieving posts for the user"
        });
    }
}