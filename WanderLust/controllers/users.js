const User = require('../models/user.js');

// Signup handler
module.exports.signup = async (req, res, next) => {
    try {
        const { username, email, password } = req.body;
        const newUser = new User({ email, username });
        const registerUser = await User.register(newUser, password);
        
        req.login(registerUser, (err) => {
            if (err) {
                return next(err); // Pass the error to the next middleware
            }
            req.flash("success", "Welcome to WanderLust");
            res.redirect("/listings");
        });
    } catch (e) {
        req.flash("error", e.message); // Flash error message
        res.redirect('/signup');
    }
}

// Login handler
module.exports.login = async (req, res) => {
    req.flash("success", "Welcome back to WanderLust");
    
    // Use a safe fallback for redirectUrl in case it's not set
    let redirectUrl = req.session.redirectUrl || "/listings";
    
    // Avoid redirecting to a DELETE action or invalid path
    if (redirectUrl.includes("DELETE")) {
        redirectUrl = "/listings";
    }

    res.redirect(redirectUrl);
}

// Logout handler
module.exports.logout = (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err); // Pass the error to the next middleware
        }
        req.flash("success", "You are logged out now");
        res.redirect("/listings");
    });
}
