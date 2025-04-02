const mongoose = require('mongoose');
const express = require('express');
const morgan = require('morgan');
require('dotenv').config();

const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcryptjs");
const path = require('path');
const engine = require('ejs-mate');
const MongoStore = require("connect-mongo");

const app = express();
const port = 5500;

const User = require('./models/users.js');
const Chapter = require('./models/chapters.js');
const Level = require('./models/levels.js');
const fetchData = require('./extract.js'); // function for assessment of json data

async function main() {
  await mongoose.connect('mongodb+srv://aggarwaltisha05:BPKZJJE5w1UbflBf@echospell.rgovwms.mongodb.net/EchoSpell');
}
main().catch(err => console.log(err));

// Session Middleware (must come before flash)
app.use(session({
    secret: process.env.SESSION_SECRET, // Change this to a strong secret
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: 'mongodb+srv://aggarwaltisha05:BPKZJJE5w1UbflBf@echospell.rgovwms.mongodb.net/EchoSpell',
        collectionName: 'sessions'
    }),
    cookie: { maxAge: 1000 * 60 * 60 * 24 } // 1-day session persistence
}));

// Flash middleware
const flash = require("connect-flash");
app.use(flash());

// Make flash messages available in all views using res.locals
app.use((req, res, next) => {
    res.locals.success_msg = req.flash("success");
    res.locals.error_msg = req.flash("error");
    next();
});

app.use(passport.initialize());
app.use(passport.session());

// Passport Local Strategy for Authentication
passport.use(new LocalStrategy(async (username, password, done) => {
    const user = await User.findOne({ username });
    if (!user) return done(null, false, { message: "User not found" });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return done(null, false, { message: "Incorrect password" });
    return done(null, user);
}));

// Serialize and Deserialize User
passport.serializeUser((user, done) => {
    done(null, user.id);
});
passport.deserializeUser(async (id, done) => {
    const user = await User.findById(id);
    done(null, user);
});

// Middleware to Check if User is Logged In
function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) return next();
    res.redirect("/login");
}

// (Existing /users route left intact if needed)
app.post('/users', async (req, res) => {
    const { username, parent, email, password } = req.body;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const user = new User({ username, parent, email, password: hashedPassword });
    await user.save();
    req.login(user, (err) => {
        if (err) return res.status(500).send("Error logging in after signup.");
        return res.redirect("/dashboard");
    });
});

// Login Route
app.post('/login', passport.authenticate("local", {
    successRedirect: "/dashboard",
    failureRedirect: "/login",
    failureFlash: true // Enables flash messages for authentication failures
}));

// Protected Route Example
app.get('/dashboard', isAuthenticated, (req, res) => {
    res.render('dashboard', { user: req.user });
});

// Logout Route
app.get('/logout', (req, res) => {
    req.logout((err) => {
        if (err) console.error(err);
        res.redirect("/");
    });
});

// Set up EJS with ejs-mate
app.engine('ejs', engine);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(morgan('tiny'));

app.get('/', (req, res) => {
  res.render('landing');
});

app.get('/login', (req, res) => {
  res.render('login.ejs');
});

// USER ROUTES

app.get('/user/new', (req, res) => {
  res.render("signup");
});

app.post('/user/new', async (req, res) => {
    const { username, parent, email, password } = req.body;
    try {
        let user = await User.findOne({ username });
        if (user) {
            // User exists: attempt login
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                req.flash("error", "Incorrect password");
                return res.render("signup");
            }
            req.flash("success", "Login successful!");
            return res.render("signup");
        } else {
            // New user: register them
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            user = new User({ username, parent, email, password: hashedPassword });
            await user.save();
            req.flash("success", "User registered successfully!");
            return res.render("signup");
        }
    } catch (err) {
        console.error(err);
        req.flash("error", "Server error occurred.");
        return res.render("signup");
    }
});

app.post('/users', async (req, res) => {
    console.log(req.body);
    const { username, parent, email } = req.body;
    const user = new User(req.body);
    await user.save();
    const finduser = await User.findOne({ username: username });
    console.log(finduser);
    const id = finduser._id;
    console.log(id);
    res.redirect(`/realtime/${id}`);
});

app.get('/user/profile/:id', async (req, res) => {
    const { id } = req.params;
    console.log("Fetching profile for user id:", id);
    const { lowAccur, avgPhonemeAccuracy } = await fetchData(id);
    const user = await User.findOne({ _id: id }).populate('chapters');
    console.log(user);
    res.render('profile', { user, avgPhonemeAccuracy });
});

// CHAPTERS ROUTES, LEVELS ROUTES, etc.
app.get('/realtime/:id', (req, res) => {
    const { id } = req.params;
    res.render('realtime', { id }); // initial assessment
});

app.post('/initassessment/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { totalN_best } = req.body;
        console.log("total Nbest", totalN_best);
        const dataEntry = await User.findByIdAndUpdate(id, { 
            "initialAssessment.date": new Date(), 
            "initialAssessment.data": totalN_best 
        }, { new: true });
        res.json({ message: "Data saved successfully!", redirect: `/results/${id}` });
    } catch (error) {
        res.status(500).json({ error: "Failed to save data", details: error });
    }
});

app.get("/results/:id", async (req, res) => {
    const { id } = req.params;
    console.log("ID in index:", id);
    console.log("Type of ID:", typeof id);
    const { lowAccur, avgPhonemeAccuracy } = await fetchData(id);
    console.log("Low Accuracy Data:", lowAccur);
    const userId = new mongoose.Types.ObjectId(id);
    for (const arr of lowAccur) {
        const phoneme = arr[0];
        const newCh = new Chapter({ user_id: userId, phoneme: phoneme });
        await newCh.save();
        console.log(`New Chapter Created:`, newCh);
        await User.findByIdAndUpdate(userId, { $push: { chapters: newCh._id } }, { new: true });
    }
    res.render('confirmation', { id });
});

app.delete("/User/:id", async (req, res) => {
    const { id } = req.params;
    try {
        await Chapter.deleteMany({ user_id: id });
        console.log(`Deleted all chapters for user ${id}`);
        await Level.deleteMany({ user_id: id });
        console.log(`Deleted all levels for user ${id}`);
        const deletedUser = await User.findByIdAndDelete(id);
        console.log("Deleted User:", deletedUser);
        res.status(200).send("User and associated data deleted successfully");
    } catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).send("Error deleting user");
    }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
