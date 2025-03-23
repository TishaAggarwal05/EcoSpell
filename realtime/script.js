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





let mis_phonemeData = [];




function getPhonemeData(callback){
    let recognizedText = "";

    // This is an event that fires when speech is successfully recognized. It allows you to handle recognized speech data
    recognizer.recognized = (s, e) => {
        let data = e.result.properties.getProperty(sdk.PropertyId.SpeechServiceResponse_JsonResult);
        console.log(data);
        let jsonData = JSON.parse(data);
        if (jsonData.DisplayText) {
            recognizedText += jsonData.DisplayText + " ";
            document.getElementById("recognizedText").innerText = recognizedText;
        }


        let threshold= 70;//difficulty ke hisab se set krdenge
        let flag=0;
        jsonData.NBest[0].Words.forEach(word => {
            
            word.Phonemes.forEach(phoneme => {
                
                console.log("Phoneme:", phoneme.Phoneme, "Accuracy:", phoneme.PronunciationAssessment.AccuracyScore);
                // phonemeData.push({phoneme: phoneme.Phoneme, accuracy: phoneme.PronunciationAssessment.AccuracyScore})
                let accur= phoneme.PronunciationAssessment.AccuracyScore;
                    if(accur<threshold){
                        flag=1;
                        // console.log("Phoneme:", phoneme.Phoneme, "Accuracy:", phoneme.PronunciationAssessment.AccuracyScore);
                        mis_phonemeData.push({phoneme: phoneme.Phoneme, accuracy: phoneme.PronunciationAssessment.AccuracyScore})
                    }

                
            });
            
        });


        console.log("mis_PdaTA:",mis_phonemeData);
        callback(mis_phonemeData,flag);
        
        
    };
}



function compareP(Pdata, flag){
    if(flag==0){
        document.getElementById("scores").innerHTML= "WELL DONE! your spell was majestic"
    }else{

        console.log("mis_Phoneme Data is:", Pdata);
        for(let P of Pdata){
            document.getElementById("scores").innerHTML+=`Phoneme:${P.phoneme}=> accuracy:${P.accuracy}<br>`
        }
    }
}




document.getElementById("startBtn").addEventListener("click", () => {
    // speech is recognized
    recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);
    
    // (Optional) get the session ID
    recognizer.sessionStarted = (s, e) => {
        console.log(`SESSION ID: ${e.sessionId}`);
    };
    pronunciationAssessmentConfig.applyTo(recognizer);

    
    getPhonemeData(compareP);
    

    recognizer.canceled = (s, e) => {
        console.log(`Error: ${e.errorDetails}`);
        recognizer.stopContinuousRecognitionAsync();
    };

    recognizer.sessionStopped = (s, e) => {
        recognizer.stopContinuousRecognitionAsync();
        // onRecognizedResult();
    };

    // Start recognition
    recognizer.startContinuousRecognitionAsync();

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