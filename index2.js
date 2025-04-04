const mongoose = require('mongoose');
const express = require('express');
const morgan = require('morgan');
require('dotenv').config();
const cors = require("cors");

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




// Set up EJS with ejs-mate
app.engine('ejs', engine);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('tiny'));
app.use(
    cors({
        origin: "http://localhost:5173",  // ✅ Allow only your frontend
        credentials: true,  // ✅ Allow sending cookies/sessions
        methods: ["GET", "POST", "PUT", "DELETE"],  // ✅ Allowed HTTP methods
        allowedHeaders: ["Content-Type", "Authorization"],  // ✅ Allowed headers
    })
);

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
}
main().catch(err => console.log(err));

// Session Middleware (must come before flash)
app.use(session({
    secret: process.env.SESSION_SECRET, // Change this to a strong secret
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI,
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
passport.use(new LocalStrategy({ usernameField: "email" },async (email, password, done) => {
    const user = await User.findOne({ email });
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


// app.get('/login', (req, res) => {
//     res.render('login', { messages: { error: req.flash("error") || [] } });
// });

// app.post('/login', (req, res, next) => {
//     passport.authenticate("local", (err, user, info) => {
//         if (err) return next(err);
//         if (!user) {
//             req.flash("error", info.message);
//             res.render('login', { messages: { error: req.flash("error") || [] } });
//         }
        
//         req.login(user, (err) => {
//             if (err) return next(err);
//             return res.redirect(`/user/profile/${user._id}`); 
//         });
//     })(req, res, next);
// });
app.post('/login', (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
        if (err) return next(err);
        if (!user) {
            return res.status(401).json({ success: false, message: info.message || "Invalid credentials" });
        }
        
        req.login(user, (err) => {
            if (err) return next(err);
            return res.json({ success: true, userId: user._id,redirect: `/user/profile/${user._id}` }); // Send JSON response
        });
    })(req, res, next);
});





// Logout Route
app.get('/logout', (req, res) => {
    req.logout((err) => {
        if (err) console.error(err);
        res.redirect("/");
    });
});




app.get('/', (req, res) => {
  res.render('landing');
});



// USER ROUTES


app.get('/user/new', (req, res) => {
    res.render('signup', { messages: req.flash(), formData: {} });
});

//Handle POST request for user registration
// app.post('/user/new', async (req, res) => {
//     const { username, parent, email, password } = req.body;


//     try {
//         let existingUser = await User.findOne({ email });

//         if (existingUser) {
//             req.flash("error", "An account with this email already exists. Please log in.");
//             return res.render("signup", { messages: { error: req.flash("error") }, formData: req.body });
//         }

//         let existingUsername = await User.findOne({ username });
//         if (existingUsername) {
//             req.flash("error", "This username is already taken. Try a different one.");
//             return res.render("signup", { messages: { error: req.flash("error") }, formData: req.body });
//         }

//         const salt = await bcrypt.genSalt(10);
//         const hashedPassword = await bcrypt.hash(password, salt);

//         const newUser = new User({ username, parent, email, password: hashedPassword });
//         await newUser.save();

//         req.flash("success", "User registered successfully!");
//         return res.redirect(`/realtime/${newUser._id}`);

//     } catch (err) {
//         console.error("Error during signup:", err);
//         req.flash("error", "Something went wrong. Please try again.");
//         return res.render('signup', { messages: { error: req.flash("error") }, formData: req.body });
//     }
// });
app.post('/user/new', async (req, res) => {
    const { username, parent, email, password } = req.body;

    try {
        let existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, error: "An account with this email already exists. Please log in." });
        }

        let existingUsername = await User.findOne({ username });
        if (existingUsername) {
            return res.status(400).json({ success: false, error: "This username is already taken. Try a different one." });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({ username, parent, email, password: hashedPassword });
        await newUser.save();

        return res.status(201).json({ success: true, message: "User registered successfully!", userId: newUser._id,redirect: `/realtime/${newUser._id}` });

    } catch (err) {
        console.error("Error during signup:", err);
        return res.status(500).json({ success: false, error: "Something went wrong. Please try again." });
    }
});



app.get('/realtime/:id', (req, res) => {
    const { id } = req.params;
    res.render('realtime2', { id }); // initial assessment
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
        const score= arr[1];
        const newCh = new Chapter({ user_id: userId, phoneme: phoneme ,currentAccur:score});
        await newCh.save();
        console.log(`New Chapter Created:`, newCh);
        await User.findByIdAndUpdate(userId, { $push: { chapters: newCh._id } }, { new: true });
    }
    res.render('confirmation', { id });
});

app.get('/user/profile/:id', async (req, res) => {
    const { id } = req.params;
    console.log("Fetching profile for user id:", id);
    const { lowAccur, avgPhonemeAccuracy } = await fetchData(id);
    const user = await User.findOne({ _id: id }).populate('chapters');
    console.log(user);
    res.render('profile', { user, avgPhonemeAccuracy });
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

app.get('/chapter/:username',async(req,res)=>{
    const {username}= req.params;
    const user = await User.findOne({ username:username}).populate('chapters');
    console.log(user);
    res.render('MyChapter',{user})
})


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
