const sdk = require("microsoft-cognitiveservices-speech-sdk");
const fs = require("fs");
require('dotenv').config() //for secret key

const apiKey = process.env.API_KEY;


const subscriptionKey = apiKey;
const serviceRegion = "eastus";
const audioFile = "shelly.wav";
const referenceText = "shelly sell seashell";


const speechConfig = sdk.SpeechConfig.fromSubscription(subscriptionKey, serviceRegion);
const audioConfig = sdk.AudioConfig.fromWavFileInput(fs.readFileSync(audioFile));


// speechConfig.speechRecognitionLanguage = "en-IN";

// PronunciationAssessmentConfig object
const pronunciationConfig = new sdk.PronunciationAssessmentConfig(
    referenceText,
    sdk.PronunciationAssessmentGradingSystem.HundredMark,
    sdk.PronunciationAssessmentGranularity.Phoneme,
    true
);

// speech is recognized
const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);
// (Optional) get the session ID
recognizer.sessionStarted = (s, e) => {
    console.log(`SESSION ID: ${e.sessionId}`);
};
pronunciationConfig.applyTo(recognizer);

let mis_phonemeData = []



function getPhonemeData(callback) {

    recognizer.recognizeOnceAsync(result => {
        //    The pronunciation assessment result as a Speech SDK object
        const pronunciationResult = sdk.PronunciationAssessmentResult.fromResult(result);
    
        console.log(`Accuracy Score: ${pronunciationResult.accuracyScore}`);
    
            // The pronunciation assessment result as a JSON string
        // console.log(`Pronunciation Result JSON: ${result.properties.getProperty(sdk.PropertyId.SpeechServiceResponse_JsonResult)}`);
        let data = result.properties.getProperty(sdk.PropertyId.SpeechServiceResponse_JsonResult);
        // console.log(`Pronunciation Result JSON: ${data}`);
    
        try {
            let jsonData = JSON.parse(data);
            

            // Accessing "All" phonemes (inside `Words` array under `NBest`)
            jsonData.NBest[0].Words.forEach(word => {
                
                word.Phonemes.forEach(phoneme => {
                    
                    console.log("Phoneme:", phoneme.Phoneme, "Accuracy:", phoneme.PronunciationAssessment.AccuracyScore);
                    // phonemeData.push({phoneme: phoneme.Phoneme, accuracy: phoneme.PronunciationAssessment.AccuracyScore})
                });
            });

            let threshold= 30;//difficulty ke hisab se set krdenge
            let mispronunced_phoneme=[];

            //accessing mispron.... 
            jsonData.NBest[0].Words.forEach(word => {
                
                word.Phonemes.forEach(phoneme => {
                    let accur= phoneme.PronunciationAssessment.AccuracyScore;
                    if(accur<threshold){
                        // console.log("Phoneme:", phoneme.Phoneme, "Accuracy:", phoneme.PronunciationAssessment.AccuracyScore);
                        mis_phonemeData.push({phoneme: phoneme.Phoneme, accuracy: phoneme.PronunciationAssessment.AccuracyScore})
                    }
                });
            });
    
        } catch (error) {
            console.error("Error parsing JSON:", error);
        }
        callback(mis_phonemeData)
        recognizer.close();
    });
}


getPhonemeData(compareP);
function compareP(Pdata){
    console.log("mis_Phoneme Data is:", Pdata);
    
    // Pdata.forEach(obj=>{
    //     obj.phoneme
    // })
}
