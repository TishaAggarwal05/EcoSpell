const mongoose = require('mongoose');
const express = require('express');
const morgan=require('morgan')
const app = express()
const port = 5500


const User = require('./models/users.js');
const Chapter = require('./models/chapters.js');
const Level = require('./models/levels.js');
const fetchData= require('./extract.js')//function for assessment of json data 


async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
}
main().catch(err => console.log(err));


const path = require('path');
const engine= require('ejs-mate');
const { findByIdAndUpdate } = require('./models/pdetect.js');
app.engine('ejs',engine);
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));

app.use(morgan('tiny'));

app.get('/',(req,res)=>{
  res.render('landing')
})

app.get('/login',(req,res)=>{
  res.render('login.ejs')
})

//USER ROUTES

app.get('/user/new',(req,res)=>{
  res.render("signup")
})
app.post('/users',async(req,res)=>{
   
    console.log(req.body)
    const {username, parent, email}= req.body;
    const user= new User(req.body);
    await user.save()
    const finduser= await User.findOne({username:username});
    console.log(finduser)
    const id=finduser._id
    console.log(id);
    res.redirect(`/realtime/${id}`)

    
  

})

app.get('/user/profile/:id',async(req,res)=>{
    const {id}= req.params;
    console.log("fffffffffffffffffffffffffffffffffffffffffffffffffffff")
    const {lowAccur, avgPhonemeAccuracy} = await fetchData(id);
    const user= await User.findOne({_id:id}).populate('chapters');
    console.log(user)
    // res.send("yoooo")
    res.render('profile',{user,avgPhonemeAccuracy});

    

})


//CHAPTERS ROUTES


//LEVELS ROUTES






app.get('/realtime/:id', (req, res) => {
    const {id}= req.params;
    res.render('realtime',{id});//initial assessment
})

app.post('/initassessment/:id',async(req, res) => {//store the result of assessment(initial)
    try{
        const {id}=req.params;
        
        const {totalN_best}= req.body;
        console.log("total Nbest",totalN_best);
        const dataEntry = await User.findByIdAndUpdate(id, { 
            "initialAssessment.date": new Date(), 
            "initialAssessment.data": totalN_best 
        },
        { new: true });
        // const newEntry = new User.initialAssessment({ data: totalN_best });
        // await newEntry.save();
        // let Data=await Phoneme.findOne({data:totalN_best});
        
        res.json({ message: "Data saved successfully!",redirect: `/results/${id}`});
        
    } catch (error) {
        res.status(500).json({ error: "Failed to save data", details: error });
    }


})

app.get("/results/:id", async (req, res) => {
    const { id } = req.params;
    console.log("ID in index:", id);
    console.log("Type of ID:", typeof id);

    const {lowAccur, avgPhonemeAccuracy} = await fetchData(id); // Fetch phonemes & accuracy
    console.log("Low Accuracy Data:", lowAccur);

    const userId = new mongoose.Types.ObjectId(id); // Convert string ID to ObjectId

    for (const arr of lowAccur) {
        const phoneme = arr[0]; // Phoneme (e.g., "p")
        

        //  Create and save a new Chapter
        const newCh = new Chapter({
            user_id: userId,
            phoneme: phoneme,
              // Store accuracy if needed
        });
        await newCh.save();
        console.log(`New Chapter Created:`, newCh);

        //  Push the chapter ID into the User's `chapters` array
        await User.findByIdAndUpdate(
            userId,
            { $push: { chapters: newCh._id } }, // Push Chapter ID
            { new: true }
        );
    }
    res.render('confirmation',{id});
    

    // res.render('profile', { id, lowAccur});
});


app.delete("/User/:id", async (req, res) => {
    const { id } = req.params;

    try {
        // 1. Delete chapters associated with the user
        await Chapter.deleteMany({ user_id: id });
        console.log(`Deleted all chapters for user ${id}`);

        // 2. Delete levels associated with the user (if you have a levels collection)
        await Level.deleteMany({ user_id: id });
        console.log(`Deleted all levels for user ${id}`);

        // 3. Finally, delete the user
        const deletedUser = await User.findByIdAndDelete(id);
        console.log("Deleted User:", deletedUser);

        res.status(200).send("User and associated data deleted successfully");
    } catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).send("Error deleting user");
    }
});




app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})