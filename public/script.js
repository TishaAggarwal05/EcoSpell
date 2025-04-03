let sdk = window.SpeechSDK;
let recognizer;
let stopRecording;
const subscriptionKeyy = "7hTJEP2PRP6GVLKdMW6G1xnZuSHvtd88ViaxUzCGDkrpO2wevV2pJQQJ99BCACYeBjFXJ3w3AAAYACOGDF8O";
const serviceRegionn = "eastus";

let referenceText = document.getElementById("referenceText").innerText;


let audioConfig = sdk.AudioConfig.fromDefaultMicrophoneInput();
let speechConfig = sdk.SpeechConfig.fromSubscription(subscriptionKeyy, serviceRegionn);

speechConfig.speechRecognitionLanguage = "en-US";
const pronunciationAssessmentConfig = new sdk.PronunciationAssessmentConfig(
    
    referenceText, // Reference text to compare against
    sdk.PronunciationAssessmentGradingSystem.HundredMark, // 100-point scale
    sdk.PronunciationAssessmentGranularity.Phoneme, // Enable phoneme-level analysis
    true // Enable fluency assessment
);

pronunciationAssessmentConfig.enableProsodyAssessment = true; // Enable prosody (intonation) assessment





function scrollText() {
    const scrollContainer = document.getElementById("scrollContainer");
    scrollContainer.scrollTop += 30; // Adjust scrolling speed
}






// let mis_phonemeData = [];
// function phoneme_get(jsonData, callbackk){
//     let threshold= 70;//difficulty ke hisab se set krdenge
        
//     jsonData.NBest[0].Words.forEach(word => {
        
//         word.Phonemes.forEach(phoneme => {
            
//             console.log("Phoneme:", phoneme.Phoneme, "Accuracy:", phoneme.PronunciationAssessment.AccuracyScore);
//             // phonemeData.push({phoneme: phoneme.Phoneme, accuracy: phoneme.PronunciationAssessment.AccuracyScore})
//             let accur= phoneme.PronunciationAssessment.AccuracyScore;
//                 if(accur<threshold){
                    
//                     // console.log("Phoneme:", phoneme.Phoneme, "Accuracy:", phoneme.PronunciationAssessment.AccuracyScore);
//                     mis_phonemeData.push({phoneme: phoneme.Phoneme, accuracy: phoneme.PronunciationAssessment.AccuracyScore})
//                 }

            
//         });
        
//     });
//     console.log("mis_PdaTA:",mis_phonemeData);
//     callbackk(mis_phonemeData);
// }

// function compareP(Pdata){
    
//     console.log("mis_Phoneme Data is:", Pdata);
//     for(let P of Pdata){
//         document.getElementById("scores").innerHTML+=`Phoneme:${P.phoneme}=> accuracy:${P.accuracy}<br>`
//     }
   
// }


function missed_check(missingWords){
    console.log(`You missed: ${missingWords.join(", ")}. Try again!`);
    document.getElementById("recognizedText").innerText = `You missed: ${missingWords.join(", ")}. Try again!`
}


let recognizedText = "";
let totalN_best=[];
async function assessing(callback1){
    return new Promise((resolve, reject) => {
    // This is an event that fires when speech is successfully recognized. It allows you to handle recognized speech data
    recognizer.recognized =async(s, e) => {
        let data = e.result.properties.getProperty(sdk.PropertyId.SpeechServiceResponse_JsonResult);
        // console.log(data);
        let jsonData = JSON.parse(data);
        if (jsonData.DisplayText) {
            recognizedText += jsonData.DisplayText.slice(0, -1) + " ";
            document.getElementById("recognizedText").innerText = recognizedText;
            scrollText();
        }

        // console.log("kkkkkkk",recognizedText)
        // console.log(jsonData);
        // const recognizedWords = recognizedText.toLowerCase().split(" "); // Extract recognized words
        // const expectedWords = referenceText.toLowerCase().split(" "); // Convert expected words to lowercase
        // console.log(recognizedWords)
        // // Find missing words
        // const missingWords = expectedWords.filter(word => !recognizedWords.includes(word));
        // console.log(missingWords)
        // if (missingWords.length > 0) {
        //     //if words missed show the missed words and dont do the assessment ask to try again
        //     callback1(missingWords)
        // } else {
        //     console.log("Great job! You said all the words correctly.");
                
            
        // }
        totalN_best.push(jsonData.NBest[0].Words);
        resolve({ recognizedText, totalN_best });
     
        
    };}

    )};
        
const unvis_id= document.getElementById('unvis-id').innerHTML;
async function sendDataToBackend(totalN_best) {
    try {
        const response = await fetch(`/initassessment/${unvis_id}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ totalN_best })
        });
        
        const result = await response.json();
        console.log("Data saved successfully:", result.message);
        window.location.href = result.redirect;
        
    } 
    catch (error) {
        console.error("Error sending data:", error);
    }
}
    









document.getElementById("startBtn").addEventListener("click", () => {
    // speech is recognized
    document.getElementById("recognizedText").innerText =""
    recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);
    
    // (Optional) get the session ID
    recognizer.sessionStarted = (s, e) => {
        console.log(`SESSION ID: ${e.sessionId}`);
    };
    pronunciationAssessmentConfig.applyTo(recognizer);

    
    
    

    recognizer.canceled = (s, e) => {
        console.log(`Error: ${e.errorDetails}`);
        recognizer.stopContinuousRecognitionAsync();
    };

    recognizer.sessionStopped = (s, e) => {
        // document.getElementById("recognizedText").innerText =""
        console.log(totalN_best)
        sendDataToBackend(totalN_best);
        recognizer.stopContinuousRecognitionAsync();
        
        // onRecognizedResult();
    };

    // Start recognition
    recognizer.startContinuousRecognitionAsync();
    assessing(missed_check);

    // Enable Stop button & disable Start button
    document.getElementById("startBtn").disabled = true;
    document.getElementById("stopBtn").disabled = false;

    stopRecording = () => {
        recognizer.stopContinuousRecognitionAsync();
        document.getElementById("startBtn").disabled = false;
        document.getElementById("stopBtn").disabled = true;

        
    };
});



document.getElementById("stopBtn").addEventListener("click", () => {
    if (stopRecording) stopRecording();
});